import type { GeographyLevel, ProfileCategory } from "../types/types";

// Each metric scores linearly from `worst` (0 points) to `best` (maxPoints).
// Max points add up to 100 per category and 700 overall.
export type MetricDefinition = {
  id: string;
  category: ProfileCategory;
  label: string;
  unit: string;
  maxPoints: number;
  best: number;
  worst: number;
  geographyLevel: GeographyLevel;
};

export const METRICS: MetricDefinition[] = [
  { id: "aqi", category: "air", label: "Air quality index", unit: "EAQI", maxPoints: 50, best: 0, worst: 100, geographyLevel: "point" },
  { id: "pm25", category: "air", label: "Fine particles", unit: "µg/m³", maxPoints: 25, best: 0, worst: 25, geographyLevel: "point" },
  { id: "no2", category: "air", label: "Nitrogen dioxide", unit: "µg/m³", maxPoints: 25, best: 0, worst: 40, geographyLevel: "point" },
  { id: "carbon-intensity", category: "energy", label: "Grid carbon intensity", unit: "gCO₂/kWh", maxPoints: 50, best: 50, worst: 350, geographyLevel: "region" },
  { id: "renewable-share", category: "energy", label: "Renewable generation", unit: "%", maxPoints: 50, best: 80, worst: 10, geographyLevel: "region" },
  { id: "epc-rating", category: "homes", label: "Average EPC rating", unit: "SAP", maxPoints: 60, best: 85, worst: 40, geographyLevel: "postcode" },
  { id: "low-carbon-heating", category: "homes", label: "Low-carbon heating", unit: "%", maxPoints: 40, best: 20, worst: 0, geographyLevel: "lsoa" },
  { id: "green-space", category: "nature", label: "Green space within 500 m", unit: "%", maxPoints: 60, best: 40, worst: 5, geographyLevel: "point" },
  { id: "street-trees", category: "nature", label: "Trees within 500 m", unit: "trees", maxPoints: 40, best: 400, worst: 0, geographyLevel: "point" },
  { id: "bus-stops", category: "transport", label: "Bus stops within 500 m", unit: "stops", maxPoints: 40, best: 25, worst: 0, geographyLevel: "point" },
  { id: "cycle-parking", category: "transport", label: "Cycle parking within 500 m", unit: "spots", maxPoints: 30, best: 40, worst: 0, geographyLevel: "point" },
  { id: "ev-chargers", category: "transport", label: "EV chargers within 1 km", unit: "chargers", maxPoints: 30, best: 15, worst: 0, geographyLevel: "point" },
  { id: "flood-risk", category: "water", label: "Homes at flood risk", unit: "%", maxPoints: 100, best: 0, worst: 20, geographyLevel: "postcode" },
  { id: "recycling-points", category: "waste", label: "Recycling points within 500 m", unit: "points", maxPoints: 100, best: 20, worst: 0, geographyLevel: "point" },
];

export function getMetric(id: string): MetricDefinition {
  const metric = METRICS.find((m) => m.id === id);
  if (!metric) throw new Error(`Unknown metric ${id}`);
  return metric;
}
