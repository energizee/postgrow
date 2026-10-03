import { useState } from "react";
import { Flame, LogOut, MapPinned, RotateCcw, UserMinus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../components/Avatar/Avatar";
import { ContributionList } from "../components/ContributionList/ContributionList";
import { streaks, userRecentPoints } from "../lib/scoring";
import { changePostcode, leaveHousehold, signOut, switchUser } from "../store/actions";
import { useMember, useStore } from "../store/context";
import "./ProfilePage.css";

const ICON_SIZE = 18;
const AVATAR_SIZE = 64;
const HISTORY_LIMIT = 10;

export function ProfilePage() {
  const { state, run, reset } = useStore();
  const { user, household, area } = useMember();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<"leave" | "postcode" | "reset" | null>(null);

  const streak = streaks(state, user.id);
  const contributions = state.contributions.filter((c) => c.userId === user.id);
  const demoUsers = [...state.users].filter((u) => u.householdId).sort((a, b) => a.name.localeCompare(b.name));

  function confirmThen(kind: NonNullable<typeof confirm>, action: () => void) {
    if (confirm === kind) action();
    else setConfirm(kind);
  }

  const settings = [
    {
      kind: "leave" as const,
      label: "Leave household",
      confirmLabel: "Yes, leave household",
      Icon: UserMinus,
      action: () => run((s) => leaveHousehold(s, user.id)),
    },
    {
      kind: "postcode" as const,
      label: "Change postcode",
      confirmLabel: "Yes, change postcode",
      Icon: MapPinned,
      action: () => {
        run((s) => changePostcode(s, user.id));
        navigate("/welcome");
      },
    },
  ];

  return (
    <div className="page">
      <header className="profile-head">
        <Avatar name={user.name} size={AVATAR_SIZE} />
        <div>
          <h1>{user.name}</h1>
          <p className="muted">
            {household.name}, {area.id}
          </p>
        </div>
      </header>

      <dl className="stats">
        <div className="stat stat--streak">
          <dt>Day streak</dt>
          <dd>
            <Flame size={ICON_SIZE + 6} aria-hidden="true" />
            {streak.current}
          </dd>
        </div>
        <div className="stat">
          <dt>Best streak</dt>
          <dd>{streak.best}</dd>
        </div>
        <div className="stat">
          <dt>Points, 30 days</dt>
          <dd>{userRecentPoints(state, user.id)}</dd>
        </div>
        <div className="stat">
          <dt>Contributions</dt>
          <dd>{contributions.length}</dd>
        </div>
      </dl>

      <section className="section" aria-labelledby="mine-heading">
        <h2 id="mine-heading">Your contributions</h2>
        {contributions.length ? (
          <ContributionList contributions={contributions} limit={HISTORY_LIMIT} />
        ) : (
          <p className="muted">Nothing logged yet</p>
        )}
      </section>

      <section className="section" aria-labelledby="settings-heading">
        <h2 id="settings-heading">Settings</h2>
        <ul className="list">
          {settings.map(({ kind, label, confirmLabel, Icon, action }) => (
            <li key={kind}>
              <button type="button" className="row row--link setting" onClick={() => confirmThen(kind, action)}>
                <Icon size={ICON_SIZE} aria-hidden="true" />
                <span className="row__main">{confirm === kind ? confirmLabel : label}</span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="row row--link setting" onClick={() => run(signOut)}>
              <LogOut size={ICON_SIZE} aria-hidden="true" />
              <span className="row__main">Sign out</span>
            </button>
          </li>
        </ul>
      </section>

      <section className="section demo" aria-labelledby="demo-heading">
        <h2 id="demo-heading">Demo</h2>
        <div className="field">
          <label className="field__label" htmlFor="switch-user">
            Switch user
          </label>
          <select
            id="switch-user"
            className="field__input"
            value={user.id}
            onChange={(e) => {
              run((s) => switchUser(s, e.target.value));
              navigate("/");
            }}
          >
            {demoUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}, {u.postcodeAreaId}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() =>
            confirmThen("reset", () => {
              reset();
              navigate("/welcome");
            })
          }
        >
          <RotateCcw size={ICON_SIZE} aria-hidden="true" />
          {confirm === "reset" ? "Yes, reset demo data" : "Reset demo data"}
        </button>
      </section>
    </div>
  );
}
