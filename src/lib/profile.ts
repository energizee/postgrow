import { METRICS, getMetric } from "../data/metrics";
import type { AreaMetric, AreaProfile, LatLng, ProfileCategory } from "../types/types";
import { fetchOsmReadings } from "./osm";

export type MetricValues = Partial<Record<string, { value: number; source: string }>>;

const AIR_API = "https://air-quality-api.open-meteo.com/v1/air-quality";
const CARBON_API = "https://api.carbonintensity.org.uk/regional/postcode";
const RENEWABLE_FUELS = ["wind", "solar", "hydro"];
const PERCENT = 100;

export const LIVE_SOURCES = { air: "Open-Meteo", energy: "Carbon Intensity API", osm: "OpenStreetMap" };

function scoreMetric(id: string, value: number): number {
  const { best, worst, maxPoints } = getMetric(id);
  const progress = (value - worst) / (best - worst);
  return Math.round(Math.min(1, Math.max(0, progress)) * maxPoints);
}

export function buildProfile(values: MetricValues, fetchedAt = new Date().toISOString()): AreaProfile {
  const metrics: AreaMetric[] = METRICS.map((def) => {
    const entry = values[def.id];
    return {
      id: def.id,
      category: def.category,
      label: def.label,
      unit: def.unit,
      value: entry?.value ?? null,
      points: entry ? scoreMetric(def.id, entry.value) : null,
      maxPoints: def.maxPoints,
      source: entry?.source ?? "",
      geographyLevel: def.geographyLevel,
      fetchedAt,
    };
  });

  const categoryPoints: AreaProfile["categoryPoints"] = {};
  let points = 0;
  let potential = 0;
  for (const metric of metrics) {
    if (metric.points === null) continue;
    const category = (categoryPoints[metric.category] ??= { points: 0, potential: 0 });
    category.points += metric.points;
    category.potential += metric.maxPoints;
    points += metric.points;
    potential += metric.maxPoints;
  }

  return {
    metrics,
    categoryPoints,
    points,
    potential,
    percentage: potential ? Math.round((points / potential) * PERCENT) : 0,
    updatedAt: fetchedAt,
  };
}

export function profileValues(profile: AreaProfile | null): MetricValues {
  const values: MetricValues = {};
  for (const metric of profile?.metrics ?? []) {
    if (metric.value !== null) values[metric.id] = { value: metric.value, source: metric.source };
  }
  return values;
}

type AirResponse = { current: { european_aqi: number; pm2_5: number; nitrogen_dioxide: number } };
type CarbonResponse = {
  data: { data: { intensity: { forecast: number }; generationmix: { fuel: string; perc: number }[] }[] }[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return (await response.json()) as T;
}

// Air from Open-Meteo, energy from the Carbon Intensity API, nature, transport and waste
// from OpenStreetMap. Any source that fails is skipped.
export async function fetchLiveValues(location: LatLng, outcode: string): Promise<MetricValues> {
  const airUrl = `${AIR_API}?latitude=${location.lat}&longitude=${location.lng}&current=european_aqi,pm2_5,nitrogen_dioxide`;
  const [air, carbon, osm] = await Promise.allSettled([
    fetchJson<AirResponse>(airUrl),
    fetchJson<CarbonResponse>(`${CARBON_API}/${encodeURIComponent(outcode)}`),
    fetchOsmReadings(location),
  ]);

  const values: MetricValues = {};
  if (air.status === "fulfilled") {
    const { european_aqi, pm2_5, nitrogen_dioxide } = air.value.current;
    values.aqi = { value: european_aqi, source: LIVE_SOURCES.air };
    values.pm25 = { value: pm2_5, source: LIVE_SOURCES.air };
    values.no2 = { value: nitrogen_dioxide, source: LIVE_SOURCES.air };
  }
  if (carbon.status === "fulfilled") {
    const reading = carbon.value.data[0]?.data[0];
    if (reading) {
      const renewable = reading.generationmix
        .filter((g) => RENEWABLE_FUELS.includes(g.fuel))
        .reduce((sum, g) => sum + g.perc, 0);
      values["carbon-intensity"] = { value: reading.intensity.forecast, source: LIVE_SOURCES.energy };
      values["renewable-share"] = { value: renewable, source: LIVE_SOURCES.energy };
    }
  }
  if (osm.status === "fulfilled") {
    const readings = osm.value;
    const source = LIVE_SOURCES.osm;
    values["green-space"] = { value: readings.greenSpacePercent, source };
    values["street-trees"] = { value: readings.trees, source };
    values["bus-stops"] = { value: readings.busStops, source };
    values["cycle-parking"] = { value: readings.cycleParking, source };
    values["ev-chargers"] = { value: readings.evChargers, source };
    values["recycling-points"] = { value: readings.recyclingPoints, source };
  }
  return values;
}

export function categoryPercent(profile: AreaProfile, category: ProfileCategory): number | null {
  const entry = profile.categoryPoints[category];
  return entry?.potential ? Math.round((entry.points / entry.potential) * PERCENT) : null;
}
