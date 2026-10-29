import { useEffect, useMemo, useState } from "react";
import PrototypeNotice from "../components/PrototypeNotice";
import {
  incidentApi,
  type Incident,
  type IncidentNotification,
  type IncidentStatus,
} from "../lib/incidents";

interface Props {
  onBack: () => void;
  onTrends: () => void;
  onMapSetup: () => void;
}

const TEAM_MEMBERS = ["Officer Chen", "Ms. Torres", "Counselor Davis", "VP Johnson", "Nurse Williams"];
const STATUS_COLUMNS: { id: IncidentStatus; label: string; color: string }[] = [
  { id: "pending", label: "New / pending", color: "#F59E0B" },
  { id: "active", label: "In progress", color: "#3B82F6" },
  { id: "resolved", label: "Resolved", color: "#10B981" },
];
const SEVERITY_LABELS = ["", "Low", "Moderate", "High", "Critical"];
const SEVERITY_COLORS = ["", "#10B981", "#F59E0B", "#EA580C", "#DC2626"];

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Dashboard({ onBack, onTrends, onMapSetup }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<IncidentNotification[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const refresh = async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const [nextIncidents, nextNotifications] = await Promise.all([
        incidentApi.list(),
        incidentApi.notifications(),
      ]);
      setIncidents(nextIncidents);
      setNotifications(nextNotifications);
      setSelectedId(current => current && nextIncidents.some(incident => incident.id === current)
        ? current
        : nextIncidents[0]?.id ?? null);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load incident data.");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    void refresh(true);
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = incidents.find(incident => incident.id === selectedId) ?? null;
  const visibleIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return incidents.filter(incident => {
      if (statusFilter !== "all" && incident.status !== statusFilter) return false;
      return !query || [incident.id, incident.type, incident.location, incident.assignedTo ?? ""]
        .some(value => value.toLowerCase().includes(query));
    });
  }, [incidents, search, statusFilter]);

  const unreadCount = notifications.filter(notification => !notification.readAt).length;

  const updateIncident = async (changes: { status?: IncidentStatus; assignedTo?: string | null }) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const updated = await incidentApi.update(selected.id, changes);
      setIncidents(current => current.map(incident => incident.id === updated.id ? updated : incident));
      setNotifications(await incidentApi.notifications());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The incident update could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const addInvestigationNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !noteText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const updated = await incidentApi.addNote(selected.id, noteText);
      setIncidents(current => current.map(incident => incident.id === updated.id ? updated : incident));
      setNoteText("");
      setNotifications(await incidentApi.notifications());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The investigation update could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const openNotification = async (notification: IncidentNotification) => {
    setSelectedId(notification.incidentId);
    setNotificationsOpen(false);
    if (notification.readAt) return;
    try {
      const updated = await incidentApi.markNotificationRead(notification.id);
      setNotifications(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The notification could not be marked as read.");
    }
  };

  return (
    <main className="response-workspace">
      <header className="response-header">
        <div className="response-header-brand">
          <button className="button button-quiet" onClick={onBack} aria-label="Back to home">←</button>
          <span className="brand-shield" aria-hidden="true">✦</span>
          <strong>SafeCircle</strong>
          <span className="response-workspace-label">RESPONSE TEAM</span>
        </div>
        <nav className="response-nav" aria-label="Response team navigation">
          <span className="response-nav-current">Incident board</span>
          <button onClick={onTrends}>Trends</button>
          <button onClick={onMapSetup}>Organization map</button>
        </nav>
        <div className="response-header-actions">
          <span className="response-live-status"><span className="status-dot" />Demo data saved</span>
          <button
            className="response-notifications-button"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen(open => !open)}
          >
            Notifications <span>{unreadCount}</span>
          </button>
        </div>
        {notificationsOpen && (
          <section className="response-notifications" aria-label="In-app notifications">
            <div className="response-panel-heading">
              <strong>Team notifications</strong>
              <span>{unreadCount} unread</span>
            </div>
            {notifications.length === 0 && <p className="response-empty">No notifications yet.</p>}
            {notifications.map(notification => (
              <button
                className={`response-notification${notification.readAt ? "" : " is-unread"}`}
                key={notification.id}
                onClick={() => void openNotification(notification)}
              >
                <span>{notification.message}</span>
                <small>{relativeTime(notification.createdAt)} · {notification.incidentId}</small>
              </button>
            ))}
          </section>
        )}
      </header>

      <div className="response-notice">
        <PrototypeNotice>LOCAL DEMO · Reports, assignments, status changes, investigation notes, history, and in-app notifications are persisted by the local API. No sign-in, external notification channel, or emergency dispatch is configured.</PrototypeNotice>
      </div>

      <section className="response-overview">
        <div>
          <span className="eyebrow">OPERATIONS OVERVIEW</span>
          <h1>Incident response board</h1>
          <p>Coordinate ownership, investigation, and response status from one shared queue.</p>
        </div>
        <label className="response-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search incidents"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search incidents, locations, responders"
          />
        </label>
      </section>

      <section className="response-stats" aria-label="Incident totals">
        {STATUS_COLUMNS.map(column => (
          <div className="response-stat" key={column.id}>
            <span style={{ color: column.color }}>{column.label}</span>
            <strong>{incidents.filter(incident => incident.status === column.id).length}</strong>
          </div>
        ))}
        <div className="response-stat">
          <span style={{ color: "#DC2626" }}>Critical</span>
          <strong>{incidents.filter(incident => incident.severity === 4 && incident.status !== "resolved").length}</strong>
        </div>
      </section>

      {error && <div className="response-error" role="alert">{error}</div>}

      <div className="response-board-toolbar">
        <div className="response-filters" role="group" aria-label="Filter incidents by status">
          {(["all", ...STATUS_COLUMNS.map(column => column.id)] as const).map(status => (
            <button
              key={status}
              className={statusFilter === status ? "is-selected" : ""}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All incidents" : STATUS_COLUMNS.find(column => column.id === status)?.label}
            </button>
          ))}
        </div>
        <span>{visibleIncidents.length} {visibleIncidents.length === 1 ? "incident" : "incidents"}</span>
      </div>

      {loading ? (
        <div className="response-loading" role="status">Loading sample incidents…</div>
      ) : (
        <div className="response-layout">
          <section className="incident-board" aria-label="Incident workflow board">
            {STATUS_COLUMNS.map(column => {
              const columnIncidents = visibleIncidents.filter(incident => incident.status === column.id);
              return (
                <div className="incident-column" key={column.id}>
                  <div className="incident-column-heading">
                    <span><i style={{ background: column.color }} />{column.label}</span>
                    <small>{columnIncidents.length}</small>
                  </div>
                  <div className="incident-column-cards">
                    {columnIncidents.map(incident => (
                      <button
                        className={`incident-card${selectedId === incident.id ? " is-selected" : ""}`}
                        key={incident.id}
                        onClick={() => setSelectedId(incident.id)}
                      >
                        <span className="incident-card-title">
                          <span>{incident.icon}</span>
                          <strong>{incident.type}</strong>
                        </span>
                        <span className="incident-card-meta">
                          <span>{incident.id}</span>
                          <span style={{ color: SEVERITY_COLORS[incident.severity] }}>
                            {SEVERITY_LABELS[incident.severity]} priority
                          </span>
                        </span>
                        <span className="incident-card-location">⌖ {incident.location}</span>
                        <span className="incident-card-footer">
                          <span>{incident.assignedTo ? `Assigned · ${incident.assignedTo}` : "Unassigned"}</span>
                          <span>{relativeTime(incident.reportedAt)}</span>
                        </span>
                      </button>
                    ))}
                    {columnIncidents.length === 0 && (
                      <div className="incident-column-empty">
                        {search || statusFilter !== "all" ? "No matching incidents." : "Nothing in this column."}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="incident-detail" aria-label="Selected incident details">
            {!selected ? (
              <div className="incident-detail-empty">Select a report from the board to coordinate its response.</div>
            ) : (
              <>
                <div className="incident-detail-topline">
                  <span className="eyebrow">{selected.id}</span>
                  <span className="incident-severity" style={{ color: SEVERITY_COLORS[selected.severity] }}>
                    {SEVERITY_LABELS[selected.severity]} priority
                  </span>
                </div>
                <h2><span>{selected.icon}</span> {selected.type}</h2>
                <div className="incident-detail-meta">
                  <span>⌖ {selected.location}</span>
                  <span>Reported {formatTime(selected.reportedAt)}</span>
                  <span>Reporter privacy: {selected.privacy}</span>
                  {selected.hasPhoto && <span>Photo attached</span>}
                </div>
                {selected.reporterName && <p className="incident-reporter-name">Reporter: {selected.reporterName}</p>}

                <section className="incident-detail-section">
                  <h3>Reporter description</h3>
                  <p className="incident-description">{selected.description || "No additional description provided."}</p>
                </section>
                {selected.photoDataUrl && (
                  <section className="incident-detail-section">
                    <h3>Attached photo</h3>
                    <a className="incident-photo-link" href={selected.photoDataUrl} target="_blank" rel="noreferrer">
                      <img className="incident-photo" src={selected.photoDataUrl} alt={`Photo attached to ${selected.type} report ${selected.id}`} />
                      <span>Open full-size photo ↗</span>
                    </a>
                  </section>
                )}

                <section className="incident-controls" aria-label="Response controls">
                  <label>
                    <span>ASSIGN TO</span>
                    <select
                      value={selected.assignedTo ?? ""}
                      disabled={busy}
                      onChange={event => void updateIncident({ assignedTo: event.target.value || null })}
                    >
                      <option value="">Unassigned</option>
                      {TEAM_MEMBERS.map(member => <option key={member} value={member}>{member}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>STATUS</span>
                    <select
                      value={selected.status}
                      disabled={busy}
                      onChange={event => void updateIncident({ status: event.target.value as IncidentStatus })}
                    >
                      {STATUS_COLUMNS.map(column => <option key={column.id} value={column.id}>{column.label}</option>)}
                    </select>
                  </label>
                </section>

                <section className="incident-detail-section">
                  <h3>Investigation updates <span>{selected.notes.length}</span></h3>
                  <form className="incident-note-form" onSubmit={event => void addInvestigationNote(event)}>
                    <label className="visually-hidden" htmlFor="investigation-note">Add investigation update</label>
                    <textarea
                      id="investigation-note"
                      maxLength={1000}
                      value={noteText}
                      onChange={event => setNoteText(event.target.value)}
                      placeholder="Record an observation, action taken, or next step…"
                      rows={3}
                    />
                    <button className="button button-primary" type="submit" disabled={busy || !noteText.trim()}>
                      Add update
                    </button>
                  </form>
                  {selected.notes.length === 0 ? (
                    <p className="incident-empty-copy">No investigation updates have been recorded.</p>
                  ) : (
                    <div className="incident-notes">
                      {selected.notes.map(note => (
                        <article className="incident-note" key={note.id}>
                          <p>{note.text}</p>
                          <small>{note.author} · {formatTime(note.createdAt)}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="incident-detail-section">
                  <h3>Activity history <span>{selected.history.length}</span></h3>
                  <ol className="incident-history">
                    {selected.history.map(event => (
                      <li key={event.id}>
                        <span className="incident-history-dot" />
                        <div>
                          <strong>{event.action}</strong>
                          <p>{event.detail}</p>
                          <small>{event.author} · {formatTime(event.createdAt)}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
