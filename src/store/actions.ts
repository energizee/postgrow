// Every state change in the app. Each function returns a new state and throws
// an Error with a user-facing message when the change isn't allowed.
import { getAction } from "../data/actions";
import { hoursSince } from "../lib/dates";
import { newId } from "../lib/ids";
import type { PostcodeLookup } from "../lib/postcodes";
import { actionAvailability } from "../lib/scoring";
import {
  REVIEW_POINTS,
  REVIEW_REASSIGN_HOURS,
  type AppState,
  type AreaProfile,
  type Contribution,
  type GroupActivity,
  type Household,
  type Proof,
  type ReviewSubject,
  type User,
} from "../types/types";

const nowIso = () => new Date().toISOString();

function requireUser(state: AppState, userId: string): User {
  const user = state.users.find((u) => u.id === userId);
  if (!user) throw new Error("Account not found");
  return user;
}

function requireHousehold(state: AppState, userId: string): Household {
  const user = requireUser(state, userId);
  const household = state.households.find((h) => h.id === user.householdId);
  if (!household) throw new Error("Join a household first");
  return household;
}

const updateUser = (state: AppState, userId: string, changes: Partial<User>): AppState => ({
  ...state,
  users: state.users.map((u) => (u.id === userId ? { ...u, ...changes } : u)),
});

const updateHousehold = (state: AppState, householdId: string, changes: Partial<Household>): AppState => ({
  ...state,
  households: state.households.map((h) => (h.id === householdId ? { ...h, ...changes } : h)),
});

const updateActivity = (state: AppState, activityId: string, changes: Partial<GroupActivity>): AppState => ({
  ...state,
  activities: state.activities.map((a) => (a.id === activityId ? { ...a, ...changes } : a)),
});

function randomOtherArea(state: AppState, ownAreaId: string, excludeId?: string): string {
  const others = state.areas.filter((a) => a.id !== ownAreaId && a.id !== excludeId);
  const fallback = state.areas.filter((a) => a.id !== ownAreaId);
  const pool = others.length ? others : fallback;
  return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : "";
}

function newProof(state: AppState, ownAreaId: string, image: string): Proof {
  const now = nowIso();
  return { image, status: "pending", assignedAreaId: randomOtherArea(state, ownAreaId), assignedAt: now, reviewId: null, submittedAt: now };
}

// Accounts

export function signUp(state: AppState, name: string, lookup: PostcodeLookup): AppState {
  const areaExists = state.areas.some((a) => a.id === lookup.sector);
  const areas = areaExists
    ? state.areas
    : [
        ...state.areas,
        {
          id: lookup.sector,
          outcode: lookup.outcode,
          center: lookup.location,
          geography: lookup.geography,
          householdCount: null,
          profile: null,
          createdAt: nowIso(),
        },
      ];
  const details = { name, postcode: lookup.postcode, location: lookup.location, postcodeAreaId: lookup.sector, householdId: null };

  const existing = state.users.find((u) => u.id === state.currentUserId);
  if (existing) return { ...updateUser(state, existing.id, details), areas };

  const user: User = { id: newId(), createdAt: nowIso(), ...details };
  return { ...state, areas, users: [...state.users, user], currentUserId: user.id };
}

export const switchUser = (state: AppState, userId: string): AppState => ({ ...state, currentUserId: userId });

export const signOut = (state: AppState): AppState => ({ ...state, currentUserId: null });

export function setAreaProfile(state: AppState, areaId: string, profile: AreaProfile): AppState {
  return { ...state, areas: state.areas.map((a) => (a.id === areaId ? { ...a, profile } : a)) };
}

// Households

export function createHousehold(state: AppState, userId: string, name: string): AppState {
  const user = requireUser(state, userId);
  if (!user.postcodeAreaId || !user.location) throw new Error("Add your postcode first");
  if (!name.trim()) throw new Error("Name your household");

  const household: Household = {
    id: newId(),
    name: name.trim(),
    postcodeAreaId: user.postcodeAreaId,
    owner: userId,
    location: user.location,
    createdAt: nowIso(),
  };
  return { ...updateUser(state, userId, { householdId: household.id }), households: [...state.households, household] };
}

export function joinHousehold(state: AppState, userId: string, householdId: string): AppState {
  const user = requireUser(state, userId);
  const household = state.households.find((h) => h.id === householdId);
  if (!household) throw new Error("That household no longer exists");
  if (household.postcodeAreaId !== user.postcodeAreaId) throw new Error(`That household is in ${household.postcodeAreaId}, not your sector`);
  return updateUser(state, userId, { householdId: household.id });
}

export function leaveHousehold(state: AppState, userId: string): AppState {
  const household = requireHousehold(state, userId);
  let next = updateUser(state, userId, { householdId: null });
  if (household.owner === userId) {
    const successor = next.users.find((u) => u.householdId === household.id);
    if (successor) next = updateHousehold(next, household.id, { owner: successor.id });
  }
  return next;
}

export function changePostcode(state: AppState, userId: string): AppState {
  const next = requireUser(state, userId).householdId ? leaveHousehold(state, userId) : state;
  return updateUser(next, userId, { postcode: null, location: null, postcodeAreaId: null });
}

function requireOwner(state: AppState, userId: string): Household {
  const household = requireHousehold(state, userId);
  if (household.owner !== userId) throw new Error("Only the household owner can do that");
  return household;
}

export function renameHousehold(state: AppState, userId: string, name: string): AppState {
  if (!name.trim()) throw new Error("Name your household");
  return updateHousehold(state, requireOwner(state, userId).id, { name: name.trim() });
}

export function removeMember(state: AppState, ownerId: string, memberId: string): AppState {
  const household = requireOwner(state, ownerId);
  if (memberId === ownerId) throw new Error("Owners leave from their profile");
  if (requireUser(state, memberId).householdId !== household.id) throw new Error("Not a member of your household");
  return updateUser(state, memberId, { householdId: null });
}

// Contributions

export type NewContribution = {
  userId: string;
  actionId: string;
  details: string;
  image: string | null;
  activityId: string | null;
};

export function logContribution(state: AppState, input: NewContribution): AppState {
  const household = requireHousehold(state, input.userId);
  const action = getAction(input.actionId);
  if (!actionAvailability(state, household.id, action).available) {
    throw new Error(action.impact === "lasting" ? "Your household has already logged this" : "Daily limit reached for this action");
  }
  if (action.impact === "lasting" && !input.image && !input.activityId) throw new Error("Add a photo as proof");

  const contribution: Contribution = {
    id: newId(),
    actionId: action.id,
    userId: input.userId,
    householdId: household.id,
    postcodeAreaId: household.postcodeAreaId,
    basePoints: action.basePoints,
    details: input.details.trim(),
    proof: input.image ? newProof(state, household.postcodeAreaId, input.image) : null,
    activityId: input.activityId,
    createdAt: nowIso(),
  };
  return { ...state, contributions: [...state.contributions, contribution] };
}

// Reviews

export function reviewProof(state: AppState, userId: string, subject: ReviewSubject, decision: "approved" | "rejected"): AppState {
  const household = requireHousehold(state, userId);
  const target =
    subject.kind === "contribution"
      ? state.contributions.find((c) => c.id === subject.id)
      : state.activities.find((a) => a.id === subject.id);
  const proof = target?.proof;
  if (!proof || proof.status !== "pending" || proof.assignedAreaId !== household.postcodeAreaId) {
    throw new Error("This proof has already been reviewed");
  }

  const review = {
    id: newId(),
    subject,
    reviewerUserId: userId,
    reviewerHouseholdId: household.id,
    reviewerAreaId: household.postcodeAreaId,
    decision,
    points: REVIEW_POINTS,
    createdAt: nowIso(),
  };
  const reviewed: Proof = { ...proof, status: decision, reviewId: review.id };
  const next = { ...state, reviews: [...state.reviews, review] };

  if (subject.kind === "activity") return updateActivity(next, subject.id, { proof: reviewed });
  return { ...next, contributions: next.contributions.map((c) => (c.id === subject.id ? { ...c, proof: reviewed } : c)) };
}

// Moves proofs nobody has reviewed in time to another random sector
export function reassignStaleProofs(state: AppState, now = Date.now()): AppState {
  const refresh = (proof: Proof | null, ownAreaId: string): Proof | null => {
    if (proof?.status !== "pending") return proof;
    const stale = !proof.assignedAreaId || hoursSince(proof.assignedAt, now) >= REVIEW_REASSIGN_HOURS;
    if (!stale) return proof;
    const assignedAreaId = randomOtherArea(state, ownAreaId, proof.assignedAreaId);
    return assignedAreaId ? { ...proof, assignedAreaId, assignedAt: new Date(now).toISOString() } : proof;
  };
  return {
    ...state,
    contributions: state.contributions.map((c) => ({ ...c, proof: refresh(c.proof, c.postcodeAreaId) })),
    activities: state.activities.map((a) => ({ ...a, proof: refresh(a.proof, a.postcodeAreaId) })),
  };
}

// Group activities

export type NewActivity = Pick<GroupActivity, "title" | "actionId" | "date" | "place" | "description">;

export function createActivity(state: AppState, userId: string, input: NewActivity): { state: AppState; activityId: string } {
  const household = requireHousehold(state, userId);
  if (!input.title.trim()) throw new Error("Give the activity a title");
  if (!input.place.trim()) throw new Error("Add a place to meet");
  if (Number.isNaN(Date.parse(input.date))) throw new Error("Pick a date and time");

  const activity: GroupActivity = {
    ...input,
    title: input.title.trim(),
    place: input.place.trim(),
    description: input.description.trim(),
    id: newId(),
    postcodeAreaId: household.postcodeAreaId,
    organiserId: userId,
    participantIds: [userId],
    proof: null,
    createdAt: nowIso(),
  };
  return { state: { ...state, activities: [...state.activities, activity] }, activityId: activity.id };
}

function requireActivity(state: AppState, activityId: string): GroupActivity {
  const activity = state.activities.find((a) => a.id === activityId);
  if (!activity) throw new Error("Activity not found");
  return activity;
}

export function joinActivity(state: AppState, userId: string, activityId: string): AppState {
  const activity = requireActivity(state, activityId);
  if (activity.participantIds.includes(userId)) return state;
  return updateActivity(state, activityId, { participantIds: [...activity.participantIds, userId] });
}

export function leaveActivity(state: AppState, userId: string, activityId: string): AppState {
  const activity = requireActivity(state, activityId);
  if (activity.organiserId === userId) throw new Error("Organisers can't leave their own activity");
  return updateActivity(state, activityId, { participantIds: activity.participantIds.filter((id) => id !== userId) });
}

export function submitActivityProof(state: AppState, userId: string, activityId: string, image: string): AppState {
  const activity = requireActivity(state, activityId);
  if (activity.organiserId !== userId) throw new Error("Only the organiser can add proof");
  if (activity.proof && activity.proof.status !== "rejected") throw new Error("Proof has already been added");
  return updateActivity(state, activityId, { proof: newProof(state, activity.postcodeAreaId, image) });
}
