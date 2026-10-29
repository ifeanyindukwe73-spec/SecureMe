import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import PrototypeNotice from "../components/PrototypeNotice";
import { readOrganizationMap } from "../components/organizationMap";
import { INCIDENTS_UPDATED_EVENT, incidentApi, type Incident, type IncidentStatus } from "../lib/incidents";

interface Props {
  onBack: () => void;
}

type IncidentRecord = {
  id: string;
  date: string;
  category: string;
  location: string;
  status: IncidentStatus;
  severity: number;
  responseMinutes: number | null;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CATEGORY_COLORS: Record<string, string> = {
  Bullying: "#D97706",
  Suspicious: "#6366F1",
  Altercation: "#EA580C",
  Drug: "#9333EA",
  Threat: "#DC2626",
  Medical: "#0EA5E9",
  Weapon: "#16A34A",
  Other: "#64748B",
};

function heatColor(val: number, maxHeat: number): string {
  if (val === 0) return "#111827";
  const t = val / maxHeat;
  if (t < 0.33) return `rgba(59,130,246,${0.15 + t * 0.6})`;
  if (t < 0.66) return `rgba(245,158,11,${0.3 + t * 0.5})`;
  return `rgba(220,38,38,${0.4 + t * 0.5})`;
}

const CAMPUS_IMG = "https://images.unsplash.com/photo-1776536025707-9a0a915f85a5?w=900&h=500&fit=crop&auto=format";
const OPS_IMG = "https://images.unsplash.com/photo-1580795479225-c50ab8c3348d?w=1200&h=200&fit=crop&auto=format";

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function categoryFor(type: string) {
  const value = type.toLowerCase();
  if (value.includes("bully") || value.includes("harass")) return "Bullying";
  if (value.includes("suspicious")) return "Suspicious";
  if (value.includes("altercation") || value.includes("fight")) return "Altercation";
  if (value.includes("drug") || value.includes("substance")) return "Drug";
  if (value.includes("medical")) return "Medical";
  if (value.includes("weapon")) return "Weapon";
  if (value.includes("threat") || value.includes("violence")) return "Threat";
  return "Other";
}

function toIncidentRecord(incident: Incident): IncidentRecord {
  const reportedAt = new Date(incident.reportedAt);
  const responseEvent = incident.history
    .filter(event => event.action === "Assignment updated" || event.action === "Investigation update" ||
      (event.action === "Status updated" && /to (active|resolved)/i.test(event.detail)))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0];
  return {
    id: incident.id,
    date: dateInputValue(reportedAt),
    category: categoryFor(incident.type),
    location: incident.location,
    status: incident.status,
    severity: incident.severity,
    responseMinutes: responseEvent
      ? Math.max(0, Math.round((Date.parse(responseEvent.createdAt) - reportedAt.getTime()) / 60_000))
      : null,
  };
}

export default function TrendsDashboard({ onBack }: Props) {
  const [savedMap] = useState(() => readOrganizationMap());
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dataError, setDataError] = useState("");
  const [endDate, setEndDate] = useState(() => dateInputValue(new Date()));
  const [startDate, setStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return dateInputValue(start);
  });

  useEffect(() => {
    let disposed = false;
    const refresh = async () => {
      try {
        const latest = await incidentApi.list();
        if (!disposed) {
          setIncidents(latest);
          setDataError("");
        }
      } catch (error) {
        if (!disposed) setDataError(error instanceof Error ? error.message : "Could not load trend data.");
      }
    };
    void refresh();
    window.addEventListener(INCIDENTS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      disposed = true;
      window.removeEventListener(INCIDENTS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const organizationName = savedMap.map?.organization ?? "Lincoln High School";
  const incidentRecords = useMemo(() => incidents.map(toIncidentRecord), [incidents]);

  const filteredRecords = useMemo(() => {
    return incidentRecords.filter(record => record.date >= startDate && record.date <= endDate);
  }, [incidentRecords, startDate, endDate]);

  const totalReports = filteredRecords.length;
  const resolvedReports = filteredRecords.filter(record => record.status === "resolved").length;
  const activeReports = filteredRecords.filter(record => record.status === "active").length;
  const pendingReports = filteredRecords.filter(record => record.status === "pending").length;
  const backlogCount = activeReports + pendingReports;
  const respondedRecords = filteredRecords.filter(record => record.responseMinutes !== null);
  const avgResponse = respondedRecords.length
    ? `${Math.round(respondedRecords.reduce((sum, record) => sum + (record.responseMinutes ?? 0), 0) / respondedRecords.length)}m`
    : "—";
  const resolvedRate = totalReports ? Math.round((resolvedReports / totalReports) * 100) : 0;

  const dailyTrend = useMemo(() => {
    const byDay = new Map<string, { day: string; incidents: number; resolved: number }>();
    for (const record of filteredRecords) {
      const key = record.date;
      const current = byDay.get(key) ?? { day: key.slice(5), incidents: 0, resolved: 0 };
      current.incidents += 1;
      if (record.status === "resolved") current.resolved += 1;
      byDay.set(key, current);
    }
    return Array.from(byDay.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([, item]) => ({ ...item, day: item.day.replace("-", "/") }));
  }, [filteredRecords]);

  const categoryData = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const record of filteredRecords) {
      grouped.set(record.category, (grouped.get(record.category) ?? 0) + 1);
    }
    return Array.from(grouped.entries())
      .map(([name, count]) => ({ name, count, color: CATEGORY_COLORS[name] ?? "#64748B" }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  const hotspots = useMemo(() => {
    const grouped = new Map<string, { label: string; count: number; x: number; y: number; color: string }>();
    for (const record of filteredRecords) {
      const existing = grouped.get(record.location) ?? { label: record.location, count: 0, x: 50, y: 50, color: "#64748B" };
      existing.count += 1;
      grouped.set(record.location, existing);
    }
    const preset = [
      { label: "Cafeteria", x: 50, y: 58 },
      { label: "Parking Lot A", x: 12, y: 22 },
      { label: "Gymnasium", x: 68, y: 35 },
      { label: "Main Hallway", x: 32, y: 35 },
      { label: "Main Building", x: 32, y: 35 },
      { label: "Sports Field", x: 72, y: 20 },
      { label: "Library", x: 20, y: 60 },
      { label: "Restroom 2F", x: 38, y: 50 },
      { label: "Restroom — 2nd Floor", x: 38, y: 50 },
      { label: "Bus Stop", x: 88, y: 48 },
    ];
    return Array.from(grouped.values()).map(item => {
      const savedZone = savedMap.map?.zones.find(zone =>
        item.label.toLowerCase().includes(zone.label.toLowerCase()) || zone.label.toLowerCase().includes(item.label.toLowerCase()));
      const presetMatch = preset.find(zone => zone.label.toLowerCase() === item.label.toLowerCase());
      return {
        ...item,
        x: savedZone?.x ?? presetMatch?.x ?? 50,
        y: savedZone?.y ?? presetMatch?.y ?? 50,
        color: item.count >= 15 ? "#DC2626" : item.count >= 8 ? "#F59E0B" : "#10B981",
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredRecords, savedMap.map?.zones]);

  const heatmapData = useMemo(() => {
    const counts = DAYS.map(() => HOURS.map(() => 0));
    for (const record of filteredRecords) {
      const reportedAt = new Date(incidents.find(incident => incident.id === record.id)?.reportedAt ?? `${record.date}T00:00:00`);
      const dayIndex = (reportedAt.getDay() + 6) % 7;
      counts[dayIndex][reportedAt.getHours()] += 1;
    }
    return counts;
  }, [filteredRecords, incidents]);

  const maxHeat = Math.max(1, ...heatmapData.flat());
  const maxHotspotCount = Math.max(1, ...hotspots.map(hotspot => hotspot.count));
  const dayTotals = heatmapData.map(day => day.reduce((sum, count) => sum + count, 0));
  const busiestDayIndex = dayTotals.indexOf(Math.max(0, ...dayTotals));
  const peakHourIndex = heatmapData.flat().indexOf(maxHeat);
  const peakHour = Math.floor(peakHourIndex / HOURS.length);
  const peakHourLabel = peakHourIndex < 0 || totalReports === 0
    ? "No reports"
    : `${peakHour === 0 ? 12 : peakHour > 12 ? peakHour - 12 : peakHour}${peakHour >= 12 ? " PM" : " AM"}`;

  const metrics = [
    { label: "TOTAL REPORTS", value: String(totalReports), delta: `${totalReports} incident${totalReports === 1 ? "" : "s"} in range`, up: true, definition: "Count of submitted incidents in the selected date range, using the same incident records as the response board." },
    { label: "RESOLVED RATE", value: `${resolvedRate}%`, delta: `${resolvedReports} resolved`, up: true, definition: "Resolved incidents divided by all incidents reported in the selected date range. Current response-board status is used." },
    { label: "AVG FIRST RESPONSE", value: avgResponse, delta: `${respondedRecords.length} with a recorded response`, up: true, definition: "Average time from report submission to the first assignment, investigation update, or transition to active/resolved. Shows — when no first response is recorded." },
    { label: "UNRESOLVED BACKLOG", value: String(backlogCount), delta: `${pendingReports} pending · ${activeReports} active`, up: false, definition: "Incidents in the selected date range that are currently active or pending on the response board." },
  ];

  const exportReport = () => {
    const headers = ["incidentId", "date", "category", "location", "status", "severity", "firstResponseMinutes"];
    const rows = filteredRecords.map(record => [
      record.id,
      record.date,
      record.category,
      record.location,
      record.status,
      record.severity,
      record.responseMinutes,
    ]);
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `safecircle-aggregate-report-${startDate}-to-${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080E1C", display: "flex", flexDirection: "column" }}>
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

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <PrototypeNotice>DEMO DATA · Trends below are calculated from the same browser-stored incidents, categories, locations, and current statuses shown on the response board. They are not live organizational statistics.</PrototypeNotice>
        {dataError && <p className="form-error" role="alert">{dataError}</p>}
        {!dataError && incidents.length === 0 && <p style={{ color: "#8B9AB8", fontSize: "12px" }}>Loading incident data…</p>}
        {savedMap.error && <p className="form-error" role="alert">Could not load the organization map: {savedMap.error}</p>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "18px", background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "16px 18px", alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.07em" }}>FROM</label>
            <input aria-label="Start date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate} style={{ background: "#111827", border: "1px solid #1E2D47", borderRadius: "8px", color: "#E8EDF8", padding: "8px 10px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.07em" }}>TO</label>
            <input aria-label="End date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} style={{ background: "#111827", border: "1px solid #1E2D47", borderRadius: "8px", color: "#E8EDF8", padding: "8px 10px" }} />
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button aria-label="Export authorized aggregate report" type="button" onClick={exportReport} style={{ background: "linear-gradient(135deg, #1D4ED8, #60A5FA)", border: "none", borderRadius: "10px", padding: "10px 14px", color: "#F8FBFF", fontFamily: "var(--font-body)", fontWeight: 600, cursor: "pointer" }}>
              Export authorized report
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "22px" }}>
          {metrics.map(k => (
            <div key={k.label} title={k.definition} style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.08em" }}>{k.label}</div>
                <span style={{ fontSize: "12px", color: "#7C8DAE" }}>ⓘ</span>
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "26px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "6px" }}>{k.value}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: k.up ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.12)", borderRadius: "4px", padding: "2px 8px" }}>
                <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: k.up ? "#10B981" : "#F59E0B", letterSpacing: "0.04em" }}>{k.delta}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginBottom: "24px" }}>
          {metrics.map(metric => (
            <div key={`${metric.label}-definition`} style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.08em", marginBottom: "6px" }}>{metric.label}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#C0CEE8", lineHeight: 1.5 }}>{metric.definition}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px 20px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em" }}>Daily Incidents</div>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginTop: "2px" }}>{startDate}–{endDate}</div>
              </div>
              <div style={{ display: "flex", gap: "14px" }}>
                <LegendDot color="#3B82F6" label="Reported" />
                <LegendDot color="#10B981" label="Resolved" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
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
                <Area type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} fill="url(#gGreen)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em", marginBottom: "4px" }}>By Category</div>
            <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginBottom: "18px" }}>{startDate}–{endDate}</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 48 }}>
                <XAxis type="number" tick={{ fontFamily: "var(--font-data)", fontSize: 9, fill: "#4B5A78" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontFamily: "var(--font-data)", fontSize: 10, fill: "#8B9AB8", letterSpacing: "0.02em" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E2D47", borderRadius: "8px", fontFamily: "var(--font-body)", fontSize: "12px", color: "#E8EDF8" }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={12}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em" }}>Incident Heatmap</div>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginTop: "2px" }}>REPORTS BY DAY AND HOUR</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.05em" }}>LOW</span>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{ width: "18px", height: "10px", borderRadius: "2px", background: i === 0 ? "#111827" : i < 0.33 ? `rgba(59,130,246,${0.2 + i * 0.6})` : i < 0.66 ? `rgba(245,158,11,${0.4 + i * 0.4})` : `rgba(220,38,38,${0.5 + i * 0.4})` }} />
              ))}
              <span style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.05em" }}>HIGH</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", paddingTop: "18px", paddingBottom: "4px" }}>
              {DAYS.map(d => (
                <div key={d} style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.04em", lineHeight: 1, height: "22px", display: "flex", alignItems: "center" }}>{d}</div>
              ))}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, marginBottom: "4px" }}>
                {HOURS.map(h => (
                  <div key={h} style={{ fontFamily: "var(--font-data)", fontSize: "8px", color: h % 3 === 0 ? "#4B5A78" : "transparent", textAlign: "center", letterSpacing: "0em" }}>
                    {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
                  </div>
                ))}
              </div>
              {DAYS.map((_, di) => (
                <div key={di} style={{ display: "grid", gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, gap: "2px", marginBottom: "2px" }}>
                  {HOURS.map(h => {
                    const val = heatmapData[di][h];
                    return (
                      <div
                        key={h}
                        title={`${DAYS[di]} ${h}:00 — ${val} report${val !== 1 ? "s" : ""}`}
                        style={{ height: "20px", borderRadius: "3px", background: heatColor(val, maxHeat), transition: "opacity 0.15s", cursor: val > 0 ? "pointer" : "default" }}
                        onMouseOver={e => { if (val > 0) (e.currentTarget as HTMLDivElement).style.opacity = "0.75"; }}
                        onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            {[
              { label: "🔥 Peak reporting hour", value: peakHourLabel, sub: `${totalReports ? maxHeat : 0} incident${maxHeat === 1 ? "" : "s"} in that hour` },
              { label: "📆 Busiest day", value: totalReports ? DAYS[busiestDayIndex] : "No reports", sub: `${totalReports ? dayTotals[busiestDayIndex] : 0} incident${dayTotals[busiestDayIndex] === 1 ? "" : "s"} in range` },
              { label: "📍 Locations represented", value: String(hotspots.length), sub: "from submitted incidents" },
            ].map(c => (
              <div key={c.label} style={{ flex: 1, minWidth: "140px", background: "#111827", border: "1px solid #1E2D47", borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginBottom: "5px" }}>{c.label}</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em", marginBottom: "2px" }}>{c.value}</div>
                <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78" }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em" }}>Campus Hotspot Map</div>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#4B5A78", letterSpacing: "0.05em", marginTop: "2px" }}>INCIDENT DENSITY BY LOCATION · {startDate}–{endDate}</div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[{ color: "#DC2626", label: "Critical (15+)" }, { color: "#F59E0B", label: "Moderate (8–14)" }, { color: "#10B981", label: "Low (< 8)" }].map(l => <LegendDot key={l.label} color={l.color} label={l.label} />)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "16px" }}>
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #1E2D47" }}>
              <img src={savedMap.map?.image ?? CAMPUS_IMG} alt={`${organizationName} safety map`} style={{ width: "100%", display: "block", height: "320px", objectFit: "cover", opacity: 0.35 }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(8,14,28,0.6)" }} />
              {hotspots.map(hs => {
                const radius = 14 + hs.count * 1.4;
                return (
                  <div key={hs.label} style={{ position: "absolute", left: `${hs.x}%`, top: `${hs.y}%`, transform: "translate(-50%,-50%)", zIndex: 2 }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${hs.color}`, animation: "pulse-dot 2s infinite", transform: "scale(1.5)", opacity: 0.3 }} />
                    <div style={{ width: `${radius}px`, height: `${radius}px`, borderRadius: "50%", background: hs.color + "40", border: `2px solid ${hs.color}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.15s" }} title={`${hs.label}: ${hs.count} incidents`}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: radius > 24 ? "13px" : "10px", fontWeight: 700, color: "#FFFFFF" }}>{hs.count}</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ position: "absolute", bottom: "10px", left: "12px", fontFamily: "var(--font-data)", fontSize: "9px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.07em" }}>{organizationName.toUpperCase()} — MAP VIEW</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: "#4B5A78", letterSpacing: "0.08em", marginBottom: "4px" }}>RANKED LOCATIONS</div>
              {[...hotspots].sort((a, b) => b.count - a.count).map((hs, i) => (
                <div key={hs.label} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#111827", border: "1px solid #1E2D47", borderRadius: "8px", padding: "9px 12px" }}>
                  <span style={{ fontFamily: "var(--font-data)", fontSize: "10px", color: "#3A4A65", width: "14px", textAlign: "right", flexShrink: 0 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 500, color: "#C0CEE8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hs.label}</div>
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

        <div style={{ background: "#0E1726", border: "1px solid #1E2D47", borderRadius: "14px", padding: "20px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: "#E8EDF8", letterSpacing: "-0.01em", marginBottom: "14px" }}>Unresolved incidents and backlog</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
            {filteredRecords.filter(record => record.status !== "resolved").slice(0, 6).map(record => (
              <div key={record.id} style={{ background: "#111827", border: "1px solid #1E2D47", borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#E8EDF8" }}>{record.category} · {record.id}</div>
                  <span style={{ fontFamily: "var(--font-data)", fontSize: "9px", color: record.status === "active" ? "#F87171" : "#FBBF24", letterSpacing: "0.06em" }}>{record.status.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#C0CEE8", marginBottom: "4px" }}>📍 {record.location}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#8B9AB8" }}>{record.date} · Severity {record.severity}</div>
              </div>
            ))}
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
