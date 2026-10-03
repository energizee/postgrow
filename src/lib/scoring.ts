import { getAction } from "../data/actions";
import {
  CONTRIBUTION_POTENTIAL,
  CONTRIBUTION_WINDOW_DAYS,
  EARNED_CAP_PERCENT,
  HABIT_PROOF_MULTIPLIER,
  LASTING_PROOF_MULTIPLIER,
  type AppState,
  type Contribution,
  type ContributionAction,
  type PostcodeArea,
} from "../types/types";
import { dayKey, daysSince, nextDayKey, previousDayKey } from "./dates";

const PERCENT = 100;
const SCORE_BANDS = { mid: 40, high: 70 };

export type ScoreBand = "low" | "mid" | "high";

export type GreenScore = {
  profile: number;
  earned: number;
  floor: number;
  momentum: number;
  green: number;
};

export const multiplierFor = (action: ContributionAction) =>
  action.impact === "lasting" ? LASTING_PROOF_MULTIPLIER : HABIT_PROOF_MULTIPLIER;

// Events after `now` are ignored
const happened = (iso: string, now: number) => daysSince(iso, now) >= 0;
const inWindow = (iso: string, now: number) => happened(iso, now) && daysSince(iso, now) <= CONTRIBUTION_WINDOW_DAYS;
const fade = (iso: string, now: number) =>
  happened(iso, now) ? Math.max(0, 1 - daysSince(iso, now) / CONTRIBUTION_WINDOW_DAYS) : 0;
const toPercent = (points: number, households: number) =>
  households ? (points / households / CONTRIBUTION_POTENTIAL) * PERCENT : 0;

export function isProofApproved(state: AppState, contribution: Contribution): boolean {
  if (contribution.proof?.status === "approved") return true;
  const activity = state.activities.find((a) => a.id === contribution.activityId);
  return activity?.proof?.status === "approved";
}

export function contributionPoints(state: AppState, contribution: Contribution): number {
  const multiplier = isProofApproved(state, contribution) ? multiplierFor(getAction(contribution.actionId)) : 1;
  return Math.round(contribution.basePoints * multiplier);
}

type ScoredEvent = { points: number; date: string };

function householdEvents(state: AppState, householdId: string): ScoredEvent[] {
  const contributions = state.contributions
    .filter((c) => c.householdId === householdId)
    .map((c) => ({ points: contributionPoints(state, c), date: c.createdAt }));
  const reviews = state.reviews
    .filter((r) => r.reviewerHouseholdId === householdId)
    .map((r) => ({ points: r.points, date: r.createdAt }));
  return [...contributions, ...reviews];
}

const sumPoints = (events: ScoredEvent[]) => events.reduce((total, e) => total + e.points, 0);

export function householdRecentPoints(state: AppState, householdId: string, now = Date.now()): number {
  return sumPoints(householdEvents(state, householdId).filter((e) => inWindow(e.date, now)));
}

export function householdLifetimePoints(state: AppState, householdId: string): number {
  return sumPoints(householdEvents(state, householdId));
}

export function userRecentPoints(state: AppState, userId: string, now = Date.now()): number {
  const contributions = state.contributions
    .filter((c) => c.userId === userId && inWindow(c.createdAt, now))
    .map((c) => ({ points: contributionPoints(state, c), date: c.createdAt }));
  const reviews = state.reviews
    .filter((r) => r.reviewerUserId === userId && inWindow(r.createdAt, now))
    .map((r) => ({ points: r.points, date: r.createdAt }));
  return sumPoints([...contributions, ...reviews]);
}

export const areaHouseholds = (state: AppState, areaId: string) =>
  state.households.filter((h) => h.postcodeAreaId === areaId);

export function activeHouseholdIds(state: AppState, areaId: string, now = Date.now()): Set<string> {
  return new Set(
    state.contributions
      .filter((c) => c.postcodeAreaId === areaId && inWindow(c.createdAt, now))
      .map((c) => c.householdId),
  );
}

export function areaRecentPoints(state: AppState, areaId: string, now = Date.now()): number {
  return areaHouseholds(state, areaId).reduce((total, h) => total + householdRecentPoints(state, h.id, now), 0);
}

export function greenScore(state: AppState, area: PostcodeArea, now = Date.now()): GreenScore {
  const profile = area.profile?.percentage ?? 0;
  const households = areaHouseholds(state, area.id);
  const activeCount = activeHouseholdIds(state, area.id, now).size;

  const lastingPoints = state.contributions
    .filter((c) => c.postcodeAreaId === area.id && happened(c.createdAt, now))
    .filter((c) => getAction(c.actionId).impact === "lasting" && isProofApproved(state, c))
    .reduce((total, c) => total + contributionPoints(state, c), 0);
  const earned = Math.min(EARNED_CAP_PERCENT, toPercent(lastingPoints, households.length));
  const floor = Math.min(PERCENT, profile + earned);

  const fadedPoints = households
    .flatMap((h) => householdEvents(state, h.id))
    .reduce((total, e) => total + e.points * fade(e.date, now), 0);
  const momentum = Math.min(PERCENT - floor, toPercent(fadedPoints, activeCount));

  return {
    profile: Math.round(profile),
    earned: Math.round(earned),
    floor: Math.round(floor),
    momentum: Math.round(momentum),
    green: Math.round(floor + momentum),
  };
}

export function scoreBand(green: number): ScoreBand {
  if (green >= SCORE_BANDS.high) return "high";
  if (green >= SCORE_BANDS.mid) return "mid";
  return "low";
}

export function rankAreas(state: AppState, now = Date.now()) {
  return state.areas
    .filter((area) => areaHouseholds(state, area.id).length > 0)
    .map((area) => ({ area, points: areaRecentPoints(state, area.id, now) }))
    .sort((a, b) => b.points - a.points);
}

export function rankHouseholds(state: AppState, areaId: string, now = Date.now()) {
  return areaHouseholds(state, areaId)
    .map((household) => ({ household, points: householdRecentPoints(state, household.id, now) }))
    .sort((a, b) => b.points - a.points);
}

export function streaks(state: AppState, userId: string, now = Date.now()) {
  const days = new Set(state.contributions.filter((c) => c.userId === userId).map((c) => dayKey(c.createdAt)));

  let current = 0;
  let day = dayKey(now);
  if (!days.has(day)) day = previousDayKey(day);
  while (days.has(day)) {
    current++;
    day = previousDayKey(day);
  }

  let best = 0;
  for (const start of days) {
    if (days.has(previousDayKey(start))) continue;
    let length = 0;
    let cursor = start;
    while (days.has(cursor)) {
      length++;
      cursor = nextDayKey(cursor);
    }
    best = Math.max(best, length);
  }
  return { current, best };
}

// Remaining uses today for a habit, or whether a lasting action is still available
export function actionAvailability(state: AppState, householdId: string, action: ContributionAction, now = Date.now()) {
  const logged = state.contributions.filter((c) => c.householdId === householdId && c.actionId === action.id);
  if (action.impact === "lasting") {
    const done = logged.some((c) => c.proof?.status !== "rejected");
    return { available: !done, remaining: done ? 0 : 1 };
  }
  const today = dayKey(now);
  const usedToday = logged.filter((c) => dayKey(c.createdAt) === today).length;
  const remaining = Math.max(0, (action.dailyCap ?? 1) - usedToday);
  return { available: remaining > 0, remaining };
}
