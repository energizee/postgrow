import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { actionsByImpact } from "../../data/actions";
import { createActivity } from "../../store/actions";
import { useMember, useStore } from "../../store/context";
import "./Bulletin.css";

const DEFAULT_ACTION = "litter-pick";

export function NewActivityPage() {
  const { run } = useStore();
  const { user } = useMember();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", actionId: DEFAULT_ACTION, date: "", place: "", description: "" });
  const [error, setError] = useState("");

  const update = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (form.date && Date.parse(form.date) < Date.now()) throw new Error("Pick a time in the future");
      let createdId = "";
      run((s) => {
        const result = createActivity(s, user.id, { ...form, date: form.date ? new Date(form.date).toISOString() : "" });
        createdId = result.activityId;
        return result.state;
      });
      navigate(`/bulletin/${createdId}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="page">
      <PageHeader back="close" fallback="/bulletin" title="New activity" />
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="title">
            Title
          </label>
          <input id="title" className="field__input" value={form.title} onChange={update("title")} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="action">
            Action
          </label>
          <select id="action" className="field__input" value={form.actionId} onChange={update("actionId")}>
            <optgroup label="Habits">
              {actionsByImpact("habit").map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Lasting changes">
              {actionsByImpact("lasting").map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="date">
            Date and time
          </label>
          <input id="date" type="datetime-local" className="field__input" value={form.date} onChange={update("date")} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="place">
            Meeting point
          </label>
          <input id="place" className="field__input" value={form.place} onChange={update("place")} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="description">
            Details (optional)
          </label>
          <textarea id="description" className="field__input" value={form.description} onChange={update("description")} />
        </div>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary btn--block">
          Post activity
        </button>
      </form>
    </div>
  );
}
