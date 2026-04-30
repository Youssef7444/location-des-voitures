import { useEffect, useMemo, useState } from "react";
import { adminApi, resolveMediaUrl } from "../services/apiClient";
import { getAvatarSrcByKey } from "../utils/avatars";
import { formatAdminDate, hasCustomAdminAvatar } from "../utils/adminHelpers";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-clients-luxe-search-icon" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16 20 20" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-clients-luxe-meta-icon" aria-hidden="true">
      <path d="M7 4.75v2.5M17 4.75v2.5M4.75 9.25h14.5" />
      <rect x="4.75" y="7" width="14.5" height="12.25" rx="2.25" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-clients-luxe-sparkle-icon" aria-hidden="true">
      <path d="m12 3 1.55 4.45L18 9l-4.45 1.55L12 15l-1.55-4.45L6 9l4.45-1.55Z" />
      <path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
    </svg>
  );
}

function ReservationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-clients-luxe-meta-icon" aria-hidden="true">
      <path d="M7 4.75v2.5M17 4.75v2.5M4.75 9.25h14.5" />
      <rect x="4.75" y="7" width="14.5" height="12.25" rx="2.25" />
      <path d="m9.25 14 1.75 1.75 3.75-4.25" />
    </svg>
  );
}

function getClientAvatar(user) {
  if (hasCustomAdminAvatar(user?.avatar)) {
    return resolveMediaUrl(user.avatar);
  }

  return getAvatarSrcByKey(user?.avatar_key);
}

function getClientStatus(user) {
  return user?.status === "inactive" ? "inactive" : "active";
}

function getClientInitials(name) {
  return String(name || "Client")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function AdminClientsPage() {
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [usersPayload, reservationsPayload] = await Promise.all([
          adminApi.listUsers(),
          adminApi.listReservations(),
        ]);

        if (!mounted) return;

        const list = Array.isArray(usersPayload?.data) ? usersPayload.data : [];
        const clients = list.filter((item) => item.role === "client");
        setUsers(clients);
        setReservations(Array.isArray(reservationsPayload?.data) ? reservationsPayload.data : []);
        setSelectedId(clients[0]?.id || null);
      } catch (apiError) {
        if (mounted) setError(apiError?.message || "Impossible de charger les clients.");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const reservationCountByUser = useMemo(() => {
    return reservations.reduce((accumulator, reservation) => {
      const userId = Number(reservation?.user_id);
      if (!userId) return accumulator;
      accumulator[userId] = (accumulator[userId] || 0) + 1;
      return accumulator;
    }, {});
  }, [reservations]);

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const target = `${item.name} ${item.email} ${item.phone || ""} ${item.city || ""}`.toLowerCase();
      const matchesSearch = target.includes(search.toLowerCase());
      const matchesFilter = filter === "all" ? true : getClientStatus(item) === filter;
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, users]);

  const selectedUser =
    filteredUsers.find((item) => item.id === selectedId) ||
    users.find((item) => item.id === selectedId) ||
    filteredUsers[0] ||
    null;

  const selectedReservations = useMemo(() => {
    return reservations
      .filter((reservation) => Number(reservation?.user_id) === Number(selectedUser?.id))
      .slice(0, 4);
  }, [reservations, selectedUser?.id]);

  async function updateStatus(userId, status) {
    try {
      const payload = await adminApi.updateUser(userId, { status });
      setUsers((current) => current.map((item) => (item.id === userId ? { ...item, ...payload.user } : item)));
    } catch (apiError) {
      setError(apiError?.message || "Impossible de modifier le client.");
    }
  }

  async function deleteClient(userId) {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer un client ?");

    if (!confirmed) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      const nextUsers = users.filter((item) => item.id !== userId);
      setUsers(nextUsers);
      setSelectedId(nextUsers[0]?.id || null);
    } catch (apiError) {
      setError(apiError?.message || "Impossible de supprimer le client.");
    }
  }

  return (
    <div className="admin-clients-luxe-page">
      {error ? <p className="error-box">{error}</p> : null}

      <section className="admin-clients-luxe-hero">
        <div>
          <h2>Clients</h2>
          <p>Luxury CRM surface for high-value renters, VIP guests and real-time reservation relationships.</p>
        </div>

        <div className="admin-clients-luxe-controls">
          <label className="admin-clients-luxe-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by name, email or city..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="admin-clients-luxe-filters" role="tablist" aria-label="Client filters">
            <button type="button" className={filter === "all" ? "is-active is-all" : "is-all"} onClick={() => setFilter("all")}>
              All
            </button>
            <button type="button" className={filter === "active" ? "is-active is-active-filter" : "is-active-filter"} onClick={() => setFilter("active")}>
              Active
            </button>
            <button type="button" className={filter === "inactive" ? "is-active is-inactive-filter" : "is-inactive-filter"} onClick={() => setFilter("inactive")}>
              Disabled
            </button>
          </div>
        </div>
      </section>

      <section className="admin-clients-luxe-layout">
        <div className="admin-clients-luxe-grid">
          {filteredUsers.map((item, index) => {
            const status = getClientStatus(item);
            const avatar = getClientAvatar(item);
            const reservationsCount = reservationCountByUser[Number(item.id)] || 0;
            const isPremium = reservationsCount >= 3;

            return (
              <article
                key={item.id}
                className={`admin-clients-luxe-card ${selectedUser?.id === item.id ? "is-selected" : ""}`}
                onMouseEnter={() => setSelectedId(item.id)}
              >
                <div className="admin-clients-luxe-card-sheen" aria-hidden="true" />
                <div className="admin-clients-luxe-card-top">
                  <div className="admin-clients-luxe-avatar-wrap">
                    {avatar ? (
                      <img src={avatar} alt={item.name} className="admin-clients-luxe-avatar" />
                    ) : (
                      <div className="admin-clients-luxe-avatar admin-clients-luxe-avatar-fallback">
                        {getClientInitials(item.name)}
                      </div>
                    )}
                    <span className={`admin-clients-luxe-status-dot ${status}`} />
                  </div>

                  <div className="admin-clients-luxe-card-meta">
                    <h3>{item.name}</h3>
                    <p>{item.email}</p>
                  </div>
                </div>

                <div className="admin-clients-luxe-card-bottom">
                  <span className={`admin-clients-luxe-badge ${status}`}>{status === "active" ? "Active" : "Disabled"}</span>
                  <button type="button" className="admin-clients-luxe-button" onClick={() => setSelectedId(item.id)}>
                    View Profile
                  </button>
                </div>

                <aside className="admin-clients-luxe-hover-panel">
                  <div className="admin-clients-luxe-hover-row">
                    <div className="admin-clients-luxe-hover-label">
                      <CalendarIcon />
                      <span>Registration</span>
                    </div>
                    <strong>{formatAdminDate(item.created_at, { fallback: "Recently added" })}</strong>
                  </div>

                  <div className="admin-clients-luxe-hover-row">
                    <div className="admin-clients-luxe-hover-label">
                      <ReservationIcon />
                      <span>Total reservations</span>
                    </div>
                    <strong style={{ "--count-order": index + 1 }}>{reservationsCount}</strong>
                  </div>

                  <div className="admin-clients-luxe-hover-row">
                    <span>Status toggle</span>
                    <button
                      type="button"
                      className={`admin-clients-luxe-switch ${status === "active" ? "is-on" : ""}`}
                      onClick={() => updateStatus(item.id, status === "active" ? "inactive" : "active")}
                      aria-label={`Toggle ${item.name} status`}
                    >
                      <span />
                    </button>
                  </div>

                  <div className="admin-clients-luxe-hover-row admin-clients-luxe-progress-row">
                    <span>Loyalty level</span>
                    <div className="admin-clients-luxe-ring" style={{ "--progress": "75%" }}>
                      <span>75%</span>
                    </div>
                  </div>

                  {isPremium ? (
                    <div className="admin-clients-luxe-premium-note">
                      <SparkleIcon />
                      <span>Premium loyalty detected</span>
                    </div>
                  ) : null}
                </aside>
              </article>
            );
          })}

          {!filteredUsers.length ? (
            <div className="admin-clients-luxe-empty">No clients matched your search or filter.</div>
          ) : null}
        </div>

        <aside className="admin-clients-luxe-preview">
          {selectedUser ? (
            <>
              <div className="admin-clients-luxe-preview-head">
                <div className="admin-clients-luxe-preview-title">
                  <p>Holographic preview</p>
                  <h3>{selectedUser.name}</h3>
                </div>
                <span className={`admin-clients-luxe-badge ${getClientStatus(selectedUser)}`}>
                  {getClientStatus(selectedUser) === "active" ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="admin-clients-luxe-preview-hero">
                {getClientAvatar(selectedUser) ? (
                  <img src={getClientAvatar(selectedUser)} alt={selectedUser.name} className="admin-clients-luxe-preview-avatar" />
                ) : (
                  <div className="admin-clients-luxe-preview-avatar admin-clients-luxe-avatar-fallback">
                    {getClientInitials(selectedUser.name)}
                  </div>
                )}

                <div className="admin-clients-luxe-preview-copy">
                  <strong>{selectedUser.email}</strong>
                  <span>{selectedUser.phone || "Phone not provided"}</span>
                  <span>{selectedUser.city || "City unavailable"}{selectedUser.country ? `, ${selectedUser.country}` : ""}</span>
                </div>
              </div>

              <div className="admin-clients-luxe-preview-stats">
                <article>
                  <span>Registered</span>
                  <strong>{formatAdminDate(selectedUser.created_at, { fallback: "Recently" })}</strong>
                </article>
                <article>
                  <span>Total reservations</span>
                  <strong>{reservationCountByUser[Number(selectedUser.id)] || 0}</strong>
                </article>
                <article>
                  <span>Loyalty score</span>
                  <strong>75%</strong>
                </article>
              </div>

              <div className="admin-clients-luxe-preview-actions">
                <button type="button" className="admin-clients-luxe-action is-primary" onClick={() => updateStatus(selectedUser.id, "active")}>
                  Activate
                </button>
                <button type="button" className="admin-clients-luxe-action" onClick={() => updateStatus(selectedUser.id, "inactive")}>
                  Disable
                </button>
                <button type="button" className="admin-clients-luxe-action is-danger" onClick={() => deleteClient(selectedUser.id)}>
                  Delete
                </button>
              </div>

              <div className="admin-clients-luxe-history">
                <div className="admin-clients-luxe-history-head">
                  <h4>Recent reservations</h4>
                  <span>Live snapshot</span>
                </div>

                <div className="admin-clients-luxe-history-list">
                  {selectedReservations.map((reservation) => (
                    <article key={reservation.id} className="admin-clients-luxe-history-item">
                      <div>
                        <strong>{reservation.car?.brand} {reservation.car?.model}</strong>
                        <span>{formatAdminDate(reservation.start_date, { fallback: "Pending date" })}</span>
                      </div>
                      <span className="admin-clients-luxe-history-status">{reservation.status || "pending"}</span>
                    </article>
                  ))}

                  {!selectedReservations.length ? (
                    <div className="admin-clients-luxe-history-item is-empty">No reservation history recorded for this client yet.</div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="admin-clients-luxe-empty">Select a client card to reveal the holographic preview.</div>
          )}
        </aside>
      </section>
    </div>
  );
}
