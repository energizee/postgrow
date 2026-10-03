import { useState, type FormEvent } from "react";
import { ChevronLeft, Flame, Repeat, TreeDeciduous, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ActionIcon } from "../components/ActionIcon/ActionIcon";
import { PhotoInput } from "../components/PhotoInput/PhotoInput";
import { ACTIONS, CATEGORY_NAMES, getAction } from "../data/actions";
import { actionAvailability, multiplierFor, streaks } from "../lib/scoring";
import { logContribution } from "../store/actions";
import { useMember, useStore } from "../store/context";
import type { ContributionImpact, ProfileCategory } from "../types/types";
import "./ContributePage.css";

type Step = "type" | "action" | "details" | "done";
const STEPS: Step[] = ["type", "action", "details"];
const ICON_SIZE = 22;
const TYPE_ICON_SIZE = 28;

const IMPACTS: { impact: ContributionImpact; title: string; meta: string; Icon: typeof Repeat }[] = [
  { impact: "habit", title: "Habit", meta: "Proof optional, ×1.5 when approved", Icon: Repeat },
  { impact: "lasting", title: "Lasting change", meta: "Proof required, ×2 when approved", Icon: TreeDeciduous },
];

export function ContributePage() {
  const { state, run } = useStore();
  const { user, household, area } = useMember();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const linkedActivity = state.activities.find((a) => a.id === params.get("activity"));

  const [step, setStep] = useState<Step>(linkedActivity ? "details" : "type");
  const [impact, setImpact] = useState<ContributionImpact>(linkedActivity ? getAction(linkedActivity.actionId).impact : "habit");
  const [category, setCategory] = useState<ProfileCategory | "all">("all");
  const [actionId, setActionId] = useState(linkedActivity?.actionId ?? "");
  const [details, setDetails] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [activityId, setActivityId] = useState(linkedActivity?.id ?? "");
  const [error, setError] = useState("");

  const exit = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"));
  const stepIndex = STEPS.indexOf(step);
  const action = actionId ? getAction(actionId) : null;

  function goBack() {
    setError("");
    if (step === "details" && !linkedActivity) setStep("action");
    else if (step === "action") setStep("type");
    else exit();
  }

  function chooseImpact(next: ContributionImpact) {
    setImpact(next);
    setCategory("all");
    setStep("action");
  }

  function chooseAction(id: string) {
    setActionId(id);
    setImage(null);
    setActivityId("");
    setStep("details");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      run((s) => logContribution(s, { userId: user.id, actionId, details, image, activityId: activityId || null }));
      setError("");
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function startAgain() {
    setActionId("");
    setDetails("");
    setImage(null);
    setActivityId("");
    setStep("type");
  }

  const actions = ACTIONS.filter((a) => a.impact === impact);
  const categories = [...new Set(actions.map((a) => a.category))];
  const visibleActions = actions.filter((a) => category === "all" || a.category === category);
  const activityOptions = state.activities.filter(
    (a) => a.postcodeAreaId === area.id && a.actionId === actionId && a.participantIds.includes(user.id),
  );

  if (step === "done" && action) {
    return (
      <div className="contribute contribute--done" role="status">
        <p className="contribute__points numeric">+{action.basePoints}</p>
        <h1>{action.name}</h1>
        {image && <p className="contribute__pending">×{multiplierFor(action)} once your proof is approved</p>}
        <p className="contribute__streak">
          <Flame size={ICON_SIZE} aria-hidden="true" />
          {streaks(state, user.id).current} day streak
        </p>
        <div className="contribute__actions">
          <button type="button" className="btn btn--primary btn--block" onClick={exit}>
            Done
          </button>
          <button type="button" className="btn btn--secondary btn--block" onClick={startAgain}>
            Log another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contribute">
      <header className="contribute__head">
        <button type="button" className="icon-btn" onClick={goBack} aria-label={step === "type" ? "Close" : "Back"}>
          {step === "type" ? <X size={ICON_SIZE} /> : <ChevronLeft size={ICON_SIZE} />}
        </button>
        <ol className="contribute__progress" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <li key={s} className={i <= stepIndex ? "is-done" : ""} />
          ))}
        </ol>
      </header>

      {step === "type" && (
        <section className="contribute__body">
          <h1>Add contribution</h1>
          <div className="impact-options">
            {IMPACTS.map(({ impact: value, title, meta, Icon }) => (
              <button key={value} type="button" className="impact-option" onClick={() => chooseImpact(value)}>
                <Icon size={TYPE_ICON_SIZE} aria-hidden="true" />
                <span className="impact-option__title">{title}</span>
                <span className="impact-option__meta">{meta}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "action" && (
        <section className="contribute__body">
          <h1>{impact === "habit" ? "Habit" : "Lasting change"}</h1>
          <div className="contribute__filters" role="group" aria-label="Category">
            {(["all", ...categories] as const).map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c === "all" ? "All" : CATEGORY_NAMES[c]}
              </button>
            ))}
          </div>
          <ul className="list">
            {visibleActions.map((a) => {
              const { available, remaining } = actionAvailability(state, household.id, a);
              const status = a.impact === "lasting" ? (available ? null : "Logged") : `${remaining} left today`;
              return (
                <li key={a.id}>
                  <button type="button" className="row row--link action-choice" disabled={!available} onClick={() => chooseAction(a.id)}>
                    <ActionIcon actionId={a.id} lasting={a.impact === "lasting"} />
                    <span className="row__main">
                      <span className="row__title">{a.name}</span>
                      {status && <span className="row__meta">{status}</span>}
                    </span>
                    <span className="row__value">+{a.basePoints}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === "details" && action && (
        <form className="contribute__body form" onSubmit={submit} noValidate>
          <div className="contribute__summary">
            <ActionIcon actionId={action.id} lasting={action.impact === "lasting"} />
            <h1>{action.name}</h1>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="details">
              Details (optional)
            </label>
            <textarea id="details" className="field__input" value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>

          {activityOptions.length > 0 && (
            <div className="field">
              <label className="field__label" htmlFor="activity">
                Group activity
              </label>
              <select id="activity" className="field__input" value={activityId} onChange={(e) => setActivityId(e.target.value)}>
                <option value="">None</option>
                {activityOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!activityId && (
            <PhotoInput value={image} onChange={setImage} required={action.impact === "lasting"} />
          )}

          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--block">
            Log +{action.basePoints}
          </button>
        </form>
      )}
    </div>
  );
}
