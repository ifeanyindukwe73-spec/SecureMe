import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import PrototypeNotice from "../components/PrototypeNotice";
import { readOrganizationMap } from "../components/organizationMap";

interface Props {
  onBack: () => void;
}

// ── Data ─────────────────────────────────────────────────────────────

const DAILY_TREND = [
  { day: "Mon 1",  incidents: 2, resolved: 2 },
  { day: "Tue 2",  incidents: 5, resolved: 4 },
  { day: "Wed 3",  incidents: 3, resolved: 3 },
  { day: "Thu 4",  incidents: 1, resolved: 1 },
  { day: "Fri 5",  incidents: 6, resolved: 5 },
  { day: "Mon 8",  incidents: 4, resolved: 4 },
  { day: "Tue 9",  incidents: 2, resolved: 2 },
  { day: "Wed 10", incidents: 7, resolved: 6 },
  { day: "Thu 11", incidents: 3, resolved: 3 },
  { day: "Fri 12", incidents: 5, resolved: 4 },
  { day: "Mon 15", incidents: 8, resolved: 7 },
  { day: "Tue 16", incidents: 4, resolved: 4 },
  { day: "Wed 17", incidents: 3, resolved: 2 },
  { day: "Thu 18", incidents: 6, resolved: 6 },
  { day: "Fri 19", incidents: 9, resolved: 7 },
  { day: "Mon 22", incidents: 5, resolved: 5 },
  { day: "Tue 23", incidents: 2, resolved: 2 },
  { day: "Wed 24", incidents: 4, resolved: 3 },
  { day: "Thu 25", incidents: 7, resolved: 6 },
  { day: "Fri 26", incidents: 3, resolved: 3 },
];

const BY_CATEGORY = [
  { name: "Bullying",   count: 14, color: "#D97706" },
  { name: "Suspicious", count: 11, color: "#6366F1" },
  { name: "Altercation",count: 9,  color: "#EA580C" },
  { name: "Drug",       count: 7,  color: "#9333EA" },
  { name: "Threat",     count: 5,  color: "#DC2626" },
  { name: "Medical",    count: 4,  color: "#0EA5E9" },
  { name: "Weapon",     count: 2,  color: "#DC2626" },
  { name: "Other",      count: 3,  color: "#64748B" },
];

// Hour of day (0–23) × day of week (Mon–Fri) heatmap
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Fixed demo values keep the public-facing sample stable across visits.
const heatmapData: number[][] = DAYS.map((_, di) =>
  HOURS.map(h => {
    if (h < 6 || h > 17) return 0;
    let base = 0;
    if (h === 8 || h === 9) base = 3 + ((di + h) % 4);
    else if (h >= 11 && h <= 13) base = 4 + ((di * 2 + h) % 6);
    else if (h === 14 || h === 15) base = 3 + ((di + h * 2) % 5);
    else base = (di + h) % 3;
    if (di === 4) base = Math.round(base * 1.3); // Fridays spike
    return Math.min(base, 9);
  })
);

const maxHeat = Math.max(...heatmapData.flat());

function heatColor(val: number): string {
  if (val === 0) return "#111827";
  const t = val / maxHeat;
  if (t < 0.33) return `rgba(59,130,246,${0.15 + t * 0.6})`;   // blue
  if (t < 0.66) return `rgba(245,158,11,${0.3 + t * 0.5})`;    // amber
  return `rgba(220,38,38,${0.4 + t * 0.5})`;                    // red
}

// Campus hotspots
const HOTSPOTS: { label: string; count: number; x: number; y: number; color: string }[] = [
  { label: "Cafeteria",    count: 18, x: 50, y: 58, color: "#DC2626" },
  { label: "Parking Lot A", count: 12, x: 12, y: 22, color: "#EA580C" },
  { label: "Gymnasium",    count: 10, x: 68, y: 35, color: "#F59E0B" },
  { label: "Main Hallway", count: 9,  x: 32, y: 35, color: "#F59E0B" },
  { label: "Sports Field", count: 7,  x: 72, y: 20, color: "#10B981" },
  { label: "Library",      count: 5,  x: 20, y: 60, color: "#10B981" },
  { label: "Restroom 2F",  count: 4,  x: 38, y: 50, color: "#6B7280" },
  { label: "Bus Stop",     count: 3,  x: 88, y: 48, color: "#6B7280" },
];

const CAMPUS_IMG = "https://images.unsplash.com/photo-1776536025707-9a0a915f85a5?w=900&h=500&fit=crop&auto=format";
const OPS_IMG    = "https://images.unsplash.com/photo-1580795479225-c50ab8c3348d?w=1200&h=200&fit=crop&auto=format";

// ── Component ────────────────────────────────────────────────────────

export default function TrendsDashboard({ onBack }: Props) {
  const [savedMap] = useState(() => readOrganizationMap());
  const organizationName = savedMap.map?.organization ?? "Lincoln High School";
  const hotspots = savedMap.map?.zones.map(zone => {
    const sample = HOTSPOTS.find(item => item.label.toLowerCase() === zone.label.toLowerCase());
    return { ...zone, count: sample?.count ?? 0, color: sample?.color ?? "#64748B" };
  }) ?? HOTSPOTS;
  const maxHotspotCount = Math.max(1, ...hotspots.map(hotspot => hotspot.count));

  return (
    <div style={{ minHeight: "100vh", background: "#080E1C", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ position: "relative", background: "#0E1726", borderBottom: "1px solid #1E2D47", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={OPS_IMG} alt="Operations center" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", opacity: 0.1 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0E1726 40%, transparent 100%)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "0 24px", height: "60px", gap: "14px" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1E2D47", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", color: "#4B5A78", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.color = "#E8EDF8"; e.currentTarget.style.borderColor = "#2D4480"; }}
            onMouseOut={e => { e.currentTarget.style.color = "#4B5A78"; e.currentTarget.style.borderColor = "#1E2D47"; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z" fill="white" opacity="0.9"/></svg>
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "15px", color: "#E8EDF8", letterSpacing: "-0.01em" }}>SafeCircle</span>
            <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#2D4480", letterSpacing: "0.06em" }}>/ TRENDS</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#111827", borderRadius: "8px", padding: "5px 12px 5px 8px", border: "1px solid #1E2D47" }}>
            <span aria-hidden="true">◉</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#8B9AB8", fontWeight: 500 }}>Community view</span>
          </div>
        </div>
      </header>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <PrototypeNotice>DEMO DATA · Aggregated sample patterns only—not live incident reports. Real deployments should suppress small groups and avoid publishing identifiable incident details.</PrototypeNotice>
        {savedMap.error && <p className="form-error" role="alert">Could not load the organization map: {savedMap.error}</p>}

        {/* ── KPI row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "TOTAL THIS MONTH", value: "55", delta: "+12%", up: true },
            { label: "RESOLVED RATE",    value: "94%", delta: "+3%", up: true },
            { label: "AVG RESPONSE",     value: "2m 14s", delta: "-18s", up: true },
            { label: "PEAK HOUR",        value: "12–1 PM", delta: "Lunch", up: false },
          ].map(k => (
            <div key={k.label} style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.08em", marginBottom: "8px" }}>{k.label}</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "26px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "6px" }}>{k.value}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: k.up ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)", borderRadius: "4px", padding: "2px 8px" }}>
                <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: k.up ? "#10B981" : "#6B7B9A", letterSpacing: "0.04em" }}>{k.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Area chart + Category bar ── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {/* Daily trend */}
          <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px 20px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em" }}>Daily Incidents</div>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginTop: "2px" }}>SEPT 1–26, 2026</div>
              </div>
              <div style={{ display: "flex", gap: "14px" }}>
                <LegendDot color="#3B82F6" label="Reported" />
                <LegendDot color="#10B981" label="Resolved" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={DAILY_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" vertical={false} />
                <XAxis dataKey="day" tick={{ fontFamily: "var(--font-data)", fontSize: 9, fill: "#4B5A78", letterSpacing: "0.04em" }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontFamily: "var(--font-data)", fontSize: 9, fill: "#4B5A78" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E2D47", borderRadius: "8px", fontFamily: "var(--font-body)", fontSize: "12px", color: "#E8EDF8" }} cursor={{ stroke: "#2D4480", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="incidents" stroke="#3B82F6" strokeWidth={2} fill="url(#gBlue)" dot={false} />
                <Area type="monotone" dataKey="resolved"  stroke="#10B981" strokeWidth={2} fill="url(#gGreen)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em", marginBottom: "4px" }}>By Category</div>
            <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginBottom: "18px" }}>SEPT 2026</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={BY_CATEGORY} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 48 }}>
                <XAxis type="number" tick={{ fontFamily: "var(--font-data)", fontSize: 9, fill: "#4B5A78" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontFamily: "var(--font-data)", fontSize: 10, fill: "#8B9AB8", letterSpacing: "0.02em" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E2D47", borderRadius: "8px", fontFamily: "var(--font-body)", fontSize: "12px", color: "#E8EDF8" }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={12}>
                  {BY_CATEGORY.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Heatmap ── */}
        <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em" }}>Incident Heatmap</div>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginTop: "2px" }}>REPORTS BY DAY AND HOUR</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.05em" }}>LOW</span>
              {[0, 0.25, 0.5, 0.75, 1].map(t => (
                <div key={t} style={{ width: "18px", height: "10px", borderRadius: "2px", background: t === 0 ? "#111827" : t < 0.33 ? `rgba(59,130,246,${0.2 + t * 0.6})` : t < 0.66 ? `rgba(245,158,11,${0.4 + t * 0.4})` : `rgba(220,38,38,${0.5 + t * 0.4})` }} />
              ))}
              <span style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.05em" }}>HIGH</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {/* Day labels */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", paddingTop: "18px", paddingBottom: "4px" }}>
              {DAYS.map(d => (
                <div key={d} style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.04em", lineHeight: 1, height: "22px", display: "flex", alignItems: "center" }}>{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              {/* Hour labels */}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, marginBottom: "4px" }}>
                {HOURS.map(h => (
                  <div key={h} style={{ fontFamily: "var(--font-data)", fontSize: "8px", color: h % 3 === 0 ? "#4B5A78" : "transparent", textAlign: "center", letterSpacing: "0em" }}>
                    {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
                  </div>
                ))}
              </div>
              {/* Cells */}
              {DAYS.map((_, di) => (
                <div key={di} style={{ display: "grid", gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, gap: "2px", marginBottom: "2px" }}>
                  {HOURS.map(h => {
                    const val = heatmapData[di][h];
                    return (
                      <div
                        key={h}
                        title={`${DAYS[di]} ${h}:00 — ${val} report${val !== 1 ? "s" : ""}`}
                        style={{ height: "20px", borderRadius: "3px", background: heatColor(val), transition: "opacity 0.15s", cursor: val > 0 ? "pointer" : "default" }}
                        onMouseOver={e => { if (val > 0) (e.currentTarget as HTMLDivElement).style.opacity = "0.75"; }}
                        onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Peak callouts */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            {[
              { label: "🔥 Hottest window", value: "Fri 12–1 PM", sub: "avg 8.4 reports" },
              { label: "📉 Quietest",        value: "Mon 6–8 AM", sub: "avg 0.2 reports" },
              { label: "📆 Riskiest day",    value: "Friday",     sub: "38% above avg" },
            ].map(c => (
              <div key={c.label} style={{ flex: 1, minWidth: "140px", background: "#111827", border: "1px solid #1E2D47", borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginBottom: "5px" }}>{c.label}</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em", marginBottom: "2px" }}>{c.value}</div>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78" }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Campus hotspot map ── */}
        <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em" }}>Campus Hotspot Map</div>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginTop: "2px" }}>INCIDENT DENSITY BY LOCATION · ALL TIME</div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[{ color: "#DC2626", label: "Critical (15+)" }, { color: "#F59E0B", label: "Moderate (8–14)" }, { color: "#10B981", label: "Low (< 8)" }].map(l => <LegendDot key={l.label} color={l.color} label={l.label} />)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "16px" }}>
            {/* Map */}
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #1E2D47" }}>
              <img src={savedMap.map?.image ?? CAMPUS_IMG} alt={`${organizationName} safety map`} style={{ width: "100%", display: "block", height: "320px", objectFit: "cover", opacity: 0.35 }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(8,14,28,0.6)" }} />
              {/* Hotspot circles */}
              {hotspots.map(hs => {
                const radius = 14 + hs.count * 1.4;
                return (
                  <div key={hs.label} style={{ position: "absolute", left: `${hs.x}%`, top: `${hs.y}%`, transform: "translate(-50%,-50%)", zIndex: 2 }}>
                    {/* Pulse ring */}
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${hs.color}`, animation: "pulse-dot 2s infinite", transform: "scale(1.5)", opacity: 0.3 }} />
                    <div
                      style={{ width: `${radius}px`, height: `${radius}px`, borderRadius: "50%", background: hs.color + "40", border: `2px solid ${hs.color}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.15s" }}
                      onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.15)"; }}
                      onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
                      title={`${hs.label}: ${hs.count} incidents`}
                    >
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: radius > 24 ? "13px" : "10px", fontWeight: 700, color: "#FFFFFF" }}>{hs.count}</span>
                    </div>
                  </div>
                );
              })}
              {/* Campus label */}
              <div style={{ position: "absolute", bottom: "10px", left: "12px", fontFamily: "var(--font-data)", fontSize: "9px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.07em" }}>{organizationName.toUpperCase()} — MAP VIEW</div>
            </div>

            {/* Ranked list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.08em", marginBottom: "4px" }}>RANKED LOCATIONS</div>
              {[...hotspots].sort((a, b) => b.count - a.count).map((hs, i) => (
                <div key={hs.label} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#111827", border: "1px solid #1E2D47", borderRadius: "8px", padding: "9px 12px" }}>
                  <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#3A4A65", width: "14px", textAlign: "right", flexShrink: 0 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 500, color: "#C0CEE8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hs.label}</div>
                    {/* Bar */}
                    <div style={{ height: "3px", background: "#1E2D47", borderRadius: "2px", marginTop: "5px" }}>
                      <div style={{ height: "100%", width: `${(hs.count / maxHotspotCount) * 100}%`, background: hs.color, borderRadius: "2px" }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700, color: hs.color, flexShrink: 0 }}>{hs.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#6B7B9A", letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
}
