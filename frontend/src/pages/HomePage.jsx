import { useEffect, useMemo, useRef, useState } from "react";
import CarCard from "../components/CarCard";
import { publicApi } from "../services/apiClient";
import whyMainIcon from "../assets/why-security.png";
import whyPremiumIcon from "../assets/why-premium.png";
import whyPricingIcon from "../assets/why-pricing.png";
import whySupportIcon from "../assets/why-support.png";
import locationIcon from "../assets/address.png";
import calendarIcon from "../assets/icon-calendar.png";
import searchIcon from "../assets/icon-search.png";


const COMPANY_ID_FILTER = Number(import.meta.env.VITE_COMPANY_ID || 0);
const ONLY_CARS_WITH_IMAGES =
  (import.meta.env.VITE_ONLY_CARS_WITH_IMAGES || "false").toLowerCase() === "true";

const whyItems = [
  {
    icon: whyPremiumIcon,
    title: "Premium Selection",
    description:
      "A carefully curated fleet that ensures a refined and reliable driving experience.",
  },
  {
    icon: whyPricingIcon,
    title: "Transparent Pricing",
    description:
      "Clear, upfront pricing with no hidden fees offering complete peace of mind.",
  },
  {
    icon: whySupportIcon,
    title: "24/7 Support",
    description:
      "Round-the-clock assistance to keep your journey smooth and uninterrupted.",
  },
];

function formatDateTimeLabel(rawValue, placeholderLabel) {
  if (!rawValue) {
    return placeholderLabel;
  }

  const parsed = new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function SearchGlyph({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.5 16.5" />
    </svg>
  );
}

export default function HomePage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchForm, setSearchForm] = useState({
    pickupLocation: "",
    pickupDateTime: "",
    
    carName: "",
  });
  const [activeField, setActiveField] = useState("");
  const pickupDateInputRef = useRef(null);
  const returnDateInputRef = useRef(null);

  function openDatePicker(inputRef) {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus();

    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  }

  async function loadCars(searchQuery = "") {
    setLoading(true);
    setError("");

    try {
      const params = {
        per_page: 24,
      };

      if (searchQuery) {
        params.query = searchQuery;
      }

      if (COMPANY_ID_FILTER > 0) {
        params.company_id = COMPANY_ID_FILTER;
      }

      const payload = await publicApi.searchCars(params);
      let nextCars = Array.isArray(payload?.data) ? payload.data : [];

      if (COMPANY_ID_FILTER > 0) {
        nextCars = nextCars.filter(
          (car) =>
            Number(car.company_id) === COMPANY_ID_FILTER ||
            Number(car?.company?.id) === COMPANY_ID_FILTER
        );
      }

      if (ONLY_CARS_WITH_IMAGES) {
        nextCars = nextCars.filter(
          (car) => Array.isArray(car.images) && car.images.length > 0
        );
      }

      setCars(nextCars);
    } catch (apiError) {
      setError(apiError.message || "Unable to load cars.");
      setCars([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const query = searchForm.carName.trim();

    const timer = setTimeout(() => {
      loadCars(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchForm.carName]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    loadCars(searchForm.carName.trim());
  }

  const featuredCars = useMemo(() => cars.slice(0, 6), [cars]);

  return (
    <>
      <section className="hero" id="fleet">
        <div className="content-wrap">
          <form className="hero-search" onSubmit={handleSearchSubmit}>
            <label className={`hero-search-item ${activeField === "pickupLocation" ? "is-active" : ""}`}>
              <img src={locationIcon} alt="" className="hero-search-icon" />
              <input
                type="text"
                placeholder="Pickup Location"
                value={searchForm.pickupLocation}
                onFocus={() => setActiveField("pickupLocation")}
                onBlur={() => setActiveField("")}
                onChange={(event) =>
                  setSearchForm((prev) => ({ ...prev, pickupLocation: event.target.value }))
                }
              />
            </label>

            <label
              className={`hero-search-item hero-search-item-date ${activeField === "pickupDateTime" ? "is-active" : ""}`}
              onClick={() => openDatePicker(pickupDateInputRef)}
            >
              <img src={calendarIcon} alt="" className="hero-search-icon" />
              <span className={`hero-date-label ${searchForm.pickupDateTime ? "has-value" : ""}`}>
                {formatDateTimeLabel(searchForm.pickupDateTime, "Pickup Date & Time")}
              </span>
              <input
                ref={pickupDateInputRef}
                className="hero-date-input"
                type="datetime-local"
                value={searchForm.pickupDateTime}
                onFocus={() => setActiveField("pickupDateTime")}
                onBlur={() => setActiveField("")}
                onChange={(event) =>
                  setSearchForm((prev) => ({ ...prev, pickupDateTime: event.target.value }))
                }
              />
            </label>

            <label
              className={`hero-search-item hero-search-item-date ${activeField === "returnDateTime" ? "is-active" : ""}`}
              onClick={() => openDatePicker(returnDateInputRef)}
            >
              <img src={calendarIcon} alt="" className="hero-search-icon" />
              <span className={`hero-date-label ${searchForm.returnDateTime ? "has-value" : ""}`}>
                {formatDateTimeLabel(searchForm.returnDateTime, "Return Date & Time")}
              </span>
              <input
                ref={returnDateInputRef}
                className="hero-date-input"
                type="datetime-local"
                value={searchForm.returnDateTime}
                onFocus={() => setActiveField("returnDateTime")}
                onBlur={() => setActiveField("")}
                onChange={(event) =>
                  setSearchForm((prev) => ({ ...prev, returnDateTime: event.target.value }))
                }
              />
            </label>

            <label className={`hero-search-item ${activeField === "carName" ? "is-active" : ""}`}>
              <img src={searchIcon} alt="" className="hero-search-icon" />
              <input
                type="text"
                placeholder="Car Name "
                value={searchForm.carName}
                onFocus={() => setActiveField("carName")}
                onBlur={() => setActiveField("")}
                onChange={(event) =>
                  setSearchForm((prev) => ({ ...prev, carName: event.target.value }))
                }
              />
            </label>

            <button className="hero-search-btn" type="submit" disabled={loading}>
              <SearchGlyph className="hero-search-icon-search" />
              {loading ? "SEARCHING..." : "SEARCH FOR CARS"}
            </button>
          </form>
        </div>
      </section>

      <section className="section featured" id="about">
        <div className="content-wrap">
          <h2>Featured Vehicles</h2>
          

          {loading ? <p className="muted">Loading cars...</p> : null}
          {error ? <p className="error-box">{error}</p> : null}
          {!loading && !cars.length ? (
            <p className="muted">No vehicles found.</p>
          ) : null}

          {featuredCars.length ? (
            <div className="cards-grid">
              {featuredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section" id="contact">
        <div className="content-wrap">
          <div className="why-box">
            <div>
              <img className="why-main-icon" src={whyMainIcon} alt="Security icon" />
            </div>

            <div>
              <h2>Why Choose SPEEDRENT</h2>

              <div className="why-grid">
                {whyItems.map((item) => (
                  <article className="why-item" key={item.title}>
                    <h3>
                      <img src={item.icon} alt="" />
                      {item.title}
                    </h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
