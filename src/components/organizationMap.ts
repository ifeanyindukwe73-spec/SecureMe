export interface MapZone {
  id: number;
  label: string;
  x: number;
  y: number;
}

export interface OrganizationMap {
  organization: string;
  image: string | null;
  zones: MapZone[];
}

export const ORGANIZATION_MAP_STORAGE_KEY = "safecircle-demo-map";

export function readOrganizationMap(): { map: OrganizationMap | null; error: string | null } {
  try {
    const saved = window.localStorage.getItem(ORGANIZATION_MAP_STORAGE_KEY);
    if (!saved) return { map: null, error: null };
    const value: unknown = JSON.parse(saved);
    if (!value || typeof value !== "object") throw new Error("Saved map data is invalid.");
    const map = value as Partial<OrganizationMap>;
    if (typeof map.organization !== "string" || !Array.isArray(map.zones)) throw new Error("Saved map data is incomplete.");
    const zones = map.zones.filter((zone): zone is MapZone =>
      typeof zone === "object" &&
      zone !== null &&
      typeof zone.id === "number" &&
      typeof zone.label === "string" &&
      typeof zone.x === "number" &&
      typeof zone.y === "number"
    );
    if (zones.length !== map.zones.length) throw new Error("One or more saved map locations are invalid.");
    return { map: { organization: map.organization, image: typeof map.image === "string" ? map.image : null, zones }, error: null };
  } catch (error) {
    return {
      map: null,
      error: error instanceof Error ? error.message : "Could not read the saved organization map.",
    };
  }
}
