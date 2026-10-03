import { useState, type FormEvent } from "react";
import { Flame, Pencil, UserMinus } from "lucide-react";
import { Avatar } from "../components/Avatar/Avatar";
import { ContributionList } from "../components/ContributionList/ContributionList";
import { PageHeader } from "../components/PageHeader/PageHeader";
import { householdLifetimePoints, householdRecentPoints, rankHouseholds, streaks, userRecentPoints } from "../lib/scoring";
import { removeMember, renameHousehold } from "../store/actions";
import { useMember, useStore } from "../store/context";
import "./HouseholdPage.css";

const ICON_SIZE = 18;
const HISTORY_LIMIT = 20;

export function HouseholdPage() {
  const { state, run } = useStore();
  const { user, household, area } = useMember();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(household.name);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isOwner = household.owner === user.id;
  const members = state.users.filter((u) => u.householdId === household.id);
  const ranking = rankHouseholds(state, area.id);
  const rank = ranking.findIndex((r) => r.household.id === household.id) + 1;
  const history = state.contributions.filter((c) => c.householdId === household.id);

  function attempt(change: Parameters<typeof run>[0]) {
    try {
      run(change);
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    }
  }

  function saveName(event: FormEvent) {
    event.preventDefault();
    if (attempt((s) => renameHousehold(s, user.id, name))) setEditing(false);
  }

  return (
    <div className="page">
      {editing ? (
        <form className="household-rename" onSubmit={saveName}>
          <label htmlFor="household-name" className="visually-hidden">
            Household name
          </label>
          <input id="household-name" className="field__input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <button type="submit" className="btn btn--primary">
            Save
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <PageHeader
          title={household.name}
          subtitle={area.id}
          actions={
            isOwner && (
              <button type="button" className="icon-btn" onClick={() => setEditing(true)} aria-label="Rename household">
                <Pencil size={ICON_SIZE} />
              </button>
            )
          }
        />
      )}

      <dl className="stats">
        <div className="stat">
          <dt>Points, 30 days</dt>
          <dd>{householdRecentPoints(state, household.id)}</dd>
        </div>
        <div className="stat">
          <dt>Lifetime</dt>
          <dd>{householdLifetimePoints(state, household.id)}</dd>
        </div>
        <div className="stat">
          <dt>Rank in {area.id}</dt>
          <dd>
            {rank}
            <span className="stat__of"> of {ranking.length}</span>
          </dd>
        </div>
      </dl>

      <section className="section" aria-labelledby="members-heading">
        <h2 id="members-heading">Members</h2>
        <ul className="list">
          {members.map((m) => (
            <li key={m.id} className="row">
              <Avatar name={m.name} />
              <span className="row__main">
                <span className="row__title">
                  {m.name}
                  {m.id === household.owner && <span className="muted"> (owner)</span>}
                </span>
                <span className="row__meta member__streak">
                  <Flame size={ICON_SIZE - 4} aria-hidden="true" />
                  {streaks(state, m.id).current} day streak
                </span>
              </span>
              <span className="row__value">{userRecentPoints(state, m.id)}</span>
              {isOwner &&
                m.id !== user.id &&
                (confirmRemove === m.id ? (
                  <button type="button" className="btn btn--danger" onClick={() => attempt((s) => removeMember(s, user.id, m.id))}>
                    Remove
                  </button>
                ) : (
                  <button type="button" className="icon-btn" onClick={() => setConfirmRemove(m.id)} aria-label={`Remove ${m.name}`}>
                    <UserMinus size={ICON_SIZE} />
                  </button>
                ))}
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      <section className="section" aria-labelledby="history-heading">
        <h2 id="history-heading">History</h2>
        {history.length ? <ContributionList contributions={history} limit={HISTORY_LIMIT} showMember /> : <p className="muted">Nothing logged yet</p>}
      </section>
    </div>
  );
}
