import { useRef, useState } from "react";
import BrandMark from "../components/BrandMark";
import PrototypeNotice from "../components/PrototypeNotice";
import { ORGANIZATION_MAP_STORAGE_KEY, type OrganizationMap, readOrganizationMap } from "../components/organizationMap";

const DEFAULT_SETUP: OrganizationMap = {
  organization: "Lincoln High School",
  image: null,
  zones: [
    { id: 1, label: "Main entrance", x: 28, y: 33 },
    { id: 2, label: "Cafeteria", x: 66, y: 56 },
  ],
};

export default function OrganizationMapSetup({ onBack }: { onBack: () => void }) {
  const [setup, setSetup] = useState<OrganizationMap>(DEFAULT_SETUP);
  const [zoneName, setZoneName] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(DEFAULT_SETUP.zones[0].id);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const updateSetup = (updates: Partial<OrganizationMap>) => setSetup(current => ({ ...current, ...updates }));

  const handleMapUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for the floor plan.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The floor plan must be smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("The floor plan could not be read.");
        return;
      }
      updateSetup({ image: reader.result });
      setError("");
    };
    reader.onerror = () => setError("The floor plan could not be read. Try another image.");
    reader.readAsDataURL(file);
  };

  const addZone = () => {
    const label = zoneName.trim();
    if (!label) {
      setError("Enter a name for the new location.");
      return;
    }
    const id = Date.now();
    updateSetup({ zones: [...setup.zones, { id, label, x: 50, y: 50 }] });
    setSelectedZoneId(id);
    setZoneName("");
    setError("");
  };

  const saveMap = () => {
    try {
      window.localStorage.setItem(ORGANIZATION_MAP_STORAGE_KEY, JSON.stringify(setup));
      setNotice("Map saved in this browser for this demo.");
      setError("");
    } catch {
      setError("Could not save this map in browser storage. Try a smaller floor plan image.");
      setNotice("");
    }
  };

  const loadMap = () => {
    try {
      const result = readOrganizationMap();
      if (result.error) {
        setError(result.error);
        setNotice("");
        return;
      }
      if (!result.map) {
        setNotice("No saved demo map was found in this browser.");
        return;
      }
      setSetup(result.map);
      setSelectedZoneId(result.map.zones.at(-1)?.id ?? null);
      setNotice("Loaded the saved demo map.");
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the saved demo map.");
      setNotice("");
    }
  };

  return (
    <main className="map-setup-page">
      <header className="map-setup-nav">
        <button className="button button-quiet" onClick={onBack}>← Back to response team</button>
        <BrandMark />
      </header>
      <section className="map-setup-content">
        <div className="map-setup-heading">
          <span className="eyebrow">ORGANIZATION SETUP</span>
          <h1>Design your safety map</h1>
          <p>Upload a floor plan, name important places, then click the map to place each location marker.</p>
        </div>
        <PrototypeNotice>Demo map setup: changes are saved only in this browser. Do not upload confidential floor plans. Production maps need organization-scoped storage and access controls.</PrototypeNotice>
        <div className="map-editor">
          <div className="map-editor-tools">
            <label htmlFor="organization-name">School or organization name</label>
            <input id="organization-name" value={setup.organization} onChange={event => updateSetup({ organization: event.target.value })} />
            <label>Floor plan image</label>
            <input ref={fileRef} className="visually-hidden" type="file" accept="image/*" onChange={handleMapUpload} />
            <button className="button button-outline" onClick={() => fileRef.current?.click()}>Choose floor plan (max 5 MB)</button>
            <label htmlFor="zone-name">Add a map location</label>
            <div className="add-zone-row">
              <input id="zone-name" value={zoneName} onChange={event => setZoneName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") addZone(); }} placeholder="e.g. East stairwell" />
              <button className="button button-primary" onClick={addZone}>Add</button>
            </div>
            <p className="map-help">Add a location, then click on the floor plan to position the latest marker.</p>
            <div className="map-zone-list">
              {setup.zones.map((zone, index) => <div key={zone.id} className={selectedZoneId === zone.id ? "selected" : ""}>
                <button className="map-zone-select" onClick={() => setSelectedZoneId(zone.id)}><span>{String(index + 1).padStart(2, "0")}</span>{zone.label}</button>
                <button aria-label={`Remove ${zone.label}`} onClick={() => {
                  const zones = setup.zones.filter(item => item.id !== zone.id);
                  updateSetup({ zones });
                  if (selectedZoneId === zone.id) setSelectedZoneId(zones.at(-1)?.id ?? null);
                }}>×</button>
              </div>)}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="form-success" role="status">{notice}</p>}
            <div className="map-editor-actions">
              <button className="button button-outline" onClick={loadMap}>Load saved map</button>
              <button className="button button-primary" onClick={saveMap}>Save map</button>
            </div>
          </div>
          <div>
            <div
              className={`map-canvas${setup.image ? " has-image" : ""}`}
              style={setup.image ? { backgroundImage: `linear-gradient(rgba(10, 20, 38, .12), rgba(10, 20, 38, .12)), url("${setup.image}")` } : undefined}
              onClick={event => {
                if (selectedZoneId === null) {
                  setError("Select a map location before placing a marker.");
                  return;
                }
                const bounds = event.currentTarget.getBoundingClientRect();
                updateSetup({ zones: setup.zones.map(zone => zone.id === selectedZoneId
                  ? { ...zone, x: Math.round(((event.clientX - bounds.left) / bounds.width) * 100), y: Math.round(((event.clientY - bounds.top) / bounds.height) * 100) }
                  : zone) });
                setError("");
              }}
            >
              {!setup.image && <div className="map-placeholder"><span>＋</span><strong>{setup.organization || "Your organization"}</strong><small>Upload a floor plan or click to position a map pin</small></div>}
              {setup.image && <strong className="map-org-label">{setup.organization}</strong>}
              {setup.zones.map((zone, index) => (
                <button key={zone.id} className={`map-pin${selectedZoneId === zone.id ? " selected" : ""}`} style={{ left: `${zone.x}%`, top: `${zone.y}%` }} onClick={event => { event.stopPropagation(); setSelectedZoneId(zone.id); }} title={zone.label} aria-label={`${zone.label}, map marker ${index + 1}`}>
                  <span>{index + 1}</span><small>{zone.label}</small>
                </button>
              ))}
            </div>
            <p className="map-canvas-caption">Select a location on the left, then click anywhere on the map to place its marker.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
