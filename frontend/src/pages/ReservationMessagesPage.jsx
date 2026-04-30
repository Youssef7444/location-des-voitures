import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCarMainImage } from "../utils/media";
import { userApi } from "../services/apiClient";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  if (status === "pending") return "Waiting for reply";
  if (status === "accepted") return "Accepted";
  if (status === "confirmed") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "cancelled") return "Cancelled";
  if (status === "completed") return "Completed";
  return status || "-";
}

export default function ReservationMessagesPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [thread, setThread] = useState({ reservation: null, messages: [] });
  const [draft, setDraft] = useState("");
  const messagesRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadThread() {
      setLoading(true);
      setError("");

      try {
        const payload = await userApi.getReservationMessages(reservationId);
        if (!mounted) return;
        setThread({
          reservation: payload?.reservation || null,
          messages: Array.isArray(payload?.messages) ? payload.messages : [],
        });
        window.dispatchEvent(new CustomEvent("app-notifications-updated"));
      } catch (apiError) {
        if (mounted) setError(apiError?.message || "Unable to load conversation.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!authLoading && isAuthenticated) {
      loadThread();
    }

    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthenticated, reservationId]);

  const reservation = thread.reservation;
  const isCompanyUser = user?.role === "company";
  const vehicleLabel = `${reservation?.car?.brand || ""} ${reservation?.car?.model || ""}`.trim();

  const timeline = useMemo(() => thread.messages || [], [thread.messages]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [timeline.length]);

  if (!authLoading && !isAuthenticated) {
    return <Navigate replace to={`/auth?mode=signin&next=${encodeURIComponent(`/reservations/${reservationId}/messages`)}`} />;
  }

  async function handleSend(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;

    setSending(true);
    setError("");

    try {
      const payload = await userApi.sendReservationMessage(reservationId, { message });
      setThread((current) => ({
        ...current,
        messages: [...current.messages, payload?.reservation_message].filter(Boolean),
      }));
      setDraft("");
    } catch (apiError) {
      setError(apiError?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="section reservation-thread-page light-page">
      <div className="content-wrap">
        <div className="reservation-thread-shell">
          <div className="reservation-thread-topbar">
            <div>
              <p className="reservation-thread-kicker">Reservation Conversation</p>
              <h1>Booking #{reservationId}</h1>
            </div>
            <div className="reservation-thread-top-actions">
              <button type="button" className="partner-ghost-btn reservation-thread-btn" onClick={() => navigate(-1)}>
                Back
              </button>
              <Link to="/" className="partner-primary-btn reservation-home-link reservation-thread-btn">
                Home
              </Link>
            </div>
          </div>

          {loading ? <p className="muted-dark">Loading conversation...</p> : null}
          {!loading && error ? <p className="error-box">{error}</p> : null}

          {!loading && reservation ? (
            <div className="reservation-thread-layout">
              <aside className="reservation-thread-sidebar">
                <div className="reservation-summary-card">
                  <img src={getCarMainImage(reservation?.car)} alt={vehicleLabel || "Vehicle"} />
                  <div>
                    <strong>{vehicleLabel || "Vehicle"}</strong>
                    <p>{reservation?.car?.company?.name || "Company"}</p>
                  </div>
                </div>

                <div className="reservation-thread-meta">
                  <article>
                    <span>Status</span>
                    <strong className={`partner-status ${reservation?.status || ""}`}>{formatStatus(reservation?.status)}</strong>
                  </article>
                  <article>
                    <span>Pickup</span>
                    <strong>{formatDateTime(reservation?.start_date)}</strong>
                  </article>
                  <article>
                    <span>Return</span>
                    <strong>{formatDateTime(reservation?.end_date)}</strong>
                  </article>
                  <article>
                    <span>Duration</span>
                    <strong>{reservation?.total_days ? `${reservation.total_days} days` : "-"}</strong>
                  </article>
                  <article>
                    <span>Total</span>
                    <strong>${reservation?.total_price ?? "-"}</strong>
                  </article>
                </div>

                {reservation?.status === "pending" ? (
                  <div className="reservation-waiting-card">
                    <strong>Waiting for company reply</strong>
                    <p>Your booking has been saved successfully. We are waiting for a response from the company customer service.</p>
                  </div>
                ) : null}
              </aside>

              <div className="reservation-thread-main">
                <div className="reservation-thread-header">
                  <h2>{isCompanyUser ? "Client Conversation" : "Company Conversation"}</h2>
                  <p>
                    {isCompanyUser
                      ? "Reply to the client and keep the booking process clear."
                      : "Ask questions, share requests and receive company replies here."}
                  </p>
                </div>

                <div className="reservation-thread-messages" ref={messagesRef}>
                  {timeline.map((message) => {
                    const senderRole = String(message?.sender_role || "system").toLowerCase();
                    const isMine =
                      (isCompanyUser && senderRole === "company") ||
                      (!isCompanyUser && senderRole === "client");

                    return (
                      <article
                        key={message.id}
                        className={`reservation-message-bubble ${isMine ? "mine" : ""} ${senderRole === "system" ? "system" : ""}`}
                      >
                        <div className="reservation-message-head">
                          <strong>
                            {senderRole === "system"
                              ? "System"
                              : senderRole === "company"
                                ? reservation?.car?.company?.name || "Company"
                                : message?.sender?.name || "Client"}
                          </strong>
                          <span>{formatDateTime(message?.created_at)}</span>
                        </div>
                        <p>{message?.message || ""}</p>
                      </article>
                    );
                  })}
                  {timeline.length === 0 ? (
                    <div className="reservation-thread-empty">
                      No messages yet. Start the conversation to keep the booking moving.
                    </div>
                  ) : null}
                </div>

                <form className="reservation-thread-form" onSubmit={handleSend}>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={isCompanyUser ? "Write a reply to the client..." : "Write a message to the company..."}
                    rows={4}
                  />
                  <div className="reservation-thread-form-actions">
                    <button type="submit" className="partner-primary-btn reservation-thread-btn reservation-thread-send-btn" disabled={sending}>
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
