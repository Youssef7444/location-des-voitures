import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatPricePerDay, getCarMainImage, getCompanyLogo } from "../utils/media";
import { loadArchivedCars, removeCarFromArchives } from "../utils/archives";
import backArrowIcon from "../assets/icon-fliche.png";

function formatSavedDate(rawDate) {
  if (!rawDate) {
    return "";
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ArchivesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || "guest";
  const [cars, setCars] = useState([]);

  useEffect(() => {
    setCars(loadArchivedCars(userId));
  }, [userId]);

  useEffect(() => {
    function handleStorageChange() {
      setCars(loadArchivedCars(userId));
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [userId]);

  const sortedCars = useMemo(
    () =>
      [...cars].sort((left, right) => {
        const a = new Date(left?.saved_at || 0).getTime();
        const b = new Date(right?.saved_at || 0).getTime();
        return b - a;
      }),
    [cars]
  );

  function handleRemove(carId) {
    const next = removeCarFromArchives(carId, userId);
    setCars(next);
  }

  return (
    <section className="section profile-page archives-page">
      <div className="content-wrap">
        <button className="booking-go-back" onClick={() => navigate("/profile")} type="button">
          <img src={backArrowIcon} alt="" className="booking-go-back-icon" />
          <span>Go Back</span>
        </button>

        <h1 className="profile-title">Archives</h1>

        {!sortedCars.length ? (
          <div className="profile-form-card">
            <p className="muted-dark">Aucune voiture archivee pour le moment.</p>
          </div>
        ) : (
          <div className="archives-grid">
            {sortedCars.map((car) => (
              <article key={car.id} className="archives-card">
                <Link to={`/cars/${car.id}`} state={{ from: "home" }}>
                  <img src={getCarMainImage(car)} alt={`${car.brand} ${car.model}`} />
                </Link>
                <div className="archives-card-body">
                  <h3>
                    {car.brand} {car.model}
                  </h3>
                  <p className="archives-price">
                    <strong>{formatPricePerDay(car.price_per_day)}$</strong>/day
                  </p>
                  <p className="muted-dark">Saved: {formatSavedDate(car.saved_at)}</p>

                  <div className="archives-company-row">
                    <span className="company-link">
                      <img src={getCompanyLogo(car.company)} alt={`${car?.company?.name || "Company"} logo`} />
                      <span>{car?.company?.name || "Unknown company"}</span>
                    </span>
                  </div>

                  <div className="archives-actions">
                    <Link className="book-button" to={`/booking/${car.id}`} state={{ from: "archives" }}>
                      Book Now
                    </Link>
                    <button type="button" className="archives-remove-btn" onClick={() => handleRemove(car.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
