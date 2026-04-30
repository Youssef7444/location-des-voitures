import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "../services/apiClient";
import { getCompanyLogo } from "../utils/media";
import rentCarLogo from "../assets/company-rentcar.webp";
import motoRacingLogo from "../assets/company-motoracing.webp";
import cityIcon from "../assets/address.png";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function truncate(value, max = 70) {
  const text = String(value || "").trim();
  if (!text) return "Trusted rental company.";
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function SearchGlyph() {
  return (
    <svg className="companies-search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.5 16.5" />
    </svg>
  );
}

function normalizeCompaniesResponse(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function sortByNameAsc(items) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), undefined, {
      sensitivity: "base",
      numeric: true,
    })
  );
}

function resolveCompanyLogo(company) {
  const name = normalizeText(company?.name);

  if (name === "veum inc") {
    return rentCarLogo;
  }

  if (name === "balistreri ltd") {
    return motoRacingLogo;
  }

  return getCompanyLogo(company);
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCompanies() {
      setLoading(true);
      setError("");

      try {
        let page = 1;
        let keepLoading = true;
        const collected = [];

        while (keepLoading) {
          const payload = await publicApi.listCompanies({ page, per_page: 100 });
          const chunk = normalizeCompaniesResponse(payload);
          collected.push(...chunk);

          if (!payload?.next_page_url) {
            keepLoading = false;
          } else {
            page += 1;
          }
        }

        const uniqueCompanies = Array.from(
          new Map(collected.map((company) => [Number(company.id), company])).values()
        );

        const withCars = uniqueCompanies.filter(
          (company) => Array.isArray(company?.cars) && company.cars.length > 0
        );

        setCompanies(withCars);
      } catch (apiError) {
        setError(apiError.message || "Unable to load companies.");
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, []);

  const visibleCompanies = useMemo(() => {
    const query = normalizeText(search);
    const byName = sortByNameAsc(companies);

    return byName.filter((company) => {
      const content = normalizeText(
        `${company.name || ""} ${company.city || ""} ${company.address || ""} ${company.description || ""}`
      );
      return !query || content.includes(query);
    });
  }, [companies, search]);

  return (
    <section className="section companies-hub-page">
      <div className="content-wrap">
        <div className="companies-hub-shell">
          <div className="companies-hub-topbar">
            <div className="companies-hub-brand">
              <span className="companies-hub-brand-mark">SPEEDRENT</span>
            </div>

            <label className="companies-hub-search">
              <input
                type="text"
                placeholder="Search company"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <SearchGlyph />
            </label>
          </div>

          <div className="companies-hub-panel">
            <h1>Our Partners & Companies</h1>
            <p>All companies are ordered by name.</p>

            {loading ? <p className="muted">Loading companies...</p> : null}
            {error ? <p className="error-box">{error}</p> : null}

            {!loading && !error ? (
              <div className="companies-hub-grid">
                {visibleCompanies.length ? (
                  visibleCompanies.map((company, index) => (
                    <article key={company.id} className={`companies-hub-card tone-${index % 6}`}>
                      <div className="companies-hub-card-logo">
                        <img src={resolveCompanyLogo(company)} alt={`${company.name} logo`} />
                      </div>

                      <div className="companies-hub-card-body">
                        <h3>{company.name || "Unknown company"}</h3>
                        <p>{truncate(company.description)}</p>
                        <small className="companies-location-row">
                          <img src={cityIcon} alt="" className="companies-location-icon" />
                          <span>
                            Location: {company.city || "Unknown city"}
                            {company.address ? `, ${company.address}` : ""}
                          </span>
                        </small>
                        <Link to={`/companies/${company.id}`} state={{ from: "companiesList" }}>
                          View Details
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="muted">No companies match your search.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
