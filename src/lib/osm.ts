// Nature, transport and waste readings from OpenStreetMap via the Overpass API.
// Works anywhere in the UK with no key. Requests run one at a time to respect rate limits.
import { area, circle, featureCollection, intersect, polygon } from "@turf/turf";
import type { LatLng } from "../types/types";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const NEAR_M = 500;
const WIDE_M = 1000;
const TIMEOUT_S = 25;
const PERCENT = 100;
const MIN_RING_POINTS = 4; // a closed polygon repeats its first point
const M_PER_KM = 1000;

const GREEN_LEISURE = "park|garden|nature_reserve|recreation_ground|playground|pitch";
const GREEN_LANDUSE = "grass|forest|meadow|allotments|village_green|recreation_ground|cemetery";
const GREEN_NATURAL = "wood|scrub|grassland|heath";

export type OsmReadings = {
  greenSpacePercent: number;
  trees: number;
  busStops: number;
  cycleParking: number;
  evChargers: number;
  recyclingPoints: number;
};

type OverpassElement =
  | { type: "way"; geometry?: { lat: number; lon: number }[] }
  | { type: "count"; tags: { total: string } };

// Statement order matters: the counts come back in this order after the green-space ways
function buildQuery({ lat, lng }: LatLng): string {
  const near = `around:${NEAR_M},${lat},${lng}`;
  const wide = `around:${WIDE_M},${lat},${lng}`;
  return [
    `[out:json][timeout:${TIMEOUT_S}];`,
    `(way(${near})[leisure~"^(${GREEN_LEISURE})$"];`,
    `way(${near})[landuse~"^(${GREEN_LANDUSE})$"];`,
    `way(${near})[natural~"^(${GREEN_NATURAL})$"];);out geom;`,
    `node(${near})[natural=tree];out count;`,
    `node(${near})[highway=bus_stop];out count;`,
    `nwr(${near})[amenity=bicycle_parking];out count;`,
    `nwr(${wide})[amenity=charging_station];out count;`,
    `nwr(${near})[amenity=recycling];out count;`,
  ].join("");
}

// Share of the 500 m circle covered by green polygons (overlaps can double count, so it's capped)
function greenSpacePercent(location: LatLng, elements: OverpassElement[]): number {
  const zone = circle([location.lng, location.lat], NEAR_M / M_PER_KM, { units: "kilometers" });
  let greenArea = 0;
  for (const element of elements) {
    if (element.type !== "way" || !element.geometry || element.geometry.length < MIN_RING_POINTS) continue;
    const ring = element.geometry.map((p) => [p.lon, p.lat]);
    const [first, last] = [ring[0], ring[ring.length - 1]];
    if (first[0] !== last[0] || first[1] !== last[1]) continue;
    const overlap = intersect(featureCollection([polygon([ring]), zone]));
    if (overlap) greenArea += area(overlap);
  }
  return Math.min(PERCENT, (greenArea / area(zone)) * PERCENT);
}

let queue: Promise<unknown> = Promise.resolve();

export function fetchOsmReadings(location: LatLng): Promise<OsmReadings> {
  const run = async () => {
    const response = await fetch(OVERPASS_API, { method: "POST", body: new URLSearchParams({ data: buildQuery(location) }) });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    const { elements } = (await response.json()) as { elements: OverpassElement[] };
    const [trees, busStops, cycleParking, evChargers, recyclingPoints] = elements
      .filter((e) => e.type === "count")
      .map((e) => Number(e.tags.total));
    return { greenSpacePercent: greenSpacePercent(location, elements), trees, busStops, cycleParking, evChargers, recyclingPoints };
  };
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}
