import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import verificationImage from "../assets/verification-captcha.svg";

function buildValidationMessage(error) {
  if (!error) {
    return "";
  }

  if (error.errors && typeof error.errors === "object") {
    const firstKey = Object.keys(error.errors)[0];
    const firstError = firstKey ? error.errors[firstKey]?.[0] : "";
    if (firstError) {
      return String(firstError);
    }
  }

  return error.message || "Authentication failed.";
}

export default function AuthPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();

  const nextPath = useMemo(() => params.get("next") || "/", [params]);
  const queryMode = useMemo(() => params.get("mode"), [params]);
  const [mode, setMode] = useState(queryMode === "register" ? "register" : "signin");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, navigate, nextPath]);

  useEffect(() => {
    if (location.search.includes("mode=register")) {
      setMode("register");
    }
  }, [location.search]);

  async function handleSignInSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(signInForm);
      navigate(nextPath, { replace: true });
    } catch (apiError) {
      setError(buildValidationMessage(apiError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register({
        ...registerForm,
        role: "client",
      });
      navigate(nextPath, { replace: true });
    } catch (apiError) {
      setError(buildValidationMessage(apiError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section auth-screen">
      <div className="auth-card">
        

        <h2>{mode === "register" ? "Sign Up" : "Sign In"}</h2>

        {error ? <p className="error-box">{error}</p> : null}

        {mode === "signin" ? (
          <form className="auth-form" onSubmit={handleSignInSubmit}>
            <input
              type="email"
              placeholder="Email Address"
              value={signInForm.email}
              onChange={(event) => setSignInForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={signInForm.password}
              onChange={(event) => setSignInForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />

            <button className="hero-search-btn auth-submit" disabled={submitting} type="submit">
              {submitting ? "Please wait..." : "Sign In"}
            </button>

            <p className="auth-switch">
              New user?{" "}
              <button onClick={() => setMode("register")} type="button">
                Create account
              </button>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <input
              type="text"
              placeholder="Full Name"
              value={registerForm.name}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Re-enter Password"
              value={registerForm.password_confirmation}
              onChange={(event) =>
                setRegisterForm((prev) => ({ ...prev, password_confirmation: event.target.value }))
              }
              required
            />

            <div className="captcha-box">
              <label className="captcha-check" htmlFor="captcha">
                <input id="captcha" type="checkbox" required />
                <span>I'm not a robot</span>
              </label>
              <img src={verificationImage} alt="Verification" className="captcha-image" />
            </div>

            <button className="hero-search-btn auth-submit" disabled={submitting} type="submit">
              {submitting ? "Please wait..." : "Create"}
            </button>

            <p className="auth-switch">
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} type="button">
                Sign In
              </button>
            </p>
          </form>
        )}

        <p className="auth-back-link">
          <Link to="/">Back to Cars</Link>
        </p>
      </div>
    </section>
  );
}
