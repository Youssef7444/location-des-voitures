import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatPricePerDay, getCarMainImage, getCompanyLogo } from "../utils/media";
import { addCarToArchives, isCarArchived } from "../utils/archives";
import saveIcon from "../assets/icon-save.webp";

export default function CarCard({ car }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const company = car?.company;
  const companyId = company?.id;
  const archiveOwner = user?.id || "guest";
  const detailsFrom = location.pathname.startsWith("/companies/") ? "company" : "home";
  const [saved, setSaved] = useState(false);

  const detailsState = {
    from: detailsFrom,
    companyId: companyId || undefined,
  };

  useEffect(() => {
    setSaved(isCarArchived(car?.id, archiveOwner));
  }, [archiveOwner, car?.id]);

  const saveButtonLabel = useMemo(
    () => (saved ? "Saved in archives" : "Save to archives"),
    [saved]
  );

  function handleBookNow() {
    if (isAuthenticated) {
      navigate(`/booking/${car.id}`, { state: { from: "home" } });
      return;
    }

    const mode = localStorage.getItem("known_customer_email") ? "signin" : "register";
    navigate(`/auth?mode=${mode}&next=${encodeURIComponent(`/booking/${car.id}`)}`, {
      state: { from: "home" },
    });
  }

  function handleSaveCar() {
    const result = addCarToArchives(car, archiveOwner);
    setSaved(true);

    const message = result.added
      ? "Une voiture a ete ajoutee a l'archives."
      : "Cette voiture existe deja dans l'archives.";
    window.dispatchEvent(new CustomEvent("app-toast", { detail: message }));
  }

  return (
    <article className="car-card">
      <h3 className="car-card-title">
        <Link to={`/cars/${car.id}`} state={detailsState}>
          {car.brand} {car.model}
        </Link>
      </h3>

      <Link to={`/cars/${car.id}`} state={detailsState}>
        <img
          className="car-card-image"
          src={getCarMainImage(car)}
          alt={`${car.brand} ${car.model}`}
          loading="lazy"
        />
      </Link>

      <div className="car-card-bottom">
        <p className="car-price">
          From <strong>{formatPricePerDay(car.price_per_day)}$</strong>/day
        </p>

        <div className="card-company-row">
          {companyId ? (
            <Link className="company-link" to={`/companies/${companyId}`} state={{ from: "home" }}>
              <img src={getCompanyLogo(company)} alt={`${company.name} logo`} />
              <span>{company.name}</span>
            </Link>
          ) : (
            <span className="company-link">
              <img src={getCompanyLogo(null)} alt="Default company logo" />
              <span>Unknown company</span>
            </span>
          )}

          <button className="book-button" onClick={handleBookNow} type="button">
            Book Now
          </button>

          <button
            aria-label={saveButtonLabel}
            className={`save-car-btn ${saved ? "saved" : ""}`}
            onClick={handleSaveCar}
            title={saveButtonLabel}
            type="button"
          >
            <img src={saveIcon} alt="" />
          </button>
        </div>
      </div>
    </article>
  );
}
