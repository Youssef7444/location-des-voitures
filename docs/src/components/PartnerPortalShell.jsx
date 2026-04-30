import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PartnerPortalShell({ title, children, actions = null }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/partner/auth?mode=signin" />;
  }

  if (user?.role !== "company") {
    return <Navigate replace to="/" />;
  }

  return (
    <section className="section partner-portal-page company-home-theme">
      <div className="content-wrap">
        <div className="partner-portal-flat">
          <header className="partner-flat-head">
            <div>
              <h1>{title}</h1>
              <p>Tableau dynamique lie a la base de donnees</p>
            </div>
            {actions ? <div className="partner-flat-actions">{actions}</div> : null}
          </header>

          <div className="partner-portal-content">{children}</div>
        </div>
      </div>
    </section>
  );
}

