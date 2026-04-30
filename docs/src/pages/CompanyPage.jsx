import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { publicApi } from "../services/apiClient";
import { formatPricePerDay, getCarMainImage, getCompanyLogo } from "../utils/media";
import { addCarToArchives, isCarArchived } from "../utils/archives";
import locationIcon from "../assets/address.png";
import calendarIcon from "../assets/icon-calendar.png";
import passengersIcon from "../assets/icon-passengers.webp";
import transmissionIcon from "../assets/icon-transmission.webp";
import fuelIcon from "../assets/icon-fuel.png";
import saveIcon from "../assets/icon-save.webp";
import sedanTypeIcon from "../assets/carSedan.png";
import suvTypeIcon from "../assets/carSuv.webp";
import truckTypeIcon from "../assets/carTruck.webp";
import luxuryTypeIcon from "../assets/carLuxury.webp";
import convertibleTypeIcon from "../assets/carConvertible.webp";
import vanTypeIcon from "../assets/carVan.webp";
import backArrowIcon from "../assets/icon-fliche.png";

const CAR_TYPES = [
  { key: "sedan", label: "Sedan", icon: sedanTypeIcon },
  { key: "suv", label: "SUV", icon: suvTypeIcon },
  { key: "truck", label: "Truck", icon: truckTypeIcon },
  { key: "luxury", label: "Luxury", icon: luxuryTypeIcon },
  { key: "convertible", label: "Convertible", icon: convertibleTypeIcon },
  { key: "van", label: "Van", icon: vanTypeIcon },
];

const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric"];

const CITY_COORDINATES = {
  tunis: [36.8065, 10.1815],
  sfax: [34.7406, 10.7603],
  sousse: [35.8256, 10.636],
  casablanca: [33.5731, -7.5898],
  rabat: [34.0209, -6.8416],
  paris: [48.8566, 2.3522],
  lyon: [45.764, 4.8357],
  marseille: [43.2965, 5.3698],
  "new york": [40.7128, -74.006],
  chicago: [41.8781, -87.6298],
  miami: [25.7617, -80.1918],
  seattle: [47.6062, -122.3321],
  "los angeles": [34.0522, -118.2437],
  "san francisco": [37.7749, -122.4194],
};

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeFuelLabel(value) {
  const raw = normalizeText(value);
  if (raw === "gasoline" || raw === "essence") return "petrol";
  return raw;
}

function resolveCarType(car) {
  const directType = normalizeText(car?.type_car);
  if (CAR_TYPES.some((entry) => entry.key === directType)) {
    return directType;
  }

  const rawCategory = normalizeText(car?.category?.name || car?.category || "");
  const nameText = normalizeText(`${car?.brand || ""} ${car?.model || ""}`);
  const merged = `${rawCategory} ${nameText}`;

  if (merged.includes("suv")) return "suv";
  if (merged.includes("truck")) return "truck";
  if (merged.includes("lux")) return "luxury";
  if (merged.includes("convert")) return "convertible";
  if (merged.includes("van")) return "van";
  return "sedan";
}

function getCoordinates(company) {
  const lat = Number(company?.latitude);
  const lon = Number(company?.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0) {
    return [lat, lon];
  }

  const cityCoords = CITY_COORDINATES[normalizeText(company?.city)];
  if (cityCoords) return cityCoords;

  return CITY_COORDINATES.tunis;
}

function getMapEmbedUrl(lat, lon) {
  const delta = 0.2;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function formatDateLabel(rawDate, placeholderLabel) {
  if (!rawDate) {
    return placeholderLabel;
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatCarValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "-";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

function getAvailabilityLabel(car) {
  if (!car?.available) {
    return "Not available";
  }

  const reservations = Array.isArray(car?.reservations) ? car.reservations : [];
  const now = new Date();
  const nextReservation = reservations
    .map((reservation) => new Date(reservation?.start_date))
    .filter((dateValue) => !Number.isNaN(dateValue.getTime()) && dateValue >= now)
    .sort((left, right) => left - right)[0];

  if (!nextReservation) {
    return "Available now";
  }

  const daysLeft = Math.ceil((nextReservation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysLeft <= 1 ? "Available 1 day" : `Available ${daysLeft} days`;
}

function SearchGlyph({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.5 16.5" />
    </svg>
  );
}

export default function CompanyPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const pickupDateInputRef = useRef(null);
  const returnDateInputRef = useRef(null);

  const [company, setCompany] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedCarIds, setSavedCarIds] = useState([]);
  const [filters, setFilters] = useState({
    query: "",
    pickupDate: "",
    returnDate: "",
    maxPrice: 250,
    transmission: "",
    carType: "",
    fuelType: "",
  });
  const [activeField, setActiveField] = useState("");
  const archiveOwner = user?.id || "guest";

  useEffect(() => {
    async function loadCompanyPage() {
      setLoading(true);
      setError("");

      try {
        const companyPayload = await publicApi.getCompany(companyId);
        setCompany(companyPayload);

        const companyCars = Array.isArray(companyPayload?.cars) ? companyPayload.cars : [];
        if (companyCars.length) {
          setCars(companyCars);
        } else {
          const searchPayload = await publicApi.searchCars({ company_id: companyId, per_page: 60 });
          setCars(Array.isArray(searchPayload?.data) ? searchPayload.data : []);
        }
      } catch (apiError) {
        setError(apiError.message || "Unable to load company.");
        setCompany(null);
        setCars([]);
      } finally {
        setLoading(false);
      }
    }

    loadCompanyPage();
  }, [companyId]);

  useEffect(() => {
    const nextSaved = cars
      .filter((car) => isCarArchived(car?.id, archiveOwner))
      .map((car) => Number(car.id));
    setSavedCarIds(nextSaved);
  }, [cars, archiveOwner]);

  const maxDetectedPrice = useMemo(() => Math.max(250, ...cars.map((car) => toNumber(car.price_per_day))), [cars]);

  const visibleCars = useMemo(() => {
    return cars.filter((car) => {
      const carSearch = normalizeText(`${car.brand || ""} ${car.model || ""} ${car.license_plate || ""}`);
      const carType = resolveCarType(car);
      const fuelType = normalizeFuelLabel(car.fuel_type);
      const transmission = normalizeText(car.transmission);
      const price = toNumber(car.price_per_day);

      const queryMatch = !filters.query || carSearch.includes(normalizeText(filters.query));
      const carTypeMatch = !filters.carType || filters.carType === carType;
      const fuelMatch = !filters.fuelType || normalizeText(filters.fuelType) === fuelType;
      const transmissionMatch = !filters.transmission || transmission === normalizeText(filters.transmission);
      const priceMatch = price <= toNumber(filters.maxPrice);

      return queryMatch && carTypeMatch && fuelMatch && transmissionMatch && priceMatch;
    });
  }, [cars, filters.carType, filters.fuelType, filters.maxPrice, filters.query, filters.transmission]);

  const [latitude, longitude] = getCoordinates(company);
  const mapEmbedUrl = getMapEmbedUrl(latitude, longitude);

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

  function handleBookNow(car) {
    if (isAuthenticated) {
      navigate(`/booking/${car.id}`, { state: { from: "company", companyId: company?.id || Number(companyId) } });
      return;
    }

    const mode = localStorage.getItem("known_customer_email") ? "signin" : "register";
    navigate(`/auth?mode=${mode}&next=${encodeURIComponent(`/booking/${car.id}`)}`, {
      state: { from: "company", companyId: company?.id || Number(companyId) },
    });
  }

  function handleGoBack() {
    const from = location.state?.from;
    const fromCarId = location.state?.fromCarId;

    if (from === "carDetails" && fromCarId) {
      navigate(`/cars/${fromCarId}`, {
        state: { from: "company", companyId: Number(companyId) },
      });
      return;
    }

    if (from === "companiesList") {
      navigate("/companies");
      return;
    }

    navigate("/");
  }

  function handleSaveCar(car) {
    const result = addCarToArchives(car, archiveOwner);
    setSavedCarIds((prev) => {
      const id = Number(car.id);
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });

    const message = result.added
      ? "Une voiture a ete ajoutee a l'archives."
      : "Cette voiture existe deja dans l'archives.";
    window.dispatchEvent(new CustomEvent("app-toast", { detail: message }));
  }

  return (
    <section className="section company-home-theme">
      <div className="content-wrap company-page-shell">
        <button className="booking-go-back" onClick={handleGoBack} type="button">
          <img src={backArrowIcon} alt="" className="booking-go-back-icon" />
          <span>Go Back</span>
        </button>
        {loading ? <p className="muted-dark">Loading company...</p> : null}
        {error ? <p className="error-box">{error}</p> : null}

        {company ? (
          <>
            <div className="company-top-grid">
              <div className="company-hero-head">
                <img src={getCompanyLogo(company)} alt={`${company.name} logo`} className="company-hero-logo" />
                <div>
                  <h2>{company.name}</h2>
                  <p>
                    <strong>Description:</strong>{" "}
                    {String(company.description || "").trim() || "No description available in database."}
                  </p>
                  <p className="company-hero-address">
                    <img src={locationIcon} alt="" />
                    {company.address || "Address not provided"}, {company.city || "City not provided"}
                  </p>
                  <p>
                    <strong>Email:</strong> {company.email || "Not provided"}
                  </p>
                </div>
              </div>

              <aside className="company-top-map">
                <h3>Location Zone</h3>
                <iframe
                  title="Company location map"
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </aside>
            </div>

            <form className="company-searchbar" onSubmit={(event) => event.preventDefault()}>
              <label className="company-search-item">
                <SearchGlyph className="company-inline-search-icon" />
                <input
                  type="text"
                  placeholder="Search by filter"
                  value={filters.query}
                  onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                />
              </label>

              <label
                className={`company-search-item company-search-item-date ${activeField === "pickupDate" ? "is-active" : ""}`}
                onClick={() => openDatePicker(pickupDateInputRef)}
              >
                <img src={calendarIcon} alt="" />
                <span className={`hero-date-label ${filters.pickupDate ? "has-value" : ""}`}>
                  {formatDateLabel(filters.pickupDate, "Pickup Date")}
                </span>
                <input
                  ref={pickupDateInputRef}
                  className="company-date-input"
                  type="date"
                  value={filters.pickupDate}
                  onFocus={() => setActiveField("pickupDate")}
                  onBlur={() => setActiveField("")}
                  onChange={(event) => setFilters((prev) => ({ ...prev, pickupDate: event.target.value }))}
                />
              </label>

              <label
                className={`company-search-item company-search-item-date ${activeField === "returnDate" ? "is-active" : ""}`}
                onClick={() => openDatePicker(returnDateInputRef)}
              >
                <img src={calendarIcon} alt="" />
                <span className={`hero-date-label ${filters.returnDate ? "has-value" : ""}`}>
                  {formatDateLabel(filters.returnDate, "Return Date")}
                </span>
                <input
                  ref={returnDateInputRef}
                  className="company-date-input"
                  type="date"
                  value={filters.returnDate}
                  onFocus={() => setActiveField("returnDate")}
                  onBlur={() => setActiveField("")}
                  onChange={(event) => setFilters((prev) => ({ ...prev, returnDate: event.target.value }))}
                />
              </label>

              <button className="company-search-button" type="submit">
                <SearchGlyph className="hero-search-icon-search" />
              </button>
            </form>

            <div className="company-grid-layout">
              <aside className="company-filters">
                <h3>FILTER RESULTS</h3>

                <div className="company-filter-block">
                  <h4>Car Type</h4>
                  <label className="company-checkbox-line">
                    <input
                      type="radio"
                      name="company-car-type"
                      checked={!filters.carType}
                      onChange={() => setFilters((prev) => ({ ...prev, carType: "" }))}
                    />
                    <span>All</span>
                  </label>
                  {CAR_TYPES.map((type) => (
                    <label key={type.key} className="company-checkbox-line">
                      <input
                        type="radio"
                        name="company-car-type"
                        checked={filters.carType === type.key}
                        onChange={() => setFilters((prev) => ({ ...prev, carType: type.key }))}
                      />
                      <img src={type.icon} alt="" className="company-type-icon" />
                      <span>{type.label}</span>
                    </label>
                  ))}
                </div>

                <div className="company-filter-block">
                  <h4>Price Range</h4>
                  <input
                    type="range"
                    min="30"
                    max={maxDetectedPrice}
                    value={filters.maxPrice}
                    onChange={(event) => setFilters((prev) => ({ ...prev, maxPrice: Number(event.target.value) }))}
                  />
                  <div className="company-filter-price-row">
                    <span>$30</span>
                    <span>${Math.round(filters.maxPrice)}</span>
                  </div>
                </div>

                <div className="company-filter-block">
                  <h4>Transmission</h4>
                  <label className="company-checkbox-line">
                    <input
                      type="radio"
                      name="company-transmission"
                      checked={filters.transmission === "automatic"}
                      onChange={() => setFilters((prev) => ({ ...prev, transmission: "automatic" }))}
                    />
                    Automatic
                  </label>
                  <label className="company-checkbox-line">
                    <input
                      type="radio"
                      name="company-transmission"
                      checked={filters.transmission === "manual"}
                      onChange={() => setFilters((prev) => ({ ...prev, transmission: "manual" }))}
                    />
                    Manual
                  </label>
                  <label className="company-checkbox-line">
                    <input
                      type="radio"
                      name="company-transmission"
                      checked={!filters.transmission}
                      onChange={() => setFilters((prev) => ({ ...prev, transmission: "" }))}
                    />
                    All
                  </label>
                </div>

                <div className="company-filter-block">
                  <h4>Fuel Type</h4>
                  <label className="company-checkbox-line">
                    <input
                      type="radio"
                      name="company-fuel-type"
                      checked={!filters.fuelType}
                      onChange={() => setFilters((prev) => ({ ...prev, fuelType: "" }))}
                    />
                    All
                  </label>
                  {FUEL_TYPES.map((fuel) => (
                    <label key={fuel} className="company-checkbox-line">
                      <input
                        type="radio"
                        name="company-fuel-type"
                        checked={filters.fuelType === fuel}
                        onChange={() => setFilters((prev) => ({ ...prev, fuelType: fuel }))}
                      />
                      {fuel[0].toUpperCase() + fuel.slice(1)}
                    </label>
                  ))}
                </div>

                <button className="company-apply-btn" type="button">
                  Apply Filters
                </button>
              </aside>

              <div className="company-cars-area">
                {visibleCars.length ? (
                  <div className="company-catalog-grid">
                    {visibleCars.map((car) => (
                      <article key={car.id} className="company-vehicle-card">
                        <Link to={`/cars/${car.id}`} state={{ from: "company", companyId: company.id }}>
                          <img src={getCarMainImage(car)} alt={`${car.brand} ${car.model}`} />
                        </Link>

                        <div className="company-vehicle-body">
                          <h3>
                            <Link to={`/cars/${car.id}`} state={{ from: "company", companyId: company.id }}>
                              {car.brand} {car.model}
                            </Link>
                            <div className="company-vehicle-meta-right">
                              <span>{resolveCarType(car).toUpperCase()}</span>
                              <small className={car.available ? "availability-ok" : "availability-off"}>
                                {getAvailabilityLabel(car)}
                              </small>
                            </div>
                          </h3>

                          <ul className="company-vehicle-specs">
                            <li>
                              <img src={passengersIcon} alt="" />
                              {car.seats || "-"} Passengers
                            </li>
                            <li>
                              <img src={transmissionIcon} alt="" />
                              {formatCarValue(car.transmission)}
                            </li>
                            <li>
                              <img src={fuelIcon} alt="" />
                              {formatCarValue(car.fuel_type)}
                            </li>
                          </ul>

                          <div className="company-vehicle-price-row">
                            <p>
                              <strong>${formatPricePerDay(car.price_per_day)}</strong> / day
                            </p>
                            <div className="company-card-actions">
                              <button type="button" onClick={() => handleBookNow(car)}>
                                Book Now
                              </button>
                              <button
                                type="button"
                                className={`save-car-btn ${savedCarIds.includes(Number(car.id)) ? "saved" : ""}`}
                                onClick={() => handleSaveCar(car)}
                                aria-label="Save to archives"
                                title="Save to archives"
                              >
                                <img src={saveIcon} alt="" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="muted-dark">No cars matching selected filters.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
