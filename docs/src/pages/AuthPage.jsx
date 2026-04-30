import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
  const turnstileRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

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

  useEffect(() => {
    if (mode !== "register") {
      return;
    }

    if (!turnstileSiteKey) {
      return;
    }

    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current || turnstileWidgetIdRef.current !== null) {
        return false;
      }

      const widgetId = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        theme: "light",
        callback: (token) => {
          setTurnstileToken(token);
          setError("");
        },
        "expired-callback": () => {
          setTurnstileToken("");
        },
        "error-callback": () => {
          setTurnstileToken("");
        },
      });

      turnstileWidgetIdRef.current = widgetId;
      return true;
    };

    if (renderWidget()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (renderWidget()) {
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [mode, turnstileSiteKey]);

  useEffect(() => {
    return () => {
      if (turnstileWidgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, []);

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

    if (!turnstileSiteKey) {
      setError("Turnstile site key is missing.");
      setSubmitting(false);
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the captcha.");
      setSubmitting(false);
      return;
    }

    try {
      await register({
        ...registerForm,
        role: "client",
        turnstile_token: turnstileToken,
      });
      navigate(nextPath, { replace: true });
    } catch (apiError) {
      setError(buildValidationMessage(apiError));
      setTurnstileToken("");
      if (turnstileWidgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
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
              {turnstileSiteKey ? (
                <div className="turnstile-wrap" ref={turnstileRef} />
              ) : (
                <p className="error-box">Turnstile site key missing.</p>
              )}
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
