import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "./BrandLogo";
import { resolveMediaUrl } from "../services/apiClient";
import { getAvatarSrcByKey } from "../utils/avatars";

function hasCustomAvatarPath(path) {
  const clean = String(path || "").trim();
  return Boolean(clean && clean !== "default-avatar.png" && clean !== "/default-avatar.png");
}

export default function SiteLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showPartnerCta, setShowPartnerCta] = useState(false);

  const showHomeInNav = useMemo(() => location.pathname !== "/", [location.pathname]);
  const isAuthPage = useMemo(() => location.pathname.startsWith("/auth"), [location.pathname]);
  const isPartnerSpace = useMemo(() => location.pathname.startsWith("/partner"), [location.pathname]);
  const isPartnerAuthPage = useMemo(() => location.pathname.startsWith("/partner/auth"), [location.pathname]);
  const isHomePage = useMemo(() => location.pathname === "/", [location.pathname]);

  const headerName = useMemo(() => user?.name || "youssef bel", [user?.name]);
  const avatarInitials = useMemo(() => {
    const raw = String(headerName).trim();
    const parts = raw.split(/\s+/).slice(0, 2);
    const initials = parts.map((part) => part[0]?.toUpperCase() || "").join("");
    return initials || "U";
  }, [headerName]);

  const avatarSrc = useMemo(() => {
    if (hasCustomAvatarPath(user?.avatar)) {
      return resolveMediaUrl(user.avatar);
    }

    if (user?.avatar_key) {
      return getAvatarSrcByKey(user.avatar_key);
    }

    return null;
  }, [user?.avatar, user?.avatar_key]);

  useEffect(() => {
    setShowPartnerCta(!isAuthenticated && !isPartnerSpace && isHomePage);
  }, [isAuthenticated, isPartnerSpace, isHomePage]);

  useEffect(() => {
    let timer;
    function handleToast(event) {
      const message = String(event?.detail || "").trim();
      if (!message) return;
      setToastMessage(message);
      clearTimeout(timer);
      timer = setTimeout(() => setToastMessage(""), 2300);
    }

    window.addEventListener("app-toast", handleToast);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("app-toast", handleToast);
    };
  }, []);

  async function handleAuthButton() {
    if (isAuthenticated) {
      await logout();
      navigate("/");
      return;
    }

    navigate("/auth?mode=signin");
  }

  function handlePartnerCta() {
    navigate("/partner/auth?mode=register");
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="content-wrap site-header-inner">
          <BrandLogo className="header-logo" />
          {isPartnerSpace && !isPartnerAuthPage ? (
            <nav className="site-nav" aria-label="Primary">
              <Link to="/partner/cars">Cars Management</Link>
              <Link to="/partner/bookings">Bookings</Link>
            </nav>
          ) : !isPartnerAuthPage ? (
            <nav className="site-nav" aria-label="Primary">
              {showHomeInNav ? <Link to="/">Home</Link> : null}
              <Link to="/companies">Companies</Link>
              <a href="/#contact">Contact</a>
            </nav>
          ) : (
            <nav className="site-nav partner-auth-navbar" aria-label="Primary">
              <Link to="/">Retour a l'accueil client</Link>
            </nav>
          )}

          {isAuthenticated ? (
            <div className="header-user-wrap">
              <button
                aria-expanded={menuOpen}
                className="header-user-btn"
                onClick={() => setMenuOpen((open) => !open)}
                type="button"
              >
                {avatarSrc ? (
                  <img alt={`${headerName} avatar`} className="header-user-avatar" src={avatarSrc} />
                ) : (
                  <span className="header-user-avatar header-user-avatar-fallback">{avatarInitials}</span>
                )}
                <span className="header-user-name">{headerName}</span>
                <span className={`header-user-arrow ${menuOpen ? "open" : ""}`}>▾</span>
              </button>

              {menuOpen ? (
                <div className="header-user-menu">
                  <Link onClick={() => setMenuOpen(false)} to="/profile">
                    My Profile
                  </Link>
                  <Link onClick={() => setMenuOpen(false)} to="/archives">
                    Archives
                  </Link>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await handleAuthButton();
                    }}
                    type="button"
                  >
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="header-actions-guest">
              {showPartnerCta ? (
                <button className="partner-cta-btn" type="button" onClick={handlePartnerCta}>
                  Devenez Partenaire
                </button>
              ) : null}

              {!isAuthPage && !isPartnerAuthPage ? (
                <button onClick={handleAuthButton} type="button" className="sign-button">
                  Sign In / Register
                </button>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="content-wrap site-footer-inner">
          <div className="footer-links">
            <a href="/#contact">Social Media</a>
          </div>

          <p className="footer-copy">{isAuthenticated && user?.name ? `${user.name} - ` : ""}Copyright SPEEDRENT Inc ©</p>

          <div className="footer-logo-slot">
            <BrandLogo className="footer-logo" />
          </div>
        </div>
      </footer>

      {toastMessage ? <div className="app-toast">{toastMessage}</div> : null}
    </div>
  );
}
