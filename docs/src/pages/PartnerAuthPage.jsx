import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/apiClient";
import partnerSettingsImage from "../assets/Parametre_site.jpeg";

function buildValidationMessage(error) {
  if (!error) return "";
  if (error.errors && typeof error.errors === "object") {
    const firstKey = Object.keys(error.errors)[0];
    const firstError = firstKey ? error.errors[firstKey]?.[0] : "";
    if (firstError) return String(firstError);
  }
  return error.message || "Authentication failed.";
}

export default function PartnerAuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "signin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    managerName: "",
    email: "",
    companyName: "",
    description: "",
    logo: null,
    address: "",
    city: "",
    phone: "",
    companyEmail: "",
    password: "",
    passwordConfirmation: "",
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

  const heading = useMemo(
    () => (mode === "register" ? "Rejoignez l'espace partenaire" : "Connexion espace compagnie"),
    [mode]
  );

  useEffect(() => {
    if (mode !== "register" || !turnstileSiteKey) return;

    const renderTurnstile = () => {
      const host = document.getElementById("partner-turnstile");
      if (!host || !window.turnstile || host.dataset.rendered === "1") return false;

      window.turnstile.render(host, {
        sitekey: turnstileSiteKey,
        theme: "light",
        callback: (token) => {
          setTurnstileToken(token);
          setError("");
        },
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });

      host.dataset.rendered = "1";
      return true;
    };

    if (renderTurnstile()) return;

    const interval = window.setInterval(() => {
      if (renderTurnstile()) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [mode, turnstileSiteKey]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role === "company") {
      navigate("/partner/cars", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  }, [isAuthenticated, user?.role, navigate]);

  async function handleSignInSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(signInForm);
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

    if (!turnstileToken) {
      setError("Merci de valider le captcha.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("name", registerForm.managerName);
      payload.append("email", registerForm.email);
      payload.append("company_name", registerForm.companyName);
      payload.append("description", registerForm.description);
      payload.append("address", registerForm.address);
      payload.append("city", registerForm.city);
      payload.append("phone", registerForm.phone);
      payload.append("company_email", registerForm.companyEmail);
      payload.append("password", registerForm.password);
      payload.append("password_confirmation", registerForm.passwordConfirmation);
      payload.append("turnstile_token", turnstileToken);
      if (registerForm.logo) {
        payload.append("logo", registerForm.logo);
      }

      await authApi.companyRegister(payload);
      await login({
        email: registerForm.email,
        password: registerForm.password,
      });
    } catch (apiError) {
      setError(buildValidationMessage(apiError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section partner-auth-page">
      <div className="content-wrap">
        <div className="partner-auth-shell">
          <section className="partner-auth-side partner-auth-side-top">
            <p className="partner-auth-badge">SPEEDRENT PRO</p>
            <h1>Develop your fleet with us</h1>
            <p>
              A dashboard dedicated to your company to manage cars and reservations
              and parameters.
            </p>
            <div className="partner-auth-side-content">
              <div className="partner-auth-points">
                <span>Complete car management</span>
                <span>Suivi reservations en temps reel</span>
                <span>Parametres entreprise centralises</span>
              </div>
              <div className="partner-auth-side-image-wrap">
                <img src={partnerSettingsImage} alt="Parametres entreprise" />
              </div>
            </div>
          </section>

          <div className="partner-auth-card">
            <div className="partner-auth-card-top">
              <p className="partner-auth-switch-top right">
                Deja partenaire ?{" "}
                <button type="button" onClick={() => setMode("signin")}>
                  Se connecter
                </button>
              </p>
            </div>
            <h2>{heading}</h2>
            {mode === "register" ? (
              <p className="partner-auth-subtitle">
                Inscrivez-vous pour devenir partenaire de notre reseau automobile.
              </p>
            ) : null}
            {error ? <p className="error-box">{error}</p> : null}

            {mode === "signin" ? (
              <form className="partner-auth-form" onSubmit={handleSignInSubmit}>
                <label>
                  Email Professionnel
                  <input
                    type="email"
                    value={signInForm.email}
                    onChange={(event) =>
                      setSignInForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Mot de passe
                  <input
                    type="password"
                    value={signInForm.password}
                    onChange={(event) =>
                      setSignInForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                  />
                </label>
                <button className="partner-auth-submit" type="submit" disabled={submitting}>
                  {submitting ? "Connexion..." : "Acceder au dashboard"}
                </button>
                <p>
                  Nouveau partenaire ?{" "}
                  <button type="button" onClick={() => setMode("register")}>
                    Creer un compte
                  </button>
                </p>
              </form>
            ) : (
              <form className="partner-auth-form" onSubmit={handleRegisterSubmit}>
                <div className="partner-register-grid">
                  <section className="partner-register-block">
                    <h3>1. Informations Personnelles</h3>
                    <label>
                      Nom du gerant
                      <input
                        type="text"
                        value={registerForm.managerName}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, managerName: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Email Professionnel
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Telephone
                      <input
                        type="text"
                        value={registerForm.phone}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                        required
                      />
                    </label>
                  </section>

                  <section className="partner-register-block">
                    <h3>2. Informations de la Compagnie</h3>
                    <label>
                      Nom compagnie
                      <input
                        type="text"
                        value={registerForm.companyName}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, companyName: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Adresse
                      <input
                        type="text"
                        value={registerForm.address}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, address: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Ville
                      <input
                        type="text"
                        value={registerForm.city}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, city: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Email compagnie
                      <input
                        type="email"
                        value={registerForm.companyEmail}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, companyEmail: event.target.value }))
                        }
                        required
                      />
                    </label>
                  </section>

                  <section className="partner-register-block">
                    <h3>3. Parametres du Compte</h3>
                    <label>
                      Mot de passe
                      <input
                        type="password"
                        value={registerForm.password}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Confirmation mot de passe
                      <input
                        type="password"
                        value={registerForm.passwordConfirmation}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({
                            ...prev,
                            passwordConfirmation: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                          setRegisterForm((prev) => ({
                            ...prev,
                            logo: event.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>
                  </section>

                  <section className="partner-register-block">
                    <h3>4. Details de la Compagnie</h3>
                    <label>
                      Description
                      <textarea
                        value={registerForm.description}
                        onChange={(event) =>
                          setRegisterForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        rows={5}
                      />
                    </label>
                  </section>

                  <section className="partner-register-block partner-register-captcha">
                    <h3>5. Verification</h3>
                    <div className="captcha-box partner-captcha-box">
                      {turnstileSiteKey ? (
                        <div id="partner-turnstile" className="turnstile-wrap" />
                      ) : (
                        <p className="error-box">
                          Turnstile site key missing. Set VITE_TURNSTILE_SITE_KEY.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
                <button className="partner-auth-submit" type="submit" disabled={submitting}>
                  {submitting ? "Creation..." : "Creer compte compagnie"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
