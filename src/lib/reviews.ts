import type { AppState, Proof, ReviewSubject } from "../types/types";

export type ProofItem = {
  subject: ReviewSubject;
  actionId: string;
  details: string;
  proof: Proof;
};

function allProofs(state: AppState): (ProofItem & { areaId: string; ownerId: string })[] {
  const contributions = state.contributions.flatMap((c) =>
    c.proof
      ? [{ subject: { kind: "contribution" as const, id: c.id }, actionId: c.actionId, details: c.details, proof: c.proof, areaId: c.postcodeAreaId, ownerId: c.userId }]
      : [],
  );
  const activities = state.activities.flatMap((a) =>
    a.proof
      ? [{ subject: { kind: "activity" as const, id: a.id }, actionId: a.actionId, details: a.title, proof: a.proof, areaId: a.postcodeAreaId, ownerId: a.organiserId }]
      : [],
  );
  return [...contributions, ...activities];
}

const bySubmitted = (a: ProofItem, b: ProofItem) => Date.parse(a.proof.submittedAt) - Date.parse(b.proof.submittedAt);

// Pending proofs sent to this sector, oldest first
export function reviewQueue(state: AppState, areaId: string): ProofItem[] {
  return allProofs(state)
    .filter((p) => p.proof.status === "pending" && p.proof.assignedAreaId === areaId && p.areaId !== areaId)
    .sort(bySubmitted);
}

// Everything this person has submitted for review, newest first
export function userProofs(state: AppState, userId: string): ProofItem[] {
  return allProofs(state)
    .filter((p) => p.ownerId === userId)
    .sort((a, b) => bySubmitted(b, a));
}
