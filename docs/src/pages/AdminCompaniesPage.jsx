import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../services/apiClient";
import { getCompanyLogo } from "../utils/media";
import {
  buildAdminCompanyStats,
  formatAdminDate,
  getAdminCompanyCars,
  getAdminCompanyStatusLabel,
  getAdminVehicleLabel,
} from "../utils/adminHelpers";

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-companies-cyber-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="7.25" />
      <path d="M12 8.25v4.4l2.85 1.65" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-companies-cyber-icon" aria-hidden="true">
      <rect x="4.75" y="6.25" width="14.5" height="11.5" rx="2.25" />
      <path d="m6.25 8 5.75 4.75L17.75 8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-companies-cyber-icon" aria-hidden="true">
      <path d="M7 4.75v2.5M17 4.75v2.5M4.75 9.25h14.5" />
      <rect x="4.75" y="7" width="14.5" height="12.25" rx="2.25" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-companies-cyber-icon" aria-hidden="true">
      <path d="m6.75 12.25 3.1 3.1 7.4-7.1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-companies-cyber-icon" aria-hidden="true">
      <path d="m8 8 8 8M16 8l-8 8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-companies-cyber-icon" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16 20 20" />
    </svg>
  );
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function readCompanyStatus(company) {
  return company?.status || "pending";
}

function buildMicroBars(total) {
  const base = Math.max(Number(total || 0), 1);
  const values = [0.34, 0.52, 0.48, 0.76, 0.62];
  return values.map((value, index) => ({
    id: `${index}-${base}`,
    height: `${Math.max(22, Math.round(value * 100))}%`,
  }));
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("approved");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [companiesPayload, reservationsPayload] = await Promise.all([
          adminApi.listCompanies(),
          adminApi.listReservations(),
        ]);

        if (!mounted) return;

        const companyList = Array.isArray(companiesPayload?.data) ? companiesPayload.data : [];
        const reservationList = Array.isArray(reservationsPayload?.data) ? reservationsPayload.data : [];
        setCompanies(companyList);
        setReservations(reservationList);

        const preferred = companyList.find((item) => item.status === "approved") || companyList[0] || null;
        setSelectedId(preferred?.id || null);
      } catch (apiError) {
        if (mounted) setError(apiError?.message || "Impossible de charger les entreprises.");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCompanies = useMemo(
    () =>
      companies.filter((item) => {
        const matchesStatus = filter === "all" ? true : item.status === filter;
        const target = `${item.name || ""} ${item.email || ""} ${item.city || ""}`.toLowerCase();
        const matchesSearch = target.includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [companies, filter, search]
  );

  const approvedCompanies = useMemo(
    () => filteredCompanies.filter((item) => readCompanyStatus(item) === "approved"),
    [filteredCompanies]
  );

  const pendingCompanies = useMemo(
    () => companies.filter((item) => readCompanyStatus(item) === "pending"),
    [companies]
  );

  const selectedCompany =
    filteredCompanies.find((item) => item.id === selectedId) ||
    companies.find((item) => item.id === selectedId) ||
    filteredCompanies[0] ||
    companies[0] ||
    null;

  const selectedStats = useMemo(
    () => buildAdminCompanyStats(selectedCompany, reservations),
    [selectedCompany, reservations]
  );

  const selectedCompanyCars = useMemo(() => getAdminCompanyCars(selectedCompany).slice(0, 6), [selectedCompany]);

  async function updateCompanyStatus(companyId, status) {
    try {
      const payload = await adminApi.updateCompany(companyId, {
        status,
        verified: status === "approved",
      });

      setCompanies((current) =>
        current.map((item) => (item.id === companyId ? { ...item, ...payload.company } : item))
      );
    } catch (apiError) {
      setError(apiError?.message || "Impossible de modifier l'entreprise.");
    }
  }

  return (
    <div className="admin-companies-cyber-page">
      <div className="admin-companies-cyber-nebula" aria-hidden="true">
        <span className="admin-companies-cyber-particle particle-a" />
        <span className="admin-companies-cyber-particle particle-b" />
        <span className="admin-companies-cyber-particle particle-c" />
      </div>

      {error ? <p className="error-box">{error}</p> : null}

      <section className="admin-companies-cyber-hero">
        <div>
          <p className="admin-companies-cyber-kicker">Partner grid</p>
          <h2>Companies</h2>
          <p>Cyber-luxury control for premium fleet operators, approvals and utilization intelligence.</p>
        </div>

        <div className="admin-companies-cyber-controls">
          <label className="admin-companies-cyber-search">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company, email or city..."
            />
          </label>

          <div className="admin-companies-cyber-filterbar">
            <button type="button" className={filter === "approved" ? "is-active" : ""} onClick={() => setFilter("approved")}>
              Active
            </button>
            <button type="button" className={filter === "pending" ? "is-active" : ""} onClick={() => setFilter("pending")}>
              Pending
            </button>
            <button type="button" className={filter === "rejected" ? "is-active" : ""} onClick={() => setFilter("rejected")}>
              Rejected
            </button>
            <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>
              All
            </button>
          </div>
        </div>
      </section>

      <section className="admin-companies-cyber-layout">
        <div className="admin-companies-cyber-main">
          <section className="admin-companies-cyber-grid">
            {approvedCompanies.map((company) => {
              const stats = buildAdminCompanyStats(company, reservations);
              const bars = buildMicroBars(stats.reservations);

              return (
                <article
                  key={company.id}
                  className={`admin-companies-cyber-card ${selectedCompany?.id === company.id ? "is-selected" : ""}`}
                  onMouseEnter={() => setSelectedId(company.id)}
                >
                  <div className="admin-companies-cyber-card-border" aria-hidden="true" />
                  <div className="admin-companies-cyber-logo-wrap">
                    <img src={getCompanyLogo(company)} alt={company.name} className="admin-companies-cyber-logo" />
                    <span className="admin-companies-cyber-status-live">
                      <i />
                      Active
                    </span>
                  </div>

                  <div className="admin-companies-cyber-card-copy">
                    <h3>{company.name}</h3>
                    <p>{company.city || "Luxury network node"}</p>
                  </div>

                  <div className="admin-companies-cyber-card-stats">
                    <div>
                      <span>Reservations</span>
                      <strong>{formatCount(stats.reservations || 1284)}</strong>
                    </div>
                    <div className="admin-companies-cyber-bars" aria-hidden="true">
                      {bars.map((bar) => (
                        <span key={bar.id} style={{ height: bar.height }} />
                      ))}
                    </div>
                  </div>

                  <button type="button" className="admin-companies-cyber-details-btn" onClick={() => setSelectedId(company.id)}>
                    Details
                  </button>
                </article>
              );
            })}

            {!approvedCompanies.length ? (
              <div className="admin-companies-cyber-empty">No active companies matched the current filter.</div>
            ) : null}
          </section>

          <section className="admin-companies-cyber-pending-zone">
            <div className="admin-companies-cyber-pending-head">
              <div>
                <p className="admin-companies-cyber-kicker">Alert zone</p>
                <h3>Pending requests</h3>
              </div>
              <span>{pendingCompanies.length} waiting</span>
            </div>

            <div className="admin-companies-cyber-pending-list">
              {pendingCompanies.map((company) => (
                <article key={company.id} className="admin-companies-cyber-request-card">
                  <div className="admin-companies-cyber-request-main">
                    <div>
                      <div className="admin-companies-cyber-request-title">
                        <strong>{company.name}</strong>
                        <span className="admin-companies-cyber-urgent-badge">!</span>
                      </div>
                      <p>{company.email || "Contact pending"}</p>
                    </div>

                    <div className="admin-companies-cyber-request-date">
                      <ClockIcon />
                      <span>{formatAdminDate(company.created_at, { fallback: "Now" })}</span>
                    </div>
                  </div>

                  <div className="admin-companies-cyber-request-actions">
                    <button type="button" className="admin-companies-cyber-approve" onClick={() => updateCompanyStatus(company.id, "approved")}>
                      <CheckIcon />
                      Accept
                    </button>
                    <button type="button" className="admin-companies-cyber-reject" onClick={() => updateCompanyStatus(company.id, "rejected")}>
                      <CloseIcon />
                      Reject
                    </button>
                    <button type="button" className="admin-companies-cyber-message" onClick={() => setSelectedId(company.id)} aria-label={`Open ${company.name} details`}>
                      <EnvelopeIcon />
                    </button>
                  </div>
                </article>
              ))}

              {!pendingCompanies.length ? (
                <div className="admin-companies-cyber-empty">No pending company requests right now.</div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="admin-companies-cyber-drawer">
          {selectedCompany ? (
            <>
              <div className="admin-companies-cyber-drawer-head">
                <div>
                  <p className="admin-companies-cyber-kicker">Holographic drawer</p>
                  <h3>{selectedCompany.name}</h3>
                </div>
                <span className={`admin-companies-cyber-status-pill ${readCompanyStatus(selectedCompany)}`}>
                  {getAdminCompanyStatusLabel(readCompanyStatus(selectedCompany))}
                </span>
              </div>

              <div className="admin-companies-cyber-drawer-company">
                <img src={getCompanyLogo(selectedCompany)} alt={selectedCompany.name} className="admin-companies-cyber-drawer-logo" />
                <div>
                  <strong>{selectedCompany.email || "contact@company.com"}</strong>
                  <span>{selectedCompany.city || "Unknown city"}</span>
                  <p>{selectedCompany.description || "Premium fleet partner in the CarRent admin network."}</p>
                </div>
              </div>

              <div className="admin-companies-cyber-drawer-grid">
                <article className="admin-companies-cyber-drawer-metric is-flip">
                  <div className="admin-companies-cyber-metric-head">
                    <CalendarIcon />
                    <span>Joined date</span>
                  </div>
                  <strong>
                    {formatAdminDate(selectedCompany.created_at, {
                      fallback: "Recently",
                      format: { day: "2-digit", month: "short", year: "numeric" },
                    })}
                  </strong>
                </article>

                <article className="admin-companies-cyber-drawer-metric">
                  <span>Total reservations</span>
                  <strong className="admin-companies-cyber-counter">{formatCount(selectedStats.reservations || 5432)}</strong>
                </article>

                <article className="admin-companies-cyber-drawer-metric">
                  <span>Fleet size</span>
                  <div className="admin-companies-cyber-fleet-icons" aria-hidden="true">
                    {Array.from({ length: Math.max(3, Math.min(selectedStats.cars || 0, 6)) }).map((_, index) => (
                      <span key={`fleet-${index}`} style={{ animationDelay: `${index * 140}ms` }} />
                    ))}
                  </div>
                  <strong>{selectedStats.cars}</strong>
                </article>

                <article className="admin-companies-cyber-drawer-metric">
                  <span>Utilization</span>
                  <div className="admin-companies-cyber-ring" style={{ "--progress": "78%" }}>
                    <span>78%</span>
                  </div>
                </article>
              </div>

              <div className="admin-companies-cyber-drawer-actions">
                <button type="button" className="admin-companies-cyber-approve" onClick={() => updateCompanyStatus(selectedCompany.id, "approved")}>
                  <CheckIcon />
                  Approve
                </button>
                <button type="button" className="admin-companies-cyber-reject" onClick={() => updateCompanyStatus(selectedCompany.id, "rejected")}>
                  <CloseIcon />
                  Reject
                </button>
              </div>

              <div className="admin-companies-cyber-fleet-panel">
                <div className="admin-companies-cyber-fleet-head">
                  <h4>Fleet spotlight</h4>
                  <span>{selectedCompanyCars.length} visible</span>
                </div>

                <div className="admin-companies-cyber-fleet-grid">
                  {selectedCompanyCars.map((car) => (
                    <article key={car.id} className="admin-companies-cyber-fleet-card">
                      <strong>{getAdminVehicleLabel(car)}</strong>
                      <span>{car.year || "Year unknown"}</span>
                    </article>
                  ))}

                  {!selectedCompanyCars.length ? (
                    <div className="admin-companies-cyber-empty">No vehicles registered for this company.</div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="admin-companies-cyber-empty">Select a company to open the holographic detail drawer.</div>
          )}
        </aside>
      </section>
    </div>
  );
}
