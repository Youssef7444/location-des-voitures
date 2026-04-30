import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getAvatarSrcByKey } from "../utils/avatars";
import { resolveMediaUrl } from "../services/apiClient";
import { hasCustomAdminAvatar } from "../utils/adminHelpers";
import BrandLogo from "./BrandLogo";

function AdminIcon({ name }) {
  const props = { viewBox: "0 0 24 24", className: "admin-shell-icon", "aria-hidden": "true" };

  const icons = {
    dashboard: (
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5A1.5 1.5 0 0 1 10.5 12h-5A1.5 1.5 0 0 1 4 10.5Zm8 0A1.5 1.5 0 0 1 13.5 4h5A1.5 1.5 0 0 1 20 5.5v2A1.5 1.5 0 0 1 18.5 9h-5A1.5 1.5 0 0 1 12 7.5Zm0 8A1.5 1.5 0 0 1 13.5 12h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5Zm-8 1A2.5 2.5 0 0 1 6.5 12h3A2.5 2.5 0 0 1 12 14.5v3A2.5 2.5 0 0 1 9.5 20h-3A2.5 2.5 0 0 1 4 17.5Z" />
    ),
    clients: (
      <path d="M9 7.5A2.5 2.5 0 1 0 9 12.5A2.5 2.5 0 1 0 9 7.5ZM15.5 8.2a2 2 0 1 0 0 4a2 2 0 1 0 0-4M4.5 18a4.5 4.5 0 0 1 9 0M13 18a3.5 3.5 0 0 1 6.5-1.8" />
    ),
    companies: (
      <path d="M4 19V9.5L12 5l8 4.5V19M7 19v-3.5M11 19v-3.5M15 19v-3.5M8 10.8h8M8 13.4h8" />
    ),
    support: (
      <path d="M6 7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5v6A2.5 2.5 0 0 1 15.5 16H12l-3.8 3V16H8.5A2.5 2.5 0 0 1 6 13.5Z" />
    ),
  };

  return <svg {...props}>{icons[name] || icons.dashboard}</svg>;
}

function getPageTitle(pathname) {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.includes("/clients")) return "Clients";
  if (pathname.includes("/companies")) return "Companies";
  if (pathname.includes("/support")) return "Support";
  return "Administration";
}

export default function AdminPortalShell() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const avatarSrc = useMemo(() => {
    if (hasCustomAdminAvatar(user?.avatar)) {
      return resolveMediaUrl(user.avatar);
    }

    if (user?.avatar_key) {
      return getAvatarSrcByKey(user.avatar_key);
    }

    return null;
  }, [user?.avatar, user?.avatar_key]);

  if (!isAuthenticated) {
    return <Navigate replace to="/admin/auth" />;
  }

  if (user?.role !== "admin") {
    return <Navigate replace to="/" />;
  }

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
    { to: "/admin/clients", label: "Clients", icon: "clients" },
    { to: "/admin/companies", label: "Companies", icon: "companies" },
    { to: "/admin/support", label: "Support", icon: "support" },
  ];

  return (
    <section className="admin-shell-page admin-cinematic-shell-page">
      <div className="admin-shell admin-cinematic-shell">
        <aside className="admin-sidebar admin-cinematic-sidebar">
          <div className="admin-sidebar-brand">
            <BrandLogo className="admin-sidebar-brand-logo-image" />
          </div>

          <nav className="admin-sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `admin-sidebar-link ${isActive ? "is-active" : ""}`}
              >
                <AdminIcon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="admin-main-panel admin-cinematic-main-panel">
          <header className="admin-topbar admin-cinematic-topbar">
            <div className="admin-topbar-standard-brand">
              <BrandLogo className="header-logo" />
            </div>

            <div className="admin-topbar-standard-actions">
              <div className="admin-topbar-page-title">
                <h1>{getPageTitle(location.pathname)}</h1>
              </div>

              <div className="admin-topbar-user">
                <div className="admin-topbar-avatar-ring">
                  {avatarSrc ? <img src={avatarSrc} alt="Admin avatar" /> : <div className="admin-topbar-avatar">A</div>}
                </div>
              </div>

              <button
                type="button"
                className="admin-topbar-logout"
                onClick={async () => {
                  await logout();
                  navigate("/admin/auth");
                }}
              >
                Deconnexion
              </button>
            </div>
          </header>

          <div className="admin-content-surface admin-cinematic-content-surface">
            <Outlet />
          </div>
        </main>
      </div>
    </section>
  );
}
