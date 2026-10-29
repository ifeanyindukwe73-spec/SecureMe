import { useState, useRef } from "react";
import PrototypeNotice from "../components/PrototypeNotice";
import { readOrganizationMap } from "../components/organizationMap";
import { incidentApi } from "../lib/incidents";

interface Props {
  onBack: () => void;
}

type IncidentType = "threat" | "fight" | "weapon" | "drug" | "harassment" | "medical" | "suspicious" | "other";
type PrivacyLevel = "anonymous" | "partial" | "identified";

const INCIDENT_TYPES: { id: IncidentType; label: string; icon: string; color: string; bg: string }[] = [
  { id: "threat",     label: "Threat / Violence",     icon: "⚠️", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  { id: "fight",      label: "Physical Altercation",  icon: "🥊", color: "#EA580C", bg: "rgba(234,88,12,0.08)" },
  { id: "weapon",     label: "Weapon on Campus",      icon: "🔫", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  { id: "drug",       label: "Drug / Substance",      icon: "💊", color: "#9333EA", bg: "rgba(147,51,234,0.08)" },
  { id: "harassment", label: "Bullying / Harassment", icon: "🗣️", color: "#D97706", bg: "rgba(217,119,6,0.08)" },
  { id: "medical",    label: "Medical Emergency",     icon: "🚑", color: "#0EA5E9", bg: "rgba(14,165,233,0.08)" },
  { id: "suspicious", label: "Suspicious Activity",   icon: "👁️", color: "#6366F1", bg: "rgba(99,102,241,0.08)" },
  { id: "other",      label: "Other Safety Concern",  icon: "📋", color: "#64748B", bg: "rgba(100,116,139,0.08)" },
];

const SEVERITY: { label: string; color: string; desc: string }[] = [
  { label: "Low",      color: "#10B981", desc: "Non-urgent, no immediate danger" },
  { label: "Moderate", color: "#F59E0B", desc: "Situation developing, monitor closely" },
  { label: "High",     color: "#EA580C", desc: "Active risk — prioritize a prompt response" },
  { label: "Critical", color: "#DC2626", desc: "Immediate danger — seek emergency help now" },
];

// Named campus zones with approximate [left%, top%] positions
const DEFAULT_CAMPUS_ZONES: { id: string; label: string; x: number; y: number }[] = [
  { id: "main",     label: "Main Building",      x: 32, y: 35 },
  { id: "cafe",     label: "Cafeteria",           x: 50, y: 58 },
  { id: "gym",      label: "Gymnasium",           x: 68, y: 35 },
  { id: "library",  label: "Library",             x: 20, y: 60 },
  { id: "parking_a",label: "Parking Lot A",       x: 12, y: 22 },
  { id: "parking_b",label: "Parking Lot B",       x: 78, y: 70 },
  { id: "field",    label: "Sports Field",        x: 72, y: 20 },
  { id: "auditorium",label: "Auditorium",         x: 48, y: 78 },
  { id: "bus_stop", label: "Bus Stop",            x: 88, y: 48 },
];

const HALLWAY_IMG = "https://images.unsplash.com/photo-1495433923968-85c6751d2df6?w=800&h=200&fit=crop&auto=format";

export default function ReporterFlow({ onBack }: Props) {
  const [savedMap] = useState(() => readOrganizationMap());
  const campusZones = savedMap.map?.zones.length
    ? savedMap.map.zones.map(zone => ({ ...zone, id: String(zone.id) }))
    : DEFAULT_CAMPUS_ZONES;
  const organizationName = savedMap.map?.organization || "Lincoln High School";
  const [step, setStep]               = useState(1);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [severity, setSeverity]       = useState(0);
  const [pinZone, setPinZone]         = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy]         = useState<PrivacyLevel>("anonymous");
  const [contactName, setContactName] = useState("");
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reportId, setReportId]       = useState<string | null>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);

  const selectedType = INCIDENT_TYPES.find(t => t.id === incidentType);
  const pinZoneLabel = campusZones.find(z => z.id === pinZone)?.label ?? null;
  const TOTAL_STEPS  = 4;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 10 MB.");
      e.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      URL.revokeObjectURL(imageUrl);
      if (!context) {
        setPhotoError("This image could not be prepared. Try another image.");
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (!blob) {
          setPhotoError("This image could not be prepared. Try another image.");
          return;
        }
        if (blob.size > 1_500_000) {
          setPhotoError("This image is too large to save in demo storage. Choose a smaller image.");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : null);
        reader.onerror = () => setPhotoError("This image could not be read. Try another image.");
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.82);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      setPhotoError("This image could not be opened. Try another image.");
    };
    image.src = imageUrl;
  };

  const submitReport = async () => {
    if (!selectedType || severity < 0) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const incident = await incidentApi.create({
        type: selectedType.label,
        icon: selectedType.icon,
        severity: severity + 1,
        location: pinZoneLabel ?? "Not specified",
        privacy,
        description,
        hasPhoto: Boolean(photoPreview),
        photoDataUrl: photoPreview,
        reporterName: privacy === "identified" ? contactName.trim() : null,
      });
      setReportId(incident.id);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Your report could not be submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && reportId) return <SuccessScreen reportId={reportId} severity={severity} onBack={onBack} />;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FC", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ position: "relative", height: "120px", background: "#0B1120", overflow: "hidden", flexShrink: 0 }}>
        <img src={HALLWAY_IMG} alt="School hallway" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", opacity: 0.35 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,14,28,0.3), rgba(8,14,28,0.92))" }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "flex-start", padding: "18px 20px 0", gap: "12px" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", width: "34px", height: "34px", cursor: "pointer", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "18px", color: "#FFFFFF", letterSpacing: "-0.02em" }}>Report Incident</div>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginTop: "1px" }}>{organizationName.toUpperCase()} · STEP {step} OF {TOTAL_STEPS}</div>
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i} style={{ height: "5px", width: i < step ? "20px" : "5px", borderRadius: "3px", background: i < step ? "#3B82F6" : "rgba(255,255,255,0.2)", transition: "all 0.3s ease" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        {incidentType && step > 1 && (
          <div style={{ position: "absolute", bottom: "12px", left: "20px", display: "flex", alignItems: "center", gap: "7px", background: "rgba(8,14,28,0.75)", backdropFilter: "blur(8px)", border: `1px solid ${selectedType?.color}40`, borderRadius: "20px", padding: "4px 12px 4px 8px" }}>
            <span style={{ fontSize: "13px" }}>{selectedType?.icon}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 500, color: selectedType?.color }}>{selectedType?.label}</span>
            {pinZoneLabel && <><span style={{ color: "rgba(255,255,255,0.25)", margin: "0 2px" }}>·</span><span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>📍 {pinZoneLabel}</span></>}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", maxWidth: "520px", width: "100%", margin: "0 auto", padding: "26px 20px 48px" }}>
        <PrototypeNotice>DEMO DATA · Submitting saves a sample report in this browser and adds it to the response-team board. No external notifications or emergency dispatch are sent.</PrototypeNotice>
        {savedMap.error && <p className="form-error" role="alert">Could not load the saved organization map: {savedMap.error}</p>}

        {/* ── STEP 1: Incident type + severity ── */}
        {step === 1 && (
          <div className="animate-slide-up">
            <SectionHeader title="What's happening?" sub="Select the type and severity of the incident." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "22px" }}>
              {INCIDENT_TYPES.map(t => {
                const active = incidentType === t.id;
                return (
                  <button key={t.id} onClick={() => setIncidentType(t.id)} style={{ background: active ? t.bg : "#FFFFFF", border: `2px solid ${active ? t.color : "#DDE2EF"}`, borderRadius: "12px", padding: "14px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", boxShadow: active ? `0 0 0 3px ${t.color}18` : "none" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px", lineHeight: 1 }}>{t.icon}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: active ? t.color : "#0B1120", lineHeight: 1.3 }}>{t.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Severity */}
            <div style={{ background: "#FFFFFF", border: "1px solid #DDE2EF", borderRadius: "14px", padding: "18px", marginBottom: "26px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "#0B1120" }}>Severity</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: SEVERITY[severity].color }}>{SEVERITY[severity].label}</span>
              </div>
              <div style={{ display: "flex", gap: "7px", marginBottom: "10px" }}>
                {SEVERITY.map((s, i) => (
                  <button key={s.label} onClick={() => setSeverity(i)} style={{ flex: 1, padding: "8px 0", borderRadius: "8px", border: `2px solid ${severity === i ? s.color : "#DDE2EF"}`, background: severity === i ? s.color + "14" : "#F8F9FC", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, color: severity === i ? s.color : "#6B7B9A", transition: "all 0.15s" }}>{s.label}</button>
                ))}
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B7B9A", margin: 0 }}>{SEVERITY[severity].desc}</p>
              {severity >= 2 && (
                <div style={{ marginTop: "10px", background: SEVERITY[severity].color + "10", border: `1px solid ${SEVERITY[severity].color}30`, borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px" }}>🔔</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: SEVERITY[severity].color }}>
                    {severity === 3 ? "Critical — response team will be notified instantly." : "High — alert sent to on-duty responders."}
                  </span>
                </div>
              )}
            </div>

            <PrimaryBtn disabled={!incidentType} onClick={() => setStep(2)}>Continue →</PrimaryBtn>
          </div>
        )}

        {/* ── STEP 2: Location pin + photo ── */}
        {step === 2 && (
          <div className="animate-slide-up">
            <SectionHeader title="Pin the location" sub="Tap a zone on the campus map, then add a photo if it's safe to do so." />

            {/* Campus map */}
            <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "2px solid #DDE2EF", marginBottom: "18px", background: "#E8EDF8" }}>
              <img
                src={savedMap.map?.image ?? "https://images.unsplash.com/photo-1776536025707-9a0a915f85a5?w=800&h=450&fit=crop&auto=format"}
                alt={`${organizationName} safety map`}
                style={{ width: "100%", display: "block", opacity: 0.45, objectFit: "cover", height: "230px" }}
              />
              {/* Overlay tint */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(11,17,32,0.55)" }} />
              {/* Zone buttons */}
              {campusZones.map(zone => {
                const active = pinZone === zone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => setPinZone(active ? null : zone.id)}
                    title={zone.label}
                    style={{
                      position: "absolute",
                      left: `${zone.x}%`, top: `${zone.y}%`,
                      transform: "translate(-50%, -50%)",
                      background: active ? "#1D4ED8" : "rgba(255,255,255,0.15)",
                      border: `2px solid ${active ? "#3B82F6" : "rgba(255,255,255,0.3)"}`,
                      borderRadius: "50%", width: active ? "38px" : "28px", height: active ? "38px" : "28px",
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      backdropFilter: "blur(4px)",
                      boxShadow: active ? "0 0 0 8px rgba(29,78,216,0.25)" : "none",
                    }}
                  >
                    {active
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="10" r="4" fill="white"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/></svg>
                      : <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "rgba(255,255,255,0.8)" }} />
                    }
                  </button>
                );
              })}
              {/* Labels for zones */}
              {campusZones.map(zone => (
                <div
                  key={zone.id + "-label"}
                  style={{
                    position: "absolute",
                    left: `${zone.x}%`, top: `calc(${zone.y}% + 20px)`,
                    transform: "translateX(-50%)",
                    fontFamily: "var(--font-data)", fontSize: "9px",
                    color: pinZone === zone.id ? "#93C5FD" : "rgba(255,255,255,0.45)",
                    letterSpacing: "0.04em", whiteSpace: "nowrap",
                    transition: "color 0.2s", pointerEvents: "none",
                    fontWeight: pinZone === zone.id ? 600 : 400,
                  }}
                >{zone.label}</div>
              ))}
              {/* Legend */}
              <div style={{ position: "absolute", bottom: "10px", right: "12px", fontFamily: "var(--font-data)", fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>TAP A ZONE TO PIN</div>
            </div>

            {pinZone && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#EFF2FF", border: "1px solid #BFCBF5", borderRadius: "8px", padding: "10px 14px", marginBottom: "18px" }}>
                <span style={{ fontSize: "16px" }}>📍</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: "#1D4ED8" }}>{pinZoneLabel}</span>
                <button onClick={() => setPinZone(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#6B7B9A", cursor: "pointer", fontSize: "14px" }}>✕</button>
              </div>
            )}

            {/* Photo upload */}
            <div style={{ marginBottom: "26px" }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "#0B1120", marginBottom: "8px" }}>
                Add a Photo <span style={{ fontWeight: 400, color: "#6B7B9A" }}>(optional — only if safe)</span>
              </div>
              <input id="report-photo" name="report-photo" ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
              {photoPreview ? (
                <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "2px solid #DDE2EF" }}>
                  <img src={photoPreview} alt="Attached photo" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.6) 100%)" }} />
                  <div style={{ position: "absolute", bottom: "10px", left: "12px", right: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>PHOTO ATTACHED</span>
                    <button onClick={() => setPhotoPreview(null)} style={{ background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", padding: "3px 8px", cursor: "pointer" }}>Remove</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{ width: "100%", padding: "28px 16px", background: "#FFFFFF", border: "2px dashed #DDE2EF", borderRadius: "12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", transition: "all 0.15s" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "#1D4ED8"; e.currentTarget.style.background = "#F5F7FF"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "#DDE2EF"; e.currentTarget.style.background = "#FFFFFF"; }}
                >
                  <span style={{ fontSize: "28px" }}>📷</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "#0B1120" }}>Tap to attach a photo</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B7B9A" }}>Photo is encrypted in transit and access-controlled</span>
                </button>
              )}
              {photoError && <p className="form-error" role="alert" style={{ marginTop: "8px", color: "#B91C1C" }}>{photoError}</p>}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <SecondaryBtn onClick={() => setStep(1)}>← Back</SecondaryBtn>
              <PrimaryBtn onClick={() => setStep(3)}>Continue →</PrimaryBtn>
            </div>
          </div>
        )}

        {/* ── STEP 3: Description ── */}
        {step === 3 && (
          <div className="animate-slide-up">
            <SectionHeader title="Describe what happened" sub="Any detail helps — what you saw, heard, or noticed." />

            <div style={{ marginBottom: "26px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <label htmlFor="report-description" style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "#0B1120" }}>Your description</label>
                <span style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: description.length > 420 ? "#EA580C" : "#A0ABC0" }}>{description.length}/500</span>
              </div>
              <textarea
                id="report-description"
                name="report-description"
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 500))}
                placeholder="e.g. I saw two students arguing near the north exit. One appeared to have something in their jacket…"
                rows={6}
                style={{ width: "100%", padding: "14px", border: "2px solid #DDE2EF", borderRadius: "12px", fontFamily: "var(--font-body)", fontSize: "14px", color: "#0B1120", background: "#FFFFFF", resize: "none", outline: "none", lineHeight: 1.7, transition: "border-color 0.15s" }}
                onFocus={e => (e.target.style.borderColor = "#1D4ED8")}
                onBlur={e => (e.target.style.borderColor = "#DDE2EF")}
              />
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#A0ABC0", marginTop: "8px" }}>This is completely optional. Even a partial description is helpful.</p>
            </div>

            {/* Prompt chips */}
            <div style={{ marginBottom: "26px" }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#A0ABC0", letterSpacing: "0.06em", marginBottom: "10px" }}>QUICK DETAILS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["Person in red hoodie", "Student involved", "Adult (not staff)", "Ongoing right now", "Already left the area", "Weapon visible", "Other students watching"].map(chip => (
                  <button
                    key={chip}
                    onClick={() => setDescription(d => d ? d + " " + chip + "." : chip + ".")}
                    style={{ padding: "6px 12px", background: "#FFFFFF", border: "1px solid #DDE2EF", borderRadius: "20px", fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B7B9A", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "#1D4ED8"; e.currentTarget.style.color = "#1D4ED8"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "#DDE2EF"; e.currentTarget.style.color = "#6B7B9A"; }}
                  >+ {chip}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <SecondaryBtn onClick={() => setStep(2)}>← Back</SecondaryBtn>
              <PrimaryBtn onClick={() => setStep(4)}>Continue →</PrimaryBtn>
            </div>
          </div>
        )}

        {/* ── STEP 4: Privacy + submit ── */}
        {step === 4 && (
          <div className="animate-slide-up">
            <SectionHeader title="Privacy & Submit" sub="You control exactly how much information is shared with responders." />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {([
                { id: "anonymous" as PrivacyLevel, icon: "🕶️", title: "Fully Anonymous", desc: "No identifying information collected or stored. Your IP is not logged.", badge: "RECOMMENDED", badgeColor: "#10B981" },
                { id: "partial" as PrivacyLevel,   icon: "🎓", title: "Partial — Grade Only", desc: "Only your grade level is shared so context can inform response.", badge: null, badgeColor: "" },
                { id: "identified" as PrivacyLevel, icon: "🪪", title: "Share My Name", desc: "Responders can follow up with you directly for more details.", badge: null, badgeColor: "" },
              ]).map(opt => {
                const active = privacy === opt.id;
                return (
                  <button key={opt.id} onClick={() => setPrivacy(opt.id)} style={{ background: active ? "#EFF2FF" : "#FFFFFF", border: `2px solid ${active ? "#1D4ED8" : "#DDE2EF"}`, borderRadius: "14px", padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "flex-start", gap: "14px", boxShadow: active ? "0 0 0 3px rgba(29,78,216,0.1)" : "none" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: active ? "rgba(29,78,216,0.1)" : "#F8F9FC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{opt.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: "#0B1120" }}>{opt.title}</span>
                        {opt.badge && <span style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: opt.badgeColor, background: opt.badgeColor + "18", padding: "2px 7px", borderRadius: "4px", letterSpacing: "0.06em" }}>{opt.badge}</span>}
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B7B9A", lineHeight: 1.55, margin: 0 }}>{opt.desc}</p>
                    </div>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, border: `2px solid ${active ? "#1D4ED8" : "#C0CADC"}`, background: active ? "#1D4ED8" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {active && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FFF" }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {privacy === "identified" && (
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="report-contact-name" style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "#0B1120", marginBottom: "8px" }}>Your name</label>
                <input
                  id="report-contact-name"
                  name="report-contact-name"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="First name is enough"
                  style={{ width: "100%", padding: "12px 14px", border: "2px solid #DDE2EF", borderRadius: "10px", fontFamily: "var(--font-body)", fontSize: "14px", color: "#0B1120", background: "#FFFFFF", outline: "none", transition: "border-color 0.15s" }}
                  onFocus={e => (e.target.style.borderColor = "#1D4ED8")}
                  onBlur={e => (e.target.style.borderColor = "#DDE2EF")}
                />
              </div>
            )}

            {/* Summary */}
            <div style={{ background: "#0B1120", borderRadius: "14px", padding: "18px", marginBottom: "22px" }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.08em", marginBottom: "14px" }}>REPORT SUMMARY</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <SummaryRow label="TYPE"     value={selectedType?.label ?? "—"} icon={selectedType?.icon} />
                <SummaryRow label="SEVERITY" value={SEVERITY[severity].label}   color={SEVERITY[severity].color} />
                <SummaryRow label="LOCATION" value={pinZoneLabel ?? "Not specified"} />
                <SummaryRow label="PHOTO"    value={photoPreview ? "Attached" : "None"} />
                <SummaryRow label="PRIVACY"  value={privacy === "anonymous" ? "Fully Anonymous" : privacy === "partial" ? "Grade Level Only" : contactName || "Identified"} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <SecondaryBtn onClick={() => setStep(3)}>← Back</SecondaryBtn>
              <button
                onClick={() => void submitReport()}
                disabled={submitting}
                style={{ flex: 2, padding: "14px", background: submitting ? "#8B9AB8" : "#DC2626", color: "#FFFFFF", border: "none", borderRadius: "12px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "15px", cursor: submitting ? "wait" : "pointer", letterSpacing: "-0.01em", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 16px rgba(220,38,38,0.35)" }}
              >
                <span style={{ fontSize: "16px" }}>🚨</span> {submitting ? "Sending report…" : "Submit Report"}
              </button>
            </div>
            {submitError && <p className="form-error" role="alert" style={{ marginTop: "12px", color: "#B91C1C" }}>{submitError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small shared UI ──────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700, color: "#0B1120", letterSpacing: "-0.02em", marginBottom: "4px" }}>{title}</h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#6B7B9A" }}>{sub}</p>
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ flex: 2, width: "100%", padding: "15px", background: disabled ? "#E5E9F5" : "#1D4ED8", color: disabled ? "#A0ABC0" : "#FFFFFF", border: "none", borderRadius: "12px", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "15px", cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "-0.01em", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "14px", background: "#FFFFFF", color: "#6B7B9A", border: "2px solid #DDE2EF", borderRadius: "12px", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

function SummaryRow({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: color ?? "#E8EDF8", display: "flex", alignItems: "center", gap: "5px" }}>
        {icon && <span>{icon}</span>}{value}
      </span>
    </div>
  );
}

function SuccessScreen({ reportId, severity, onBack }: { reportId: string; severity: number; onBack: () => void }) {
  const isCritical = severity >= 2;
  return (
    <div style={{ minHeight: "100vh", background: "#080E1C", display: "flex", flexDirection: "column" }}>
      <div style={{ height: "180px", position: "relative", overflow: "hidden", background: "#0B1120" }}>
        <img src="https://images.unsplash.com/photo-1580795479225-c50ab8c3348d?w=800&h=300&fit=crop&auto=format" alt="Response team" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 20%, #080E1C 100%)" }} />
        <div style={{ position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 12px rgba(16,185,129,0.15), 0 0 0 24px rgba(16,185,129,0.07)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>

      <div className="animate-slide-up" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 24px 48px", textAlign: "center", maxWidth: "400px", margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "30px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.025em", marginBottom: "10px" }}>Report Received</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#8B9AB8", lineHeight: 1.65, marginBottom: "28px" }}>
          Your report has been saved to the response-team board. The team will need to review it; no external alert or emergency dispatch is sent.
        </p>

        {isCritical && (
          <div style={{ width: "100%", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "12px", padding: "14px 18px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>🔔</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#FCA5A5" }}>For immediate danger, contact local emergency services now. This demo does not dispatch emergency help.</span>
          </div>
        )}

        <div style={{ width: "100%", background: "#111827", borderRadius: "14px", padding: "22px", marginBottom: "18px", border: "1px solid #1E2D47" }}>
          <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.08em", marginBottom: "10px" }}>REPORT ID</div>
          <div style={{ fontFamily: "var(--font-data)", fontSize: "36px", fontWeight: 500, color: "#3B82F6", letterSpacing: "0.1em" }}>{reportId}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#4B5A78", marginTop: "8px" }}>Save this to track your report status</div>
        </div>

        <div style={{ width: "100%", background: "#0D1E3A", border: "1px solid #1E2D47", borderRadius: "12px", padding: "14px 18px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#1E2D47", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>⏱️</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#8B9AB8" }}>Average response time at Lincoln High</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: "#E8EDF8", marginTop: "1px" }}>2 minutes 14 seconds</div>
          </div>
        </div>

        <button onClick={onBack} style={{ width: "100%", padding: "14px", background: "transparent", color: "#8B9AB8", border: "1px solid #1E2D47", borderRadius: "12px", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all 0.15s" }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "#2D4480"; e.currentTarget.style.color = "#E8EDF8"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "#1E2D47"; e.currentTarget.style.color = "#8B9AB8"; }}>
          Return to Home
        </button>
      </div>
    </div>
  );
}
