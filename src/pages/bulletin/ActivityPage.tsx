import { useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ActionIcon } from "../../components/ActionIcon/ActionIcon";
import { Avatar } from "../../components/Avatar/Avatar";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { PhotoInput } from "../../components/PhotoInput/PhotoInput";
import { ProofImage } from "../../components/ProofImage/ProofImage";
import { StatusPill } from "../../components/StatusPill/StatusPill";
import { getAction } from "../../data/actions";
import { formatDateTime } from "../../lib/dates";
import { contributionPoints } from "../../lib/scoring";
import { joinActivity, leaveActivity, submitActivityProof } from "../../store/actions";
import { useMember, useStore } from "../../store/context";
import "./Bulletin.css";

const ICON_SIZE = 18;
const AVATAR_SIZE = 36;

export function ActivityPage() {
  const { activityId } = useParams();
  const { state, run } = useStore();
  const { user } = useMember();
  const [proof, setProof] = useState<string | null>(null);
  const [error, setError] = useState("");

  const activity = state.activities.find((a) => a.id === activityId);
  if (!activity) return <Navigate to="/bulletin" replace />;

  const action = getAction(activity.actionId);
  const joined = activity.participantIds.includes(user.id);
  const isOrganiser = activity.organiserId === user.id;
  const participants = state.users.filter((u) => activity.participantIds.includes(u.id));
  const linked = state.contributions.filter((c) => c.activityId === activity.id);
  const groupTotal = linked.reduce((total, c) => total + contributionPoints(state, c), 0);
  const loggedMyPart = linked.some((c) => c.userId === user.id);
  const canAddProof = isOrganiser && (!activity.proof || activity.proof.status === "rejected");

  function attempt(change: Parameters<typeof run>[0]) {
    try {
      run(change);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function sendProof() {
    if (!proof) return;
    attempt((s) => submitActivityProof(s, user.id, activity!.id, proof));
    setProof(null);
  }

  return (
    <div className="page">
      <PageHeader back="back" fallback="/bulletin" title={activity.title} />

      <ul className="activity-facts">
        <li>
          <span className="action-icon action-icon--lasting" aria-hidden="true">
            <CalendarDays size={ICON_SIZE} />
          </span>
          {formatDateTime(activity.date)}
        </li>
        <li>
          <span className="action-icon action-icon--lasting" aria-hidden="true">
            <MapPin size={ICON_SIZE} />
          </span>
          {activity.place}
        </li>
        <li>
          <ActionIcon actionId={action.id} lasting={action.impact === "lasting"} />
          {action.name}
        </li>
      </ul>

      {activity.description && <p className="activity-description">{activity.description}</p>}

      <div className="activity-actions">
        {joined && !loggedMyPart && (
          <Link to={`/contribute?activity=${activity.id}`} className="btn btn--primary">
            Log my part
          </Link>
        )}
        {!joined && (
          <button type="button" className="btn btn--primary" onClick={() => attempt((s) => joinActivity(s, user.id, activity.id))}>
            Join
          </button>
        )}
        {joined && !isOrganiser && (
          <button type="button" className="btn btn--secondary" onClick={() => attempt((s) => leaveActivity(s, user.id, activity.id))}>
            Leave
          </button>
        )}
      </div>

      <section className="section" aria-labelledby="going-heading">
        <div className="section__head">
          <h2 id="going-heading">Going</h2>
          <span className="muted numeric">{participants.length}</span>
        </div>
        <ul className="avatars">
          {participants.map((p) => (
            <li key={p.id} title={p.name}>
              <Avatar name={p.name} size={AVATAR_SIZE} />
              <span className="visually-hidden">{p.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="total-heading">
        <div className="section__head">
          <h2 id="total-heading">Group total</h2>
          <span className="activity-total numeric">{groupTotal}</span>
        </div>
      </section>

      <section className="section" aria-labelledby="proof-heading">
        <div className="section__head">
          <h2 id="proof-heading">Proof</h2>
          {activity.proof && <StatusPill status={activity.proof.status} />}
        </div>
        {activity.proof && activity.proof.status !== "rejected" && (
          <ProofImage className="activity-proof" src={activity.proof.image} alt={`Proof for ${activity.title}`} />
        )}
        {canAddProof && (
          <>
            <PhotoInput value={proof} onChange={setProof} required />
            <button type="button" className="btn btn--primary btn--block" disabled={!proof} onClick={sendProof}>
              Send for review
            </button>
          </>
        )}
        {!activity.proof && !isOrganiser && <p className="muted">No photo yet</p>}
      </section>

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
