import { useState } from "react";
import { Camera, CircleCheck } from "lucide-react";
import { ActionIcon } from "../components/ActionIcon/ActionIcon";
import { EmptyState } from "../components/EmptyState/EmptyState";
import { PageHeader } from "../components/PageHeader/PageHeader";
import { ProofImage } from "../components/ProofImage/ProofImage";
import { Segmented } from "../components/Segmented/Segmented";
import { StatusPill } from "../components/StatusPill/StatusPill";
import { getAction } from "../data/actions";
import { timeAgo } from "../lib/dates";
import { reviewQueue, userProofs, type ProofItem } from "../lib/reviews";
import { reviewProof } from "../store/actions";
import { useMember, useStore } from "../store/context";
import { REVIEW_POINTS } from "../types/types";
import "./ReviewsPage.css";

type View = "queue" | "mine";

function ReviewCard({ item, onDecide }: { item: ProofItem; onDecide: (decision: "approved" | "rejected") => void }) {
  const action = getAction(item.actionId);
  return (
    <article className="review-card" aria-label={action.name}>
      <ProofImage className="review-card__image" src={item.proof.image} alt={`Proof photo for ${action.name}`} />
      <div className="review-card__body">
        <div className="review-card__title">
          <ActionIcon actionId={action.id} lasting={action.impact === "lasting"} />
          <h2>{action.name}</h2>
        </div>
        {item.details && <p className="review-card__details">{item.details}</p>}
        <div className="review-card__actions">
          <button type="button" className="btn btn--danger" onClick={() => onDecide("rejected")}>
            Reject
          </button>
          <button type="button" className="btn btn--primary" onClick={() => onDecide("approved")}>
            Approve
          </button>
        </div>
      </div>
    </article>
  );
}

export function ReviewsPage() {
  const { state, run } = useStore();
  const { user, area } = useMember();
  const [view, setView] = useState<View>("queue");
  const [message, setMessage] = useState("");

  const queue = reviewQueue(state, area.id);
  const mine = userProofs(state, user.id);

  function decide(item: ProofItem, decision: "approved" | "rejected") {
    try {
      run((s) => reviewProof(s, user.id, item.subject, decision));
      setMessage(`${decision === "approved" ? "Approved" : "Rejected"}, +${REVIEW_POINTS} for your household`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="page">
      <PageHeader title="Reviews" />
      <Segmented
        label="Reviews"
        value={view}
        onChange={setView}
        options={[
          { value: "queue", label: "To review", count: queue.length },
          { value: "mine", label: "My proofs" },
        ]}
      />
      <p className={message && view === "queue" ? "review-message" : "visually-hidden"} role="status">
        {message}
      </p>

      {view === "queue" &&
        (queue.length === 0 ? (
          <EmptyState icon={CircleCheck} title="Nothing to review" />
        ) : (
          <ReviewCard key={`${queue[0].subject.kind}-${queue[0].subject.id}`} item={queue[0]} onDecide={(d) => decide(queue[0], d)} />
        ))}

      {view === "queue" && queue.length > 1 && <p className="muted">{queue.length - 1} more waiting</p>}

      {view === "mine" &&
        (mine.length === 0 ? (
          <EmptyState icon={Camera} title="No proofs sent yet" />
        ) : (
          <ul className="list">
            {mine.map((item) => {
              const action = getAction(item.actionId);
              return (
                <li key={`${item.subject.kind}-${item.subject.id}`} className="row">
                  <ProofImage className="proof-thumb" src={item.proof.image} alt="" />
                  <span className="row__main">
                    <span className="row__title">{item.subject.kind === "activity" ? item.details : action.name}</span>
                    <span className="row__meta">{timeAgo(item.proof.submittedAt)}</span>
                  </span>
                  <StatusPill status={item.proof.status} />
                </li>
              );
            })}
          </ul>
        ))}
    </div>
  );
}
