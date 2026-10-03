import { useState, type FormEvent } from "react";
import { House, MapPin } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { Segmented } from "../../components/Segmented/Segmented";
import { areaHouseholds } from "../../lib/scoring";
import { plural } from "../../lib/text";
import { createHousehold, joinHousehold } from "../../store/actions";
import { useSession, useStore } from "../../store/context";
import type { AppState } from "../../types/types";
import "./Onboarding.css";

type Mode = "join" | "create";
const ICON_SIZE = 16;

export function HouseholdChoicePage() {
  const { state, run } = useStore();
  const { user, household } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("join");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  if (!user?.postcodeAreaId) return <Navigate to="/welcome" replace />;
  if (household) return <Navigate to="/" replace />;

  const households = areaHouseholds(state, user.postcodeAreaId);

  function attempt(change: (s: AppState) => AppState) {
    try {
      run(change);
      navigate("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    attempt((s) => createHousehold(s, user!.id, name));
  }

  function changeMode(next: Mode) {
    setMode(next);
    setError("");
  }

  return (
    <div className="onboarding onboarding--step">
      <PageHeader
        back="back"
        fallback="/welcome"
        title="Your household"
        subtitle={
          <span className="onboarding__sector">
            <MapPin size={ICON_SIZE} aria-hidden="true" />
            {user.postcodeAreaId}
          </span>
        }
      />

      <Segmented
        label="Join or create"
        value={mode}
        onChange={changeMode}
        options={[
          { value: "join", label: "Join" },
          { value: "create", label: "Create" },
        ]}
      />

      {mode === "join" &&
        (households.length === 0 ? (
          <EmptyState icon={House} title="No households here yet">
            <button type="button" className="btn btn--secondary" onClick={() => changeMode("create")}>
              Create one
            </button>
          </EmptyState>
        ) : (
          <ul className="list">
            {households.map((h) => (
              <li key={h.id} className="row">
                <span className="row__main">
                  <span className="row__title">{h.name}</span>
                  <span className="row__meta">
                    {plural(state.users.filter((u) => u.householdId === h.id).length, "member")}
                  </span>
                </span>
                <button type="button" className="btn btn--secondary" onClick={() => attempt((s) => joinHousehold(s, user.id, h.id))}>
                  Join
                </button>
              </li>
            ))}
          </ul>
        ))}

      {mode === "create" && (
        <form className="form" onSubmit={handleCreate} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="household-name">
              Household name
            </label>
            <input
              id="household-name"
              className="field__input"
              value={name}
              autoComplete="off"
              autoCapitalize="words"
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "household-error" : undefined}
            />
          </div>
          <button type="submit" className="btn btn--primary btn--block" disabled={!name.trim()}>
            Create household
          </button>
        </form>
      )}

      {error && (
        <p id="household-error" className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
