import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userApi } from "../services/apiClient";
import { getCarMainImage } from "../utils/media";
import {
  downloadReservationContractDocument,
  openReservationContractDocument,
} from "../utils/reservationDocument";

function parseBookingMeta(rawValue) {
  if (!rawValue) return {};
  if (typeof rawValue === "object") return rawValue;

  try {
    return JSON.parse(rawValue);
  } catch {
    return {};
  }
}

function formatReservationDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReservationStatus(status) {
  if (status === "pending") return "Pending";
  if (status === "accepted" || status === "confirmed") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "cancelled") return "Cancelled";
  if (status === "completed") return "Completed";
  return status || "-";
}

function isApprovedReservation(status) {
  return status === "accepted" || status === "confirmed";
}

function formatPaymentMethodLabel(value) {
  if (value === "credit_card") return "Credit Card";
  if (value === "bank_transfer") return "Bank Transfer";
  if (value === "cash") return "Cash";
  return "Payment";
}

function createTransactionId(prefix = "PAY") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function resolvePaymentDeadline(approvalInfo = {}) {
  const directDeadline = approvalInfo?.payment_due_at;
  if (directDeadline) return directDeadline;

  const approvedAt = approvalInfo?.approved_at;
  if (!approvedAt) return null;

  const approvedDate = new Date(approvedAt);
  if (Number.isNaN(approvedDate.getTime())) return null;

  return new Date(approvedDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

function getReservationView(reservation) {
  const meta = parseBookingMeta(reservation?.special_requests);
  const approvalInfo = meta?.approval_info || {};
  const paymentDueAt = resolvePaymentDeadline(approvalInfo);

  return {
    ...reservation,
    approvalInfo,
    paymentDueAt,
    approvedAt: approvalInfo?.approved_at || null,
  };
}

function getTimeLeftLabel(value) {
  if (!value) return "";
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return "";

  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return "Payment window expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left to pay`;
}

function canCancelReservation(status) {
  return status === "pending" || isApprovedReservation(status);
}

function canDeleteReservation(status) {
  return status === "cancelled" || status === "rejected" || status === "completed";
}

function canPayReservation(reservation) {
  if (!reservation) return false;
  if (!isApprovedReservation(reservation.status)) return false;
  if (reservation.payment_status === "paid") return false;
  if (!reservation.paymentDueAt) return false;
  const paymentDeadline = new Date(reservation.paymentDueAt).getTime();
  return Number.isFinite(paymentDeadline) && paymentDeadline > Date.now();
}

function hasPaidReservation(reservation) {
  return reservation?.payment_status === "paid";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)}$`;
}

function maskCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return ".... .... .... 4242";
  const visible = digits.slice(-4).padStart(4, "0");
  return `.... .... .... ${visible}`;
}

function getPaymentMethodMeta(method) {
  if (method === "credit_card") {
    return {
      label: "Credit Card",
      icon: "CC",
      hint: "Instant confirmation with secure card processing.",
    };
  }

  if (method === "bank_transfer") {
    return {
      label: "Bank Transfer",
      icon: "IB",
      hint: "Share your transfer reference to validate the booking.",
    };
  }

  return {
    label: "Cash",
    icon: "$",
    hint: "Pay at pickup and keep the approved booking on file.",
  };
}

export default function ReservationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCancelId, setActiveCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [deletingReservationId, setDeletingReservationId] = useState(null);
  const [paymentReservationId, setPaymentReservationId] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "credit_card",
    cardHolder: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    transferReference: "",
    termsAccepted: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadReservations() {
      setLoading(true);
      setError("");

      try {
        const payload = await userApi.getReservations();
        const rawReservations = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        if (mounted) setReservations(rawReservations.map(getReservationView));
      } catch (apiError) {
        if (mounted) {
          setReservations([]);
          setError(apiError?.message || "Unable to load reservations.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!authLoading && isAuthenticated) {
      loadReservations();
    }

    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    let active = true;

    async function markNotificationsSeen() {
      if (!isAuthenticated) return;

      try {
        await userApi.markAllNotificationsAsRead();
        if (active) {
          window.dispatchEvent(new CustomEvent("app-notifications-updated"));
        }
      } catch {
        // Keep the page usable even if notification sync fails.
      }
    }

    if (!authLoading && isAuthenticated) {
      markNotificationsSeen();
    }

    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated]);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((left, right) => {
      const a = new Date(right?.created_at || right?.start_date || 0).getTime();
      const b = new Date(left?.created_at || left?.start_date || 0).getTime();
      return a - b;
    });
  }, [reservations]);

  const paymentTarget = useMemo(
    () => reservations.find((reservation) => reservation.id === paymentReservationId) || null,
    [paymentReservationId, reservations]
  );

  if (!authLoading && !isAuthenticated) {
    return <Navigate replace to="/auth?mode=signin&next=%2Freservations" />;
  }

  async function handleCancelReservation(reservationId) {
    const reason = cancelReason.trim();
    if (!reason) {
      setError("Please provide a cancellation reason.");
      return;
    }

    setSubmittingCancel(true);
    setError("");

    try {
      const payload = await userApi.cancelReservation(reservationId, { reason });
      const updatedReservation = payload?.reservation;

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === reservationId ? getReservationView({ ...reservation, ...updatedReservation }) : reservation
        )
      );
      setActiveCancelId(null);
      setCancelReason("");
    } catch (apiError) {
      if (apiError?.errors && typeof apiError.errors === "object") {
        const firstKey = Object.keys(apiError.errors)[0];
        const firstMessage = firstKey ? apiError.errors[firstKey]?.[0] : "";
        setError(firstMessage || "Unable to cancel reservation.");
      } else {
        setError(apiError?.message || "Unable to cancel reservation.");
      }
    } finally {
      setSubmittingCancel(false);
    }
  }

  async function handleDeleteReservation(reservationId) {
    setDeletingReservationId(reservationId);
    setError("");

    try {
      await userApi.deleteReservation(reservationId);
      setReservations((current) => current.filter((reservation) => reservation.id !== reservationId));
      if (activeCancelId === reservationId) {
        setActiveCancelId(null);
        setCancelReason("");
      }
    } catch (apiError) {
      setError(apiError?.message || "Unable to delete reservation permanently.");
    } finally {
      setDeletingReservationId(null);
    }
  }

  async function handlePayReservation() {
    if (!paymentTarget) return;

    if (!paymentForm.termsAccepted) {
      setError("Please accept the payment terms before completing the payment.");
      return;
    }

    if (paymentForm.paymentMethod === "credit_card") {
      if (
        !paymentForm.cardHolder.trim() ||
        paymentForm.cardNumber.replace(/\D/g, "").length < 12 ||
        !paymentForm.cardExpiry.trim() ||
        !paymentForm.cardCvc.trim()
      ) {
        setError("Please complete the credit card information.");
        return;
      }
    }

    if (paymentForm.paymentMethod === "bank_transfer" && !paymentForm.transferReference.trim()) {
      setError("Please provide the bank transfer reference.");
      return;
    }

    setSubmittingPayment(true);
    setError("");

    try {
      const payload = await userApi.createPayment({
        reservation_id: paymentTarget.id,
        amount: Number(paymentTarget.total_price || 0),
        payment_method: paymentForm.paymentMethod,
        transaction_id:
          paymentForm.paymentMethod === "bank_transfer"
            ? paymentForm.transferReference.trim()
            : createTransactionId(paymentForm.paymentMethod === "cash" ? "CASH" : "CARD"),
        status: "completed",
        paid_at: new Date().toISOString(),
      });

      const updatedReservation = payload?.reservation;

      if (updatedReservation) {
        setReservations((current) =>
          current.map((reservation) =>
            reservation.id === paymentTarget.id
              ? getReservationView({ ...reservation, ...updatedReservation })
              : reservation
          )
        );
      }

      setPaymentReservationId(null);
      setPaymentForm({
        paymentMethod: "credit_card",
        cardHolder: "",
        cardNumber: "",
        cardExpiry: "",
        cardCvc: "",
        transferReference: "",
        termsAccepted: false,
      });

      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: "Payment completed successfully.",
        })
      );
    } catch (apiError) {
      if (apiError?.errors && typeof apiError.errors === "object") {
        const firstKey = Object.keys(apiError.errors)[0];
        const firstMessage = firstKey ? apiError.errors[firstKey]?.[0] : "";
        setError(firstMessage || apiError?.message || "Unable to complete payment.");
      } else {
        setError(apiError?.message || "Unable to complete payment.");
      }
    } finally {
      setSubmittingPayment(false);
    }
  }

  return (
    <section className="section reservations-page">
      <div className="content-wrap">
        <div className="reservations-head">
          <h1 className="reservations-title">My Reservations</h1>
          <p className="reservations-subtitle">
            Book first, wait for company approval, then complete the payment within 24 hours to keep the reservation active.
          </p>
        </div>

        {paymentTarget ? (
          <div className="partner-booking-modal-backdrop">
            <div className="partner-booking-modal reservation-payment-modal">
              <div className="reservation-payment-shell">
                <aside className="reservation-payment-summary-card">
                  <p className="partner-booking-modal-kicker">Reservation Payment</p>
                  <h3>BK-{paymentTarget.id}</h3>
                  <p className="reservation-payment-summary-copy">
                    Your booking is approved. Complete the payment before the deadline to keep the car reserved.
                  </p>

                  <div className="reservation-payment-hero">
                    <img
                      src={getCarMainImage(paymentTarget.car)}
                      alt={`${paymentTarget?.car?.brand || ""} ${paymentTarget?.car?.model || ""}`.trim()}
                    />
                    <div>
                      <strong>{paymentTarget?.car?.brand} {paymentTarget?.car?.model}</strong>
                      <span>{paymentTarget?.car?.company?.name || "Rental partner"}</span>
                    </div>
                  </div>

                  <div className="reservation-payment-summary-grid">
                    <article>
                      <span>Total due</span>
                      <strong>{formatMoney(paymentTarget.total_price)}</strong>
                    </article>
                    <article>
                      <span>Deadline</span>
                      <strong>{formatDateTime(paymentTarget.paymentDueAt)}</strong>
                    </article>
                    <article>
                      <span>Status</span>
                      <strong>Approved and waiting for payment</strong>
                    </article>
                    <article>
                      <span>Time left</span>
                      <strong>{getTimeLeftLabel(paymentTarget.paymentDueAt)}</strong>
                    </article>
                  </div>

                  <div className="reservation-payment-trust">
                    <span>Encrypted checkout</span>
                    <span>Instant confirmation</span>
                    <span>Booking protected for 24h</span>
                  </div>
                </aside>

                <div className="reservation-payment-form-card">
                  <div className="reservation-payment-form-head">
                    <div>
                      <p className="reservation-payment-eyebrow">Choose payment method</p>
                      <h4>Finish your reservation</h4>
                    </div>
                    <div className="reservation-payment-mini-card" aria-hidden="true">
                      <span>{getPaymentMethodMeta(paymentForm.paymentMethod).icon}</span>
                      <strong>{maskCardNumber(paymentForm.cardNumber)}</strong>
                    </div>
                  </div>

                  <div className="reservation-payment-method-grid">
                    {["credit_card", "bank_transfer", "cash"].map((method) => {
                      const meta = getPaymentMethodMeta(method);
                      const isActive = paymentForm.paymentMethod === method;

                      return (
                        <label
                          key={method}
                          className={`reservation-payment-method-card${isActive ? " is-active" : ""}`}
                        >
                          <input
                            type="radio"
                            name="reservationPaymentMethod"
                            value={method}
                            checked={isActive}
                            onChange={(event) =>
                              setPaymentForm((prev) => ({ ...prev, paymentMethod: event.target.value }))
                            }
                          />
                          <span className="reservation-payment-method-icon">{meta.icon}</span>
                          <strong>{meta.label}</strong>
                          <small>{meta.hint}</small>
                        </label>
                      );
                    })}
                  </div>

                  {paymentForm.paymentMethod === "credit_card" ? (
                    <div className="booking-card-fields booking-grid-2 reservation-payment-fields">
                      <label>
                        Cardholder Name
                        <input
                          type="text"
                          placeholder="Name as written on card"
                          value={paymentForm.cardHolder}
                          onChange={(event) =>
                            setPaymentForm((prev) => ({ ...prev, cardHolder: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Card Number
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="4242 4242 4242 4242"
                          value={paymentForm.cardNumber}
                          onChange={(event) =>
                            setPaymentForm((prev) => ({ ...prev, cardNumber: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Expiry
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={paymentForm.cardExpiry}
                          onChange={(event) =>
                            setPaymentForm((prev) => ({ ...prev, cardExpiry: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        CVC
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="123"
                          value={paymentForm.cardCvc}
                          onChange={(event) =>
                            setPaymentForm((prev) => ({ ...prev, cardCvc: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                  ) : null}

                  {paymentForm.paymentMethod === "bank_transfer" ? (
                    <div className="booking-grid-2 booking-card-fields reservation-payment-fields">
                      <label className="span-2">
                        Transfer Reference
                        <input
                          type="text"
                          placeholder="Example: BK-1452-SEPA"
                          value={paymentForm.transferReference}
                          onChange={(event) =>
                            setPaymentForm((prev) => ({ ...prev, transferReference: event.target.value }))
                          }
                        />
                      </label>
                      <p className="reservation-payment-note-box span-2">
                        Use your booking number in the transfer memo so the company can match the payment quickly.
                      </p>
                    </div>
                  ) : null}

                  {paymentForm.paymentMethod === "cash" ? (
                    <div className="reservation-payment-note-box">
                      Cash payment will be recorded for this approved booking and finalized with the rental partner at pickup.
                    </div>
                  ) : null}

                  <label className="booking-terms-check reservation-payment-terms">
                    <input
                      type="checkbox"
                      checked={paymentForm.termsAccepted}
                      onChange={(event) =>
                        setPaymentForm((prev) => ({ ...prev, termsAccepted: event.target.checked }))
                      }
                    />
                    <span>I confirm this payment finalizes my approved reservation and booking details.</span>
                  </label>

                  <div className="partner-booking-modal-actions reservation-payment-actions">
                    <button
                      type="button"
                      className="partner-ghost-btn"
                      onClick={() => setPaymentReservationId(null)}
                      disabled={submittingPayment}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="partner-primary-btn reservation-payment-submit"
                      onClick={handlePayReservation}
                      disabled={submittingPayment}
                    >
                      {submittingPayment ? "Processing..." : `Pay ${formatMoney(paymentTarget.total_price)}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? <p className="muted-dark">Loading reservations...</p> : null}
        {!loading && error ? <p className="error-box">{error}</p> : null}

        {!loading ? (
          <div className="reservations-list">
            {sortedReservations.map((reservation) => {
              const isCancelOpen = activeCancelId === reservation.id;

              return (
                <article key={reservation.id} className="reservation-card">
                  <img
                    className="reservation-card-image"
                    src={getCarMainImage(reservation.car)}
                    alt={`${reservation?.car?.brand || ""} ${reservation?.car?.model || ""}`.trim()}
                  />

                  <div className="reservation-card-body">
                    <div className="reservation-card-top">
                      <div className="reservation-card-headline">
                        <p className="reservation-card-kicker">Reservation #{reservation.id}</p>
                        <h2>
                          {reservation?.car?.brand} {reservation?.car?.model}
                        </h2>
                        <p className="reservation-card-company">
                          Provided by {reservation?.car?.company?.name || "Company"}
                        </p>
                      </div>
                      <div className="reservation-card-status">
                        {Number(reservation?.unread_messages_count || 0) > 0 ? (
                          <span className="profile-booking-unread-dot" aria-label="Unread updates" />
                        ) : null}
                        <span className={`partner-status ${reservation?.status || ""}`}>
                          {formatReservationStatus(reservation?.status)}
                        </span>
                      </div>
                    </div>

                    <div className="reservation-card-grid">
                      <article>
                        <span>Pickup</span>
                        <strong>{formatReservationDate(reservation?.start_date)}</strong>
                      </article>
                      <article>
                        <span>Return</span>
                        <strong>{formatReservationDate(reservation?.end_date)}</strong>
                      </article>
                      <article>
                        <span>Duration</span>
                        <strong>{reservation?.total_days ? `${reservation.total_days} jours` : "-"}</strong>
                      </article>
                      <article>
                        <span>Total</span>
                        <strong>${reservation?.total_price ?? "-"}</strong>
                      </article>
                    </div>

                    {isApprovedReservation(reservation?.status) ? (
                      <div className="reservation-payment-state">
                        <strong>
                          {reservation?.payment_status === "paid"
                            ? "Payment completed"
                            : "Payment required after approval"}
                        </strong>
                        <p>
                          {reservation?.payment_status === "paid"
                            ? `Paid on ${formatDateTime(reservation?.payments?.[0]?.paid_at || reservation?.updated_at)}`
                            : reservation?.paymentDueAt
                              ? `${getTimeLeftLabel(reservation.paymentDueAt)}. If payment is not completed before ${formatDateTime(reservation.paymentDueAt)}, the reservation will be cancelled automatically.`
                              : "Waiting for payment window information."}
                        </p>
                      </div>
                    ) : null}

                    {reservation?.cancellation_reason ? (
                      <div className="reservation-cancel-note">
                        <strong>Cancellation reason</strong>
                        <p>{reservation.cancellation_reason}</p>
                      </div>
                    ) : null}

                    {isCancelOpen ? (
                      <div className="reservation-cancel-panel">
                        <label>
                          Cancellation reason
                          <textarea
                            value={cancelReason}
                            onChange={(event) => setCancelReason(event.target.value)}
                            rows={4}
                            placeholder="Explain why you want to cancel this reservation..."
                          />
                        </label>
                        <div className="reservation-cancel-actions">
                          <button
                            type="button"
                            className="partner-ghost-btn"
                            onClick={() => {
                              setActiveCancelId(null);
                              setCancelReason("");
                            }}
                          >
                            Keep Reservation
                          </button>
                          <button
                            type="button"
                            className="archives-remove-btn"
                            disabled={submittingCancel}
                            onClick={() => handleCancelReservation(reservation.id)}
                          >
                            {submittingCancel ? "Cancelling..." : "Confirm Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="reservation-card-actions">
                      <Link to={`/reservations/${reservation.id}/messages`} className="partner-primary-btn">
                        Messages
                      </Link>
                      {hasPaidReservation(reservation) ? (
                        <button
                          type="button"
                          className="partner-ghost-btn"
                          onClick={() => openReservationContractDocument({ reservation })}
                        >
                          View PDF
                        </button>
                      ) : null}
                      {hasPaidReservation(reservation) ? (
                        <button
                          type="button"
                          className="partner-ghost-btn"
                          onClick={() => downloadReservationContractDocument({ reservation })}
                        >
                          Download PDF
                        </button>
                      ) : null}
                      {canPayReservation(reservation) ? (
                        <button
                          type="button"
                          className="partner-primary-btn"
                          onClick={() => {
                            setPaymentReservationId(reservation.id);
                            setError("");
                          }}
                        >
                          Pay Now
                        </button>
                      ) : null}
                      {canCancelReservation(reservation?.status) ? (
                        <button
                          type="button"
                          className="partner-ghost-btn"
                          onClick={() => {
                            setActiveCancelId(reservation.id);
                            setCancelReason("");
                            setError("");
                          }}
                        >
                          Cancel Reservation
                        </button>
                      ) : null}
                      {canDeleteReservation(reservation?.status) ? (
                        <button
                          type="button"
                          className="archives-remove-btn"
                          disabled={deletingReservationId === reservation.id}
                          onClick={() => handleDeleteReservation(reservation.id)}
                        >
                          {deletingReservationId === reservation.id ? "Deleting..." : "Delete Permanently"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}

            {!sortedReservations.length ? (
              <div className="profile-bookings-empty">
                Your reservations will appear here after you book a vehicle.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
