import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminAuthPage() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  if (isAuthenticated && user?.role === "admin") {
    return <Navigate replace to="/admin" />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = await login(form);
      if (payload?.user?.role !== "admin") {
        await logout();
        setError("Cette connexion est reservee a l'espace d'administration prive.");
        return;
      }

      navigate("/admin", { replace: true });
    } catch (apiError) {
      setError(apiError?.message || "Impossible de se connecter.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-auth-page">
      <div className="admin-auth-card">
        <div className="admin-auth-copy">
          <p className="admin-auth-badge">Acces prive</p>
          <h1>Centre de controle administrateur securise</h1>
          <p>
            Connectez-vous avec vos identifiants administrateur pour gerer les clients,
            les entreprises, les analytiques et le support depuis un espace protege.
          </p>
        </div>

        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label>
            Email administrateur
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>

          {error ? <p className="error-box">{error}</p> : null}

          <button type="submit" className="admin-auth-submit" disabled={submitting}>
            {submitting ? "Connexion..." : "Ouvrir l'espace admin"}
          </button>
        </form>
      </div>
    </section>
  );
}
