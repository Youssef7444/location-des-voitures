import { useEffect, useMemo, useState } from "react";
import PartnerPortalShell from "../components/PartnerPortalShell";
import { companyApi } from "../services/apiClient";

function asList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReservations() {
      setLoading(true);
      setError("");

      try {
        const response = await companyApi.getReservations();
        if (mounted) {
          setBookings(asList(response));
        }
      } catch (apiError) {
        if (mounted) setError(apiError?.message || "Unable to load bookings.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReservations();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const statusOk = !status || booking?.status === status;
      const searchTarget =
        `${booking?.id || ""} ${booking?.user?.name || ""} ${booking?.car?.brand || ""} ${booking?.car?.model || ""}`.toLowerCase();
      const searchOk = !search || searchTarget.includes(search.toLowerCase());
      return statusOk && searchOk;
    });
  }, [bookings, search, status]);

  return (
    <PartnerPortalShell
      title="Bookings Management"
      actions={
        <>
          <button className="partner-primary-btn" type="button">
            Approve All
          </button>
          <button className="partner-ghost-btn" type="button">
            Reject All
          </button>
        </>
      }
    >
      <div className="partner-filters-row">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All Status</option>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="cancelled">cancelled</option>
          <option value="completed">completed</option>
        </select>
        <input type="text" value="" placeholder="Date range" readOnly />
        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? <p className="muted-dark">Loading bookings...</p> : null}
      {!loading && error ? <p className="error-box">{error}</p> : null}

      {!loading && !error ? (
        <div className="partner-table-wrap">
          <table className="partner-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Pick-up</th>
                <th>Return</th>
                <th>Duration</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking?.user?.name || "-"}</td>
                  <td>{formatDate(booking?.start_date)}</td>
                  <td>{formatDate(booking?.end_date)}</td>
                  <td>{booking?.total_days ? `${booking.total_days} days` : "-"}</td>
                  <td>${booking?.total_price ?? "-"}</td>
                  <td>
                    <span className={`partner-status ${booking?.status || ""}`}>
                      {booking?.status || "-"}
                    </span>
                  </td>
                  <td>
                    <div className="partner-table-actions">
                      <button type="button">Accept</button>
                      <button type="button">Reject</button>
                      <button type="button">View</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8}>No bookings found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </PartnerPortalShell>
  );
}

