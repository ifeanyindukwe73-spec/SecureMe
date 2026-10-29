export type IncidentStatus = "pending" | "active" | "resolved";
export type IncidentPrivacy = "anonymous" | "partial" | "identified";

export interface IncidentHistoryEvent {
  id: string;
  action: string;
  detail: string;
  author: string;
  createdAt: string;
}

export interface InvestigationNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  type: string;
  icon: string;
  severity: number;
  location: string;
  reportedAt: string;
  status: IncidentStatus;
  privacy: IncidentPrivacy;
  description: string;
  assignedTo: string | null;
  hasPhoto: boolean;
  photoDataUrl?: string | null;
  reporterName?: string | null;
  notes: InvestigationNote[];
  history: IncidentHistoryEvent[];
}

export interface IncidentNotification {
  id: string;
  incidentId: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

export interface CreateIncidentInput {
  type: string;
  icon: string;
  severity: number;
  location: string;
  privacy: IncidentPrivacy;
  description: string;
  hasPhoto: boolean;
  photoDataUrl?: string | null;
  reporterName?: string | null;
}

interface IncidentStore {
  incidents: Incident[];
  notifications: IncidentNotification[];
}

const STORAGE_KEY = "safecircle.incident-demo.v1";
export const INCIDENTS_UPDATED_EVENT = "safecircle:incidents-updated";

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function seedIncident(
  values: Omit<Incident, "notes" | "history" | "reportedAt"> & { minutesAgo: number },
): Incident {
  const { minutesAgo: minutes, ...incident } = values;
  const reportedAt = minutesAgo(minutes);
  return {
    ...incident,
    reportedAt,
    notes: [],
    history: [{
      id: crypto.randomUUID(),
      action: "Report received",
      detail: "Sample incident added to the response queue.",
      author: "System",
      createdAt: reportedAt,
    }],
  };
}

function createSeedStore(): IncidentStore {
  return {
    incidents: [
      seedIncident({ id: "SC-47291", type: "Weapon on Campus", icon: "🔫", severity: 4, location: "Parking Lot A", minutesAgo: 2, status: "active", privacy: "anonymous", hasPhoto: true, assignedTo: "Officer Chen", description: "Reporter saw a student with what appeared to be a weapon near the north parking entrance. Student wearing red hoodie and backpack." }),
      seedIncident({ id: "SC-47288", type: "Physical Altercation", icon: "🥊", severity: 3, location: "Cafeteria", minutesAgo: 14, status: "active", privacy: "partial", hasPhoto: false, assignedTo: "Ms. Torres", description: "Fight broke out near the lunch line. Multiple bystanders involved. One student reportedly on the ground." }),
      seedIncident({ id: "SC-47285", type: "Suspicious Activity", icon: "👁️", severity: 2, location: "Main Building — Hallway", minutesAgo: 31, status: "pending", privacy: "anonymous", hasPhoto: false, assignedTo: null, description: "Unknown adult in B-wing without a visitor badge around 10:15 AM. Mid-40s, gray jacket." }),
      seedIncident({ id: "SC-47280", type: "Bullying / Harassment", icon: "🗣️", severity: 2, location: "Gymnasium", minutesAgo: 60, status: "pending", privacy: "identified", hasPhoto: false, assignedTo: "Counselor Davis", description: "Ongoing verbal harassment targeting one student in gym class. Reportedly ongoing for weeks." }),
      seedIncident({ id: "SC-47274", type: "Drug / Substance", icon: "💊", severity: 3, location: "Restroom — 2nd Floor", minutesAgo: 120, status: "resolved", privacy: "anonymous", hasPhoto: false, assignedTo: "VP Johnson", description: "Smell of marijuana near room 214. Situation has been addressed." }),
      seedIncident({ id: "SC-47266", type: "Medical Emergency", icon: "🚑", severity: 4, location: "Sports Field", minutesAgo: 180, status: "resolved", privacy: "partial", hasPhoto: true, assignedTo: "Nurse Williams", description: "Student collapsed during PE. Ambulance called. Student stable, taken to Riverside Medical." }),
      seedIncident({ id: "SC-47251", type: "Threat / Violence", icon: "⚠️", severity: 3, location: "Library", minutesAgo: 300, status: "resolved", privacy: "anonymous", hasPhoto: false, assignedTo: null, description: "Written threatening note found in a library book in the reference section. Note secured as evidence." }),
    ],
    notifications: [],
  };
}

function readStore(): IncidentStore {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const initial = createSeedStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed: unknown = JSON.parse(saved);
    if (
      typeof parsed === "object" && parsed !== null &&
      "incidents" in parsed && Array.isArray(parsed.incidents) &&
      "notifications" in parsed && Array.isArray(parsed.notifications)
    ) {
      return parsed as IncidentStore;
    }
  } catch {
    throw new Error("Saved demo incident data is invalid. Clear this site's browser storage to reload the sample data.");
  }

  throw new Error("Saved demo incident data has an unexpected format. Clear this site's browser storage to reload the sample data.");
}

function writeStore(store: IncidentStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(INCIDENTS_UPDATED_EVENT));
  } catch {
    throw new Error("The browser could not save demo incident data. Check available storage and try again.");
  }
}

function makeId() {
  return crypto.randomUUID();
}

function appendHistory(incident: Incident, action: string, detail: string, author = "Response team") {
  incident.history.unshift({ id: makeId(), action, detail, author, createdAt: new Date().toISOString() });
}

function notify(store: IncidentStore, incident: Incident, message: string) {
  store.notifications.unshift({
    id: makeId(),
    incidentId: incident.id,
    message,
    createdAt: new Date().toISOString(),
    readAt: null,
  });
  store.notifications = store.notifications.slice(0, 100);
}

export const incidentApi = {
  async list(): Promise<Incident[]> {
    return readStore().incidents;
  },

  async create(input: CreateIncidentInput): Promise<Incident> {
    const store = readStore();
    let id: string;
    do {
      id = `SC-${Math.floor(10_000 + Math.random() * 90_000)}`;
    } while (store.incidents.some(incident => incident.id === id));
    const incident: Incident = {
      ...input,
      id,
      reportedAt: new Date().toISOString(),
      location: input.location.trim() || "Not specified",
      description: input.description.trim(),
      reporterName: input.privacy === "identified" ? input.reporterName?.trim() || null : null,
      status: "pending",
      assignedTo: null,
      notes: [],
      history: [],
    };
    appendHistory(incident, "Report received", "New report added to the response queue.", "Reporter");
    store.incidents.unshift(incident);
    notify(store, incident, `New ${incident.type} report received.`);
    writeStore(store);
    return incident;
  },

  async update(id: string, changes: { status?: IncidentStatus; assignedTo?: string | null }): Promise<Incident> {
    const store = readStore();
    const incident = store.incidents.find(item => item.id === id);
    if (!incident) throw new Error("Incident not found.");
    let changed = false;

    if (changes.status && changes.status !== incident.status) {
      const previous = incident.status;
      incident.status = changes.status;
      const detail = `Status changed from ${previous} to ${changes.status}.`;
      appendHistory(incident, "Status updated", detail);
      notify(store, incident, `${incident.id}: ${detail}`);
      changed = true;
    }
    if (changes.assignedTo !== undefined && changes.assignedTo !== incident.assignedTo) {
      const previous = incident.assignedTo;
      incident.assignedTo = changes.assignedTo;
      const detail = changes.assignedTo
        ? `Assigned to ${changes.assignedTo}${previous ? ` (previously ${previous})` : ""}.`
        : `Assignment removed${previous ? ` from ${previous}` : ""}.`;
      appendHistory(incident, "Assignment updated", detail);
      notify(store, incident, `${incident.id}: ${detail}`);
      changed = true;
    }
    if (!changed) throw new Error("Choose a different status or responder to make an update.");

    writeStore(store);
    return incident;
  },

  async addNote(id: string, text: string): Promise<Incident> {
    const store = readStore();
    const incident = store.incidents.find(item => item.id === id);
    if (!incident) throw new Error("Incident not found.");
    const note = text.trim();
    if (!note || note.length > 1000) throw new Error("Investigation updates must be between 1 and 1000 characters.");
    incident.notes.unshift({ id: makeId(), text: note, author: "Response team", createdAt: new Date().toISOString() });
    appendHistory(incident, "Investigation update", note);
    notify(store, incident, `Investigation update added to ${incident.id}.`);
    writeStore(store);
    return incident;
  },

  async notifications(): Promise<IncidentNotification[]> {
    return readStore().notifications;
  },

  async markNotificationRead(id: string): Promise<IncidentNotification> {
    const store = readStore();
    const notification = store.notifications.find(item => item.id === id);
    if (!notification) throw new Error("Notification not found.");
    notification.readAt ??= new Date().toISOString();
    writeStore(store);
    return notification;
  },
};
