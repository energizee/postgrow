// Demo data around Edinburgh. People, households and profile values are made up;
// air, energy, nature, transport and waste values are replaced with live readings when the app loads.
import { REVIEW_POINTS, type AppState, type Contribution, type GroupActivity, type Household, type LatLng, type PostcodeArea, type Proof, type Review, type User } from "../types/types";
import { buildProfile, type MetricValues } from "../lib/profile";
import { MS_PER_DAY, MS_PER_HOUR, dayKey } from "../lib/dates";
import { between, pick, seededRandom } from "../lib/random";
import { actionsByImpact, getAction } from "./actions";

const SEED = 2026;
const HISTORY_DAYS = 40;
const PENDING_WINDOW_DAYS = 2;
const HOUSEHOLD_SPREAD = 0.006; // degrees around the sector centre
const MAX_HABITS_PER_DAY = 3;
const HABIT_PROOF_CHANCE = 0.35;
const APPROVAL_CHANCE = 0.85;
const MAX_LASTING_PER_HOUSEHOLD = 2;
const DEMO_SOURCE = "Demo dataset";

type SeedArea = { id: string; center: LatLng; householdCount: number; values: Record<string, number> };
type SeedHousehold = { id: string; name: string; areaId: string; members: { id: string; name: string; activity: number }[] };

const AREAS: SeedArea[] = [
  { id: "EH6 6", center: { lat: 55.9745, lng: -3.17 }, householdCount: 2380, values: { aqi: 32, pm25: 6, no2: 18, "carbon-intensity": 120, "renewable-share": 55, "epc-rating": 62, "low-carbon-heating": 4, "green-space": 18, "street-trees": 420, "bus-stops": 20, "cycle-parking": 45, "ev-chargers": 12, "flood-risk": 6, "recycling-points": 40 } },
  { id: "EH7 5", center: { lat: 55.964, lng: -3.177 }, householdCount: 2910, values: { aqi: 38, pm25: 7, no2: 24, "carbon-intensity": 120, "renewable-share": 55, "epc-rating": 58, "low-carbon-heating": 2, "green-space": 9, "street-trees": 210, "bus-stops": 26, "cycle-parking": 38, "ev-chargers": 9, "flood-risk": 1, "recycling-points": 34 } },
  { id: "EH9 1", center: { lat: 55.937, lng: -3.193 }, householdCount: 2140, values: { aqi: 24, pm25: 5, no2: 14, "carbon-intensity": 120, "renewable-share": 55, "epc-rating": 60, "low-carbon-heating": 3, "green-space": 34, "street-trees": 520, "bus-stops": 14, "cycle-parking": 30, "ev-chargers": 6, "flood-risk": 0, "recycling-points": 22 } },
  { id: "EH10 4", center: { lat: 55.928, lng: -3.21 }, householdCount: 1760, values: { aqi: 22, pm25: 5, no2: 12, "carbon-intensity": 120, "renewable-share": 55, "epc-rating": 66, "low-carbon-heating": 7, "green-space": 26, "street-trees": 480, "bus-stops": 10, "cycle-parking": 12, "ev-chargers": 7, "flood-risk": 2, "recycling-points": 15 } },
  { id: "EH11 2", center: { lat: 55.938, lng: -3.232 }, householdCount: 2650, values: { aqi: 52, pm25: 12, no2: 31, "carbon-intensity": 120, "renewable-share": 55, "epc-rating": 49, "low-carbon-heating": 1, "green-space": 6, "street-trees": 90, "bus-stops": 12, "cycle-parking": 8, "ev-chargers": 2, "flood-risk": 15, "recycling-points": 9 } },
  { id: "EH3 9", center: { lat: 55.943, lng: -3.208 }, householdCount: 1980, values: { aqi: 34, pm25: 7, no2: 21, "carbon-intensity": 120, "renewable-share": 55, "epc-rating": 69, "low-carbon-heating": 9, "green-space": 14, "street-trees": 260, "bus-stops": 18, "cycle-parking": 50, "ev-chargers": 11, "flood-risk": 4, "recycling-points": 26 } },
];

const HOUSEHOLDS: SeedHousehold[] = [
  { id: "h-okafor", name: "The Okafors", areaId: "EH6 6", members: [{ id: "u-ada", name: "Ada", activity: 0.9 }, { id: "u-chidi", name: "Chidi", activity: 0.5 }] },
  { id: "h-shore", name: "Shore flat 2", areaId: "EH6 6", members: [{ id: "u-sam", name: "Sam", activity: 0.6 }] },
  { id: "h-grant", name: "The Grants", areaId: "EH6 6", members: [{ id: "u-morag", name: "Morag", activity: 0.7 }] },
  { id: "h-pilrig", name: "Pilrig tenement", areaId: "EH7 5", members: [{ id: "u-jo", name: "Jo", activity: 0.8 }] },
  { id: "h-kaur", name: "The Kaurs", areaId: "EH7 5", members: [{ id: "u-priya", name: "Priya", activity: 0.9 }, { id: "u-arjun", name: "Arjun", activity: 0.4 }] },
  { id: "h-warrender", name: "Warrender flat", areaId: "EH9 1", members: [{ id: "u-ewan", name: "Ewan", activity: 0.7 }] },
  { id: "h-liu", name: "The Lius", areaId: "EH9 1", members: [{ id: "u-mei", name: "Mei", activity: 0.6 }] },
  { id: "h-ferguson", name: "The Fergusons", areaId: "EH10 4", members: [{ id: "u-isla", name: "Isla", activity: 0.2 }] },
  { id: "h-canaan", name: "Canaan Lane", areaId: "EH10 4", members: [{ id: "u-tom", name: "Tom", activity: 0.15 }] },
  { id: "h-novak", name: "The Novaks", areaId: "EH11 2", members: [{ id: "u-pavel", name: "Pavel", activity: 0.3 }] },
  { id: "h-ardmillan", name: "Ardmillan flat", areaId: "EH11 2", members: [{ id: "u-kirsty", name: "Kirsty", activity: 0.15 }] },
  { id: "h-canal", name: "Canal view", areaId: "EH3 9", members: [{ id: "u-linh", name: "Linh", activity: 0.8 }] },
  { id: "h-bell", name: "The Bells", areaId: "EH3 9", members: [{ id: "u-callum", name: "Callum", activity: 0.5 }] },
];

export const DEMO_USER_ID = "u-ada";

export function createSeedState(now = Date.now()): AppState {
  const random = seededRandom(SEED);
  const iso = (time: number) => new Date(time).toISOString();
  let counter = 0;
  const id = (prefix: string) => `${prefix}-${++counter}`;

  const areas: PostcodeArea[] = AREAS.map((a) => {
    const values: MetricValues = {};
    for (const [metricId, value] of Object.entries(a.values)) values[metricId] = { value, source: DEMO_SOURCE };
    return {
      id: a.id,
      outcode: a.id.split(" ")[0],
      center: a.center,
      geography: { lsoaCodes: [], msoaCodes: [], wardCode: "", localAuthorityCode: "S12000036", region: "Scotland", country: "Scotland" },
      householdCount: a.householdCount,
      profile: buildProfile(values, iso(now)),
      createdAt: iso(now - HISTORY_DAYS * MS_PER_DAY),
    };
  });

  const users: User[] = [];
  const households: Household[] = [];
  for (const h of HOUSEHOLDS) {
    const centre = AREAS.find((a) => a.id === h.areaId)!.center;
    const location = {
      lat: centre.lat + between(-HOUSEHOLD_SPREAD, HOUSEHOLD_SPREAD, random),
      lng: centre.lng + between(-HOUSEHOLD_SPREAD, HOUSEHOLD_SPREAD, random),
    };
    const createdAt = iso(now - HISTORY_DAYS * MS_PER_DAY);
    households.push({ id: h.id, name: h.name, postcodeAreaId: h.areaId, owner: h.members[0].id, location, createdAt });
    for (const m of h.members) {
      users.push({ id: m.id, name: m.name, postcode: null, location, postcodeAreaId: h.areaId, householdId: h.id, createdAt });
    }
  }

  const reviews: Review[] = [];
  let pendingCursor = 0;

  // Demo proofs have no photo. Older ones are reviewed by someone in a random other sector; recent ones wait in a queue
  function makeProof(areaId: string, createdAt: number, subject: Review["subject"]): Proof {
    const others = areas.filter((a) => a.id !== areaId);
    if (now - createdAt < PENDING_WINDOW_DAYS * MS_PER_DAY) {
      const assigned = others[pendingCursor++ % others.length];
      return { image: "", status: "pending", assignedAreaId: assigned.id, assignedAt: iso(createdAt), reviewId: null, submittedAt: iso(createdAt) };
    }
    const assigned = pick(others, random);
    const reviewer = pick(users.filter((u) => u.postcodeAreaId === assigned.id), random);
    const decision = random() < APPROVAL_CHANCE ? "approved" : "rejected";
    const review: Review = {
      id: id("review"),
      subject,
      reviewerUserId: reviewer.id,
      reviewerHouseholdId: reviewer.householdId!,
      reviewerAreaId: assigned.id,
      decision,
      points: REVIEW_POINTS,
      createdAt: iso(Math.min(now, createdAt + MS_PER_DAY)),
    };
    reviews.push(review);
    return { image: "", status: decision, assignedAreaId: assigned.id, assignedAt: iso(createdAt), reviewId: review.id, submittedAt: iso(createdAt) };
  }

  const contributions: Contribution[] = [];
  const habits = actionsByImpact("habit");
  const lasting = actionsByImpact("lasting");

  for (const user of users) {
    const member = HOUSEHOLDS.flatMap((h) => h.members).find((m) => m.id === user.id)!;
    const household = households.find((h) => h.id === user.householdId)!;
    for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo--) {
      const count = Math.floor(random() * (MAX_HABITS_PER_DAY + 1) * member.activity);
      const usedToday = new Set<string>();
      for (let i = 0; i < count; i++) {
        const action = pick(habits, random);
        const key = `${action.id}-${dayKey(now - daysAgo * MS_PER_DAY)}`;
        if (usedToday.has(key)) continue;
        usedToday.add(key);
        const createdAt = now - daysAgo * MS_PER_DAY - random() * MS_PER_DAY / 2;
        const contributionId = id("contribution");
        const proof = random() < HABIT_PROOF_CHANCE ? makeProof(household.postcodeAreaId, createdAt, { kind: "contribution", id: contributionId }) : null;
        contributions.push({ id: contributionId, actionId: action.id, userId: user.id, householdId: household.id, postcodeAreaId: household.postcodeAreaId, basePoints: action.basePoints, details: "", proof, activityId: null, createdAt: iso(createdAt) });
      }
    }
  }

  for (const household of households) {
    const owner = users.find((u) => u.id === household.owner)!;
    const count = Math.floor(random() * (MAX_LASTING_PER_HOUSEHOLD + 1));
    const chosen = new Set<string>();
    for (let i = 0; i < count; i++) chosen.add(pick(lasting, random).id);
    for (const actionId of chosen) {
      const action = getAction(actionId);
      const createdAt = now - random() * HISTORY_DAYS * MS_PER_DAY;
      const contributionId = id("contribution");
      const proof = makeProof(household.postcodeAreaId, createdAt, { kind: "contribution", id: contributionId });
      contributions.push({ id: contributionId, actionId, userId: owner.id, householdId: household.id, postcodeAreaId: household.postcodeAreaId, basePoints: action.basePoints, details: "", proof, activityId: null, createdAt: iso(createdAt) });
    }
  }

  const activities: GroupActivity[] = [];
  function addActivity(input: Omit<GroupActivity, "id" | "proof" | "createdAt">, withProof: boolean) {
    const activityId = id("activity");
    const date = Date.parse(input.date);
    const proof = withProof ? makeProof(input.postcodeAreaId, date + MS_PER_HOUR, { kind: "activity", id: activityId }) : null;
    activities.push({ ...input, id: activityId, proof, createdAt: iso(Math.min(date, now) - MS_PER_DAY * 3) });
    if (date > now) return;
    for (const userId of input.participantIds) {
      const user = users.find((u) => u.id === userId)!;
      contributions.push({ id: id("contribution"), actionId: input.actionId, userId, householdId: user.householdId!, postcodeAreaId: input.postcodeAreaId, basePoints: getAction(input.actionId).basePoints, details: input.title, proof: null, activityId, createdAt: iso(date + MS_PER_HOUR) });
    }
  }

  const at = (daysFromNow: number, hour: number) => {
    const d = new Date(now + daysFromNow * MS_PER_DAY);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  addActivity({ postcodeAreaId: "EH6 6", organiserId: "u-ada", title: "Shore litter pick", actionId: "litter-pick", date: at(-6, 10), place: "The Shore, by the swing bridge", description: "Bags and grabbers provided. Meet at the bridge.", participantIds: ["u-ada", "u-chidi", "u-sam", "u-morag"] }, true);
  addActivity({ postcodeAreaId: "EH6 6", organiserId: "u-morag", title: "Wildflower sowing", actionId: "wildflowers", date: at(5, 11), place: "Leith Links, east corner", description: "Seed mix from the council. Bring gloves.", participantIds: ["u-morag", "u-ada"] }, false);
  addActivity({ postcodeAreaId: "EH9 1", organiserId: "u-ewan", title: "Meadows litter pick", actionId: "litter-pick", date: at(-1, 9), place: "Jawbone Walk", description: "Two hours, coffee after.", participantIds: ["u-ewan", "u-mei"] }, true);
  addActivity({ postcodeAreaId: "EH11 2", organiserId: "u-pavel", title: "Compost day", actionId: "compost", date: at(3, 14), place: "Gorgie City Farm", description: "Learn to start a compost bin.", participantIds: ["u-pavel"] }, false);

  return { users, households, areas, contributions, activities, reviews, currentUserId: null };
}
