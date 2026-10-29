import secureImg from "./assets/man2.png";

interface Props {
  onReport: () => void;
  onDashboard: () => void;
}

const leftImg = secureImg;
// const CAMPUS_IMG = "https://images.unsplash.com/photo-1777651860677-5e25b534db12?w=800&h=500&fit=crop&auto=format";
const OPS_IMG = "https://images.unsplash.com/photo-1580795479225-c50ab8c3348d?w=600&h=400&fit=crop&auto=format";

export default function LandingScreen({ onReport, onDashboard }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#080E1C", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1px rgba(255,255,255,0.1)" }}>
            <ShieldIcon />
          </div>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "18px", color: "#FFFFFF", letterSpacing: "-0.02em" }}>SafeCircle</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={onDashboard}
            style={{
              fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500,
              color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
              padding: "8px 16px", cursor: "pointer", transition: "all 0.15s",
              backdropFilter: "blur(8px)",
            }}
            onMouseOver={e => { (e.currentTarget).style.color = "#fff"; (e.currentTarget).style.background = "rgba(255,255,255,0.12)"; }}
            onMouseOut={e => { (e.currentTarget).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget).style.background = "rgba(255,255,255,0.07)"; }}
          >
            Response Team Login →
          </button>
        </div>
      </nav>

      {/* Hero — split layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
        {/* Left — image panel */}
        <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
          <img
            src={leftImg}
            alt="left panel background"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          {/* Gradient overlays */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,14,28,0.85) 0%, rgba(8,14,28,0.4) 60%, rgba(8,14,28,0.6) 100%)" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", background: "linear-gradient(to right, transparent, #080E1C)" }} />

          {/* Content over image */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", padding: "120px 48px 56px" }}>
            <div className="animate-fade-in">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(8,14,28,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "6px 14px", backdropFilter: "blur(8px)", marginBottom: "28px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", display: "block", boxShadow: "0 0 0 3px rgba(16,185,129,0.25)", animation: "pulse-dot 2s infinite" }} />
                <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#10B981", letterSpacing: "0.08em" }}>SYSTEM ACTIVE · LINCOLN HIGH SCHOOL</span>
              </div>
              <h1 style={{
                fontFamily: "var(--font-heading)", fontWeight: 700,
                fontSize: "clamp(38px, 5vw, 58px)", lineHeight: 1.0,
                color: "#FFFFFF", letterSpacing: "-0.03em", marginBottom: "20px",
              }}>
                See something.<br />
                <span style={{ color: "#3B82F6" }}>Say something.</span><br />
                Stay safe.
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "16px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: "380px" }}>
                SafeCircle gets your report to the right people in under 60 seconds — with full control over your privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Right — action panel */}
        <div style={{ background: "#080E1C", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 48px 56px", borderLeft: "1px solid #1E2D47" }}>
          <div className="animate-slide-up" style={{ maxWidth: "380px" }}>

            {/* Report CTA */}
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: "#8B9AB8", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "20px" }}>
                Report an Incident
              </h2>
              <button
                onClick={onReport}
                style={{
                  width: "100%",
                  padding: "18px 24px",
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "14px",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: "17px",
                  cursor: "pointer",
                  letterSpacing: "-0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  boxShadow: "0 4px 24px rgba(220,38,38,0.35)",
                }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 36px rgba(220,38,38,0.5)"; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(220,38,38,0.35)"; }}
              >
                <span style={{ fontSize: "22px", lineHeight: 1 }}>🚨</span>
                <span>Report an Incident</span>
              </button>
              <p style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.07em", textAlign: "center", marginTop: "10px" }}>
                FULLY ANONYMOUS BY DEFAULT · TAKES UNDER 60 SECONDS
              </p>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <div style={{ flex: 1, height: "1px", background: "#1E2D47" }} />
              <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.06em" }}>HOW IT WORKS</span>
              <div style={{ flex: 1, height: "1px", background: "#1E2D47" }} />
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
              {[
                { n: "1", text: "Select the incident type and severity", icon: "📋" },
                { n: "2", text: "Add location and optional details", icon: "📍" },
                { n: "3", text: "Choose your privacy level and submit", icon: "🔒" },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#111827", border: "1px solid #1E2D47", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-data)", fontSize: "11px", color: "#3B82F6", fontWeight: 500 }}>{s.n}</span>
                  </div>
                  <div style={{ paddingTop: "4px" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#8B9AB8", lineHeight: 1.5 }}>{s.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Response team card */}
            <div
              onClick={onDashboard}
              style={{
                borderRadius: "14px", overflow: "hidden", border: "1px solid #1E2D47",
                cursor: "pointer", transition: "border-color 0.15s",
                position: "relative",
              }}
              onMouseOver={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#2D4480"}
              onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#1E2D47"}
            >
              <div style={{ position: "relative", height: "110px", background: "#111827", overflow: "hidden" }}>
                <img
                  src={OPS_IMG}
                  alt="Response team at operations center"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: 0.55 }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, #111827 100%)" }} />
              </div>
              <div style={{ background: "#111827", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "#E8EDF8", marginBottom: "2px" }}>Response Team Dashboard</div>
                  <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.04em" }}>STAFF &amp; ADMIN ACCESS ONLY</div>
                </div>
                <div style={{ color: "#3B82F6", fontSize: "18px" }}>→</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stat bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: "50%", background: "rgba(8,14,28,0.85)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 48px", display: "flex", gap: "40px", zIndex: 10 }}>
        {[
          { label: "INCIDENTS TODAY", value: "3" },
          { label: "AVG RESPONSE", value: "2m 14s" },
          { label: "RESOLVED", value: "94%" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.02em" }}>{s.value}</span>
            <span style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.08em" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="white" opacity="0.9"/>
      <path d="M9 12l2 2 4-4" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
