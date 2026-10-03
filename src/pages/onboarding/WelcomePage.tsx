import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../../components/Logo/Logo";
import { DEMO_USER_ID } from "../../data/seed";
import { lookupPostcode, PostcodeError } from "../../lib/postcodes";
import { signUp, switchUser } from "../../store/actions";
import { useSession, useStore } from "../../store/context";
import "./Onboarding.css";

export function WelcomePage() {
  const { run } = useStore();
  const { user, household } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [postcode, setPostcode] = useState("");
  const [errors, setErrors] = useState<{ name?: string; postcode?: string }>({});
  const [checking, setChecking] = useState(false);

  if (household) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = {
      name: name.trim() ? undefined : "Enter a username",
      postcode: postcode.trim() ? undefined : "Enter your postcode",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.postcode) return;

    setChecking(true);
    try {
      const lookup = await lookupPostcode(postcode);
      run((s) => signUp(s, name.trim(), lookup));
      navigate("/welcome/household");
    } catch (error) {
      setErrors({ postcode: error instanceof PostcodeError ? error.message : "Something went wrong. Try again." });
    } finally {
      setChecking(false);
    }
  }

  function startDemo() {
    run((s) => switchUser(s, DEMO_USER_ID));
    navigate("/");
  }

  return (
    <div className="onboarding">
      <div className="onboarding__hero">
        <Logo />
        <h1>Grow your postcode</h1>
      </div>

      <form className="form onboarding__form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="name">
            Username
          </label>
          <input
            id="name"
            className="field__input"
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <span id="name-error" className="field__error">
              {errors.name}
            </span>
          )}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="postcode">
            Postcode
          </label>
          <input
            id="postcode"
            className="field__input onboarding__postcode"
            autoComplete="postal-code"
            autoCapitalize="characters"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            aria-invalid={Boolean(errors.postcode)}
            aria-describedby={errors.postcode ? "postcode-error" : undefined}
          />
          {errors.postcode && (
            <span id="postcode-error" className="field__error" role="alert">
              {errors.postcode}
            </span>
          )}
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={checking}>
          {checking ? "Checking postcode" : "Continue"}
        </button>
      </form>

      <button type="button" className="onboarding__demo" onClick={startDemo}>
        Use a demo account
      </button>
    </div>
  );
}
