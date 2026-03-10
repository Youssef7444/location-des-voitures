import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { publicApi } from "../services/apiClient";
import { formatPricePerDay, getCarMainImage } from "../utils/media";
import seatsIcon from "../assets/icon-seats.webp";
import passengersIcon from "../assets/icon-passengers.webp";
import fuelIcon from "../assets/icon-fuel.png";
import bluetoothIcon from "../assets/icon-bluetooth.webp";
import airConditioningIcon from "../assets/icon-AireConditioning.webp";
import cameraIcon from "../assets/icon-camera.webp";
import discountIcon from "../assets/icon-discount.webp";
import mileageIcon from "../assets/icon-mileage.webp";
import transmissionIcon from "../assets/icon-transmission.webp";
import locationIcon from "../assets/address.png";
import backArrowIcon from "../assets/icon-fliche.png";

const AUTO_DESCRIPTION_PATTERN =
  /Voiture ajout[eé]e automatiquement pour affichage frontend\.?/gi;

function normalizeFeatures(rawFeatures) {
  if (Array.isArray(rawFeatures)) {
    return rawFeatures;
  }

  if (typeof rawFeatures === "string") {
    try {
      const parsed = JSON.parse(rawFeatures);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function sanitizeDescription(text) {
  if (!text) {
    return "";
  }

  return String(text).replace(AUTO_DESCRIPTION_PATTERN, "").trim();
}

function formatMileage(value) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "-";
  }

  return `${new Intl.NumberFormat("fr-FR").format(amount)} km`;
}

function getFeatureIcon(feature) {
  const raw = String(feature || "").toLowerCase();

  if (raw.includes("bluetooth")) {
    return bluetoothIcon;
  }

  if (raw.includes("air conditioning") || raw.includes("clim") || raw.includes("ac")) {
    return airConditioningIcon;
  }

  if (raw.includes("passenger")) {
    return passengersIcon;
  }

  if (raw.includes("seat")) {
    return seatsIcon;
  }

  if (raw.includes("camera") || raw.includes("cam") || raw.includes("caméra")) {
    return cameraIcon;
  }

  if (raw.includes("gps") || raw.includes("navigation") || raw.includes("location")) {
    return locationIcon;
  }

  return null;
}

function SpecCard({ icon, label, value }) {
  return (
    <div>
      <span className="spec-label-row">
        {icon ? (
          <span className="spec-icon-wrap">
            <img src={icon} alt="" className="spec-icon" />
          </span>
        ) : null}
        <span>{label}</span>
      </span>
      <span className="spec-top">{value}</span>
    </div>
  );
}

export default function CarDetailsPage() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [car, setCar] = useState(null);
  const [similarCars, setSimilarCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const payload = await publicApi.getCar(carId);
        setCar(payload);

        const companyId = payload?.company_id || payload?.company?.id;
        const categoryId = payload?.category_id || payload?.category?.id;
        const similarPayload = await publicApi.searchCars({
          company_id: companyId || undefined,
          category_id: categoryId || undefined,
          per_page: 8,
        });

        const allSimilar = Array.isArray(similarPayload?.data) ? similarPayload.data : [];
        const filtered = allSimilar.filter((candidate) => Number(candidate.id) !== Number(carId)).slice(0, 3);
        setSimilarCars(filtered);
      } catch (apiError) {
        setError(apiError.message || "Unable to load car details.");
        setCar(null);
        setSimilarCars([]);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [carId]);

  const features = useMemo(() => normalizeFeatures(car?.features), [car?.features]);
  const cleanedDescription = useMemo(() => sanitizeDescription(car?.description), [car?.description]);

  function handleBookNow() {
    if (isAuthenticated) {
      navigate(`/booking/${car.id}`, { state: { from: "carDetails", fromCarId: car.id } });
      return;
    }

    const mode = localStorage.getItem("known_customer_email") ? "signin" : "register";
    navigate(`/auth?mode=${mode}&next=${encodeURIComponent(`/booking/${car.id}`)}`, {
      state: { from: "carDetails", fromCarId: car.id },
    });
  }

  function handleGoBack() {
    const from = location.state?.from;
    const fromCompanyId = location.state?.companyId || car?.company_id || car?.company?.id;

    if (from === "company" && fromCompanyId) {
      navigate(`/companies/${fromCompanyId}`);
      return;
    }

    navigate("/");
  }

  return (
    <section className="section car-details-page">
      <div className="content-wrap">
        <button className="booking-go-back" onClick={handleGoBack} type="button">
          <img src={backArrowIcon} alt="" className="booking-go-back-icon" />
          <span>Go Back</span>
        </button>
        {loading ? <p className="muted-dark">Loading details...</p> : null}
        {error ? <p className="error-box">{error}</p> : null}

        {car ? (
          <div className="car-details-grid">
            <article className="car-media-panel">
              <img src={getCarMainImage(car)} alt={`${car.brand} ${car.model}`} />
              <p>
                {car.brand} {car.model} - {car.category?.name || "Vehicle"}
              </p>
              <p className="car-media-description">
                {cleanedDescription || "No additional description provided for this vehicle."}
              </p>
            </article>

            <article className="car-info-panel">
              <h1>
                {car.brand} {car.model}
              </h1>
              {car?.company?.id ? (
                <p className="car-company-link-row">
                  Company:{" "}
                  <Link
                    to={`/companies/${car.company.id}`}
                    state={{ from: "carDetails", fromCarId: car.id }}
                  >
                    {car.company.name || "View company"}
                  </Link>
                </p>
              ) : null}

              <div className="price-line">
                <strong>{formatPricePerDay(car.price_per_day)}$</strong>
                <span>/ day</span>
              </div>

              <div className="detail-spec-grid">
                <SpecCard icon={passengersIcon} label="Passengers" value={car.seats || "-"} />
                <SpecCard icon={seatsIcon} label="Seats" value={`${car.seats || "-"} Seats`} />
                <SpecCard icon={fuelIcon} label="Fuel" value={car.fuel_type || "-"} />
                <SpecCard icon={airConditioningIcon} label="Air Conditioning" value="Available" />
                <SpecCard icon={transmissionIcon} label="Transmission" value={car.transmission || "-"} />
                <SpecCard icon={discountIcon} label="Discount" value={`${car.discount_percent ?? 0}%`} />
                <SpecCard  label="License Plate" value={car.license_plate || "-"} />
                <SpecCard icon={mileageIcon} label="Mileage" value={formatMileage(car.mileage)} />
              </div>

              <div className="divider" />

              <h3>Features</h3>
              <div className="feature-list">
                {features.length ? (
                  features.map((feature) => (
                    <span key={feature}>
                      {getFeatureIcon(feature) ? <img src={getFeatureIcon(feature)} alt="" className="feature-icon" /> : null}
                      {feature}
                    </span>
                  ))
                ) : (
                  <span>GPS Navigation</span>
                )}
              </div>

              <div className="divider" />
              <p className="description-text">
                {cleanedDescription || "No additional description provided for this vehicle."}
              </p>

              <button className="detail-book-btn" onClick={handleBookNow} type="button">
                Book Now
              </button>
              <p className="small-note">Free cancellation up to 24 hours before pick-up.</p>
            </article>

            <aside className="similar-cars-panel">
              <h3>Similar Cars</h3>

              {similarCars.length ? (
                <div className="similar-list">
                  {similarCars.map((similarCar) => (
                    <article key={similarCar.id} className="similar-card">
                      <img src={getCarMainImage(similarCar)} alt={`${similarCar.brand} ${similarCar.model}`} />
                      <h4>
                        {similarCar.brand} {similarCar.model}
                      </h4>
                      <Link to={`/cars/${similarCar.id}`}>View Details</Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted-dark">finding cars...</p>
              )}
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  );
}
