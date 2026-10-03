import { circle, convex, explode, featureCollection } from "@turf/turf";
import type { LatLng } from "../types/types";

const HOUSEHOLD_RADIUS_KM = 0.18;
const CIRCLE_STEPS = 24;

export function sectorShape(locations: LatLng[]): [number, number][] | null {
  if (locations.length === 0) return null;
  const circles = locations.map((l) =>
    circle([l.lng, l.lat], HOUSEHOLD_RADIUS_KM, { units: "kilometers", steps: CIRCLE_STEPS }),
  );
  const hull = convex(explode(featureCollection(circles)));
  return hull ? hull.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]) : null;
}

export function centreOf(locations: LatLng[]): LatLng | null {
  if (locations.length === 0) return null;
  const sum = locations.reduce((acc, l) => ({ lat: acc.lat + l.lat, lng: acc.lng + l.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / locations.length, lng: sum.lng / locations.length };
}
