import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { publicApi } from "../services/apiClient";
import { formatPricePerDay, getCarMainImage } from "../utils/media";
import fuelIcon from "../assets/icon-fuel.png";
import seatsIcon from "../assets/icon-seats.webp";
import transmissionIcon from "../assets/icon-transmission.webp";
import visaLogo from "../assets/visa.webp";
import masterCardLogo from "../assets/mastercard.webp";
import backArrowIcon from "../assets/icon-fliche.png";

function normalizeFuelLabel(value) {
  const raw = String(value || "").toLowerCase();
  if (raw === "gasoline") return "Petrol";
  if (raw === "diesel") return "Diesel";
  if (raw === "electric") return "Electric";
  if (raw === "hybrid") return "Hybrid";
  return value || "-";
}

function toDate(date, time) {
  if (!date || !time) return null;
  return new Date(`${date}T${time}`);
}

function computeDurationDays(startDate, startTime, endDate, endTime) {
  const start = toDate(startDate, startTime);
  const end = toDate(endDate, endTime);

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();
  if (diff <= 0) return 1;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function BookingPage() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    license: "",
    pickupLocation: "",
    returnLocation: "",
    pickupDate: "",
    pickupTime: "",
    returnDate: "",
    returnTime: "",
    insuranceBasic: true,
    insurancePremium: false,
    additionalDriver: false,
    paymentMethod: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
  });

  useEffect(() => {
    async function loadCar() {
      setLoading(true);
      setError("");

      try {
        const payload = await publicApi.getCar(carId);
        setCar(payload);

        setForm((prev) => ({
          ...prev,
          fullName: user?.name || prev.fullName,
          email: user?.email || prev.email,
          phone: user?.phone || prev.phone,
          pickupLocation: payload?.company?.city || prev.pickupLocation,
          returnLocation: payload?.company?.city || prev.returnLocation,
        }));
      } catch (apiError) {
        setError(apiError.message || "Unable to load booking data.");
        setCar(null);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && isAuthenticated) {
      loadCar();
    }
  }, [authLoading, isAuthenticated, carId, user?.name, user?.email, user?.phone]);

  const durationDays = useMemo(
    () => computeDurationDays(form.pickupDate, form.pickupTime, form.returnDate, form.returnTime),
    [form.pickupDate, form.pickupTime, form.returnDate, form.returnTime]
  );

  const pricing = useMemo(() => {
    const dayPrice = Number(car?.price_per_day || 0);
    const base = Number.isFinite(dayPrice) ? dayPrice * Math.max(0, durationDays) : 0;
    const premium = form.insurancePremium ? durationDays * 25 : 0;
    const additional = form.additionalDriver ? durationDays * 10 : 0;
    const taxes = base * 0.15;
    const total = base + premium + additional + taxes;

    return { dayPrice, base, premium, additional, taxes, total };
  }, [car?.price_per_day, durationDays, form.insurancePremium, form.additionalDriver]);

  if (!authLoading && !isAuthenticated) {
    const mode = localStorage.getItem("known_customer_email") ? "signin" : "register";
    return <Navigate replace to={`/auth?mode=${mode}&next=${encodeURIComponent(`/booking/${carId}`)}`} />;
  }

  function handleSubmit(event) {
    event.preventDefault();
    window.alert("Reservation form ready. Next step: connect POST /api/reservations and /api/payments.");
  }

  function handleGoBack() {
    const from = location.state?.from;

    if (from === "carDetails") {
      navigate(`/cars/${carId}`);
      return;
    }

    navigate("/");
  }

  return (
    <section className="section booking-page">
      <div className="content-wrap">
        <button className="booking-go-back" onClick={handleGoBack} type="button">
          <img src={backArrowIcon} alt="" className="booking-go-back-icon" />
          <span>Go Back</span>
        </button>
        {loading ? <p className="muted">Loading booking page...</p> : null}
        {error ? <p className="error-box">{error}</p> : null}

        {car ? (
          <div className="booking-layout">
            <div className="booking-form-card">
              <div className="booking-card-header">Your Details & Preferences</div>

              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="booking-section">
                  <h3>Personal Information</h3>
                  <div className="booking-grid-2">
                    <label>
                      Full Name
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Email Address
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Phone Number
                      <input
                        type="text"
                        placeholder="+1 (555) 123-4567"
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      />
                    </label>
                    <label>
                      Driver's License Number
                      <input
                        type="text"
                        value={form.license}
                        onChange={(event) => setForm((prev) => ({ ...prev, license: event.target.value }))}
                      />
                    </label>
                  </div>
                </div>

                <div className="booking-section">
                  <h3>Rental Dates & Locations</h3>
                  <div className="booking-grid-2">
                    <label>
                      Pickup Location
                      <input
                        type="text"
                        value={form.pickupLocation}
                        onChange={(event) => setForm((prev) => ({ ...prev, pickupLocation: event.target.value }))}
                      />
                    </label>
                    <label>
                      Return Location
                      <input
                        type="text"
                        value={form.returnLocation}
                        onChange={(event) => setForm((prev) => ({ ...prev, returnLocation: event.target.value }))}
                      />
                    </label>
                    <label>
                      Pickup Date
                      <input
                        type="date"
                        value={form.pickupDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, pickupDate: event.target.value }))}
                      />
                    </label>
                    <label>
                      Pickup Time
                      <input
                        type="time"
                        value={form.pickupTime}
                        onChange={(event) => setForm((prev) => ({ ...prev, pickupTime: event.target.value }))}
                      />
                    </label>
                    <label>
                      Return Date
                      <input
                        type="date"
                        value={form.returnDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, returnDate: event.target.value }))}
                      />
                    </label>
                    <label>
                      Return Time
                      <input
                        type="time"
                        value={form.returnTime}
                        onChange={(event) => setForm((prev) => ({ ...prev, returnTime: event.target.value }))}
                      />
                    </label>
                  </div>
                  <p className="booking-duration">Rental Duration: {durationDays > 0 ? `${durationDays} Days` : "-"}</p>
                </div>

                <div className="booking-section">
                  <h3>Insurance & Extras</h3>
                  <div className="booking-options-grid">
                    <label className="booking-option-card">
                      <div className="booking-option-top">
                        <input
                          type="checkbox"
                          checked={form.insuranceBasic}
                          onChange={(event) => setForm((prev) => ({ ...prev, insuranceBasic: event.target.checked }))}
                        />
                        <strong>Basic Coverage</strong>
                        <span>Included</span>
                      </div>
                      <small>Liability & collision waiver</small>
                    </label>

                    <label className="booking-option-card">
                      <div className="booking-option-top">
                        <input
                          type="checkbox"
                          checked={form.insurancePremium}
                          onChange={(event) => setForm((prev) => ({ ...prev, insurancePremium: event.target.checked }))}
                        />
                        <strong>Premium Coverage</strong>
                        <span>$25/day</span>
                      </div>
                      <small>Comprehensive protection with zero deductible</small>
                    </label>

                    <label className="booking-option-card">
                      <div className="booking-option-top">
                        <input
                          type="checkbox"
                          checked={form.additionalDriver}
                          onChange={(event) => setForm((prev) => ({ ...prev, additionalDriver: event.target.checked }))}
                        />
                        <strong>Additional Driver</strong>
                        <span>$10/day</span>
                      </div>
                      <small>Add one additional authorized driver</small>
                    </label>
                  </div>
                </div>

                <div className="booking-section">
                  <h3>Payment Method</h3>
                  <div className="booking-payment-inline">
                    <label className="booking-payment-inline-item">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={form.paymentMethod === "card"}
                        onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                      />
                      Credit/Debit Card
                      <img src={visaLogo} alt="Visa" className="payment-logo" />
                      <img src={masterCardLogo} alt="MasterCard" className="payment-logo" />
                    </label>
                    <label className="booking-payment-inline-item">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={form.paymentMethod === "paypal"}
                        onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                      />
                      PayPal
                    </label>
                  </div>

                  <div className="booking-grid-3 booking-card-fields booking-grid-payment">
                    <label>
                      Card Number
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={form.cardNumber}
                        onChange={(event) => setForm((prev) => ({ ...prev, cardNumber: event.target.value }))}
                      />
                    </label>
                    <label>
                      Expiry (MM/YY)
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={form.cardExpiry}
                        onChange={(event) => setForm((prev) => ({ ...prev, cardExpiry: event.target.value }))}
                      />
                    </label>
                    <label>
                      CVV
                      <input
                        type="text"
                        placeholder="CVV"
                        value={form.cardCvv}
                        onChange={(event) => setForm((prev) => ({ ...prev, cardCvv: event.target.value }))}
                      />
                    </label>
                  </div>
                </div>

                <button className="booking-submit" type="submit">
                  Continue to Payment
                </button>
              </form>
            </div>

            <aside className="booking-summary">
              <div className="booking-card-header">Booking Summary</div>
              <div className="booking-summary-body">
                <img alt={`${car.brand} ${car.model}`} src={getCarMainImage(car)} />
                <h3>
                  {car.year} {car.brand} {car.model}
                </h3>

                <div className="booking-mini-specs">
                  <span>
                    <img src={fuelIcon} alt="" />
                    {normalizeFuelLabel(car.fuel_type)}
                  </span>
                  <span>
                    <img src={transmissionIcon} alt="" />
                    {car.transmission || "-"}
                  </span>
                  <span>
                    <img src={seatsIcon} alt="" />
                    {car.seats || "-"} Seats
                  </span>
                </div>

                <div className="booking-divider" />

                <h4>Rental Details</h4>
                <p>
                  <strong>Pickup:</strong> {form.pickupLocation || "-"} - {form.pickupDate || "-"} {form.pickupTime || ""}
                </p>
                <p>
                  <strong>Return:</strong> {form.returnLocation || "-"} - {form.returnDate || "-"} {form.returnTime || ""}
                </p>
                <p>
                  <strong>Duration:</strong> {durationDays > 0 ? `${durationDays} Days` : "-"}
                </p>

                <div className="booking-divider" />

                <h4>Price Breakdown</h4>
                <p>
                  <span>Vehicle Rental ({durationDays} days):</span>
                  <strong>{pricing.base.toFixed(2)}$</strong>
                </p>
                <p>
                  <span>Basic Insurance:</span>
                  <strong>Included</strong>
                </p>
                <p>
                  <span>Premium Coverage:</span>
                  <strong>{pricing.premium.toFixed(2)}$</strong>
                </p>
                <p>
                  <span>Additional Driver:</span>
                  <strong>{pricing.additional.toFixed(2)}$</strong>
                </p>
                <p>
                  <span>Taxes & Fees:</span>
                  <strong>{pricing.taxes.toFixed(2)}$</strong>
                </p>

                <div className="booking-total">
                  <span>Total Cost</span>
                  <strong>{pricing.total.toFixed(2)}$</strong>
                </div>
                <small>Pay at pickup available</small>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  );
}
