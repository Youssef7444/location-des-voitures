import { useEffect, useMemo, useState } from "react";
import PartnerPortalShell from "../components/PartnerPortalShell";
import { companyApi } from "../services/apiClient";
import {
  downloadReservationContractDocument,
  openReservationContractDocument,
} from "../utils/reservationDocument";

function asList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function parseBookingMeta(rawValue) {
  if (!rawValue) return {};
  if (typeof rawValue === "object") return rawValue;

  try {
    return JSON.parse(rawValue);
  } catch {
    return {};
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status) {
  if (status === "accepted") return "Accepted";
  if (status === "confirmed") return "Approved";
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  if (status === "cancelled") return "Cancelled";
  if (status === "completed") return "Completed";
  return status || "-";
}

function buildPolyline(points, width = 520, height = 220) {
  if (!points.length) return "";
  const maxValue = Math.max(...points.map((item) => item.value), 1);
  const gap = points.length > 1 ? width / (points.length - 1) : width;

  return points
    .map((item, index) => {
      const x = index * gap;
      const y = height - (item.value / maxValue) * (height - 18) - 8;
      return `${x},${y}`;
    })
    .join(" ");
}

function getReservationView(booking, payments) {
  const meta = parseBookingMeta(booking?.special_requests);
  const contact = meta?.booking_contact || {};
  const schedule = meta?.schedule || {};
  const bookingMeta = meta?.booking_meta || {};
  const reservationPayments = payments.filter(
    (payment) => Number(payment?.reservation_id) === Number(booking?.id)
  );

  return {
    ...booking,
    meta,
    bookingMeta,
    customerName: contact.full_name || booking?.user?.name || "-",
    customerEmail: contact.email || booking?.user?.email || "-",
    customerPhone: contact.phone || booking?.user?.phone || "-",
    vehicleLabel:
      `${booking?.car?.brand || ""} ${booking?.car?.model || ""}`.trim() || "-",
    pickupLabel: booking?.pickup_location || booking?.car?.company?.city || "-",
    returnLabel: booking?.dropoff_location || booking?.car?.company?.city || "-",
    pickupTime: schedule?.pickup_time || "-",
    returnTime: schedule?.return_time || "-",
    reservationDate: booking?.created_at || booking?.start_date || null,
    paymentRecord: reservationPayments[0] || null,
    paymentTotal:
      reservationPayments.find((payment) => payment?.status === "completed")?.amount ||
      reservationPayments[0]?.amount ||
      booking?.total_price ||
      0,
  };
}

export default function PartnerDashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [reservationsPayload, paymentsPayload, profilePayload] = await Promise.all([
          companyApi.getReservations(),
          companyApi.getPayments(),
          companyApi.getProfile(),
        ]);

        if (!mounted) return;

        const reservationList = asList(reservationsPayload);
        const paymentList = asList(paymentsPayload);

        setPayments(paymentList);
        setReservations(
          reservationList.map((reservation) =>
            getReservationView(reservation, paymentList)
          )
        );
        setProfile(profilePayload?.company || profilePayload || null);
      } catch (apiError) {
        if (mounted) setError(apiError?.message || "Unable to load dashboard.");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalReservations = reservations.length;
    const approvedReservations = reservations.filter(
      (reservation) => reservation?.status === "accepted" || reservation?.status === "confirmed"
    ).length;
    const pendingReservations = reservations.filter(
      (reservation) => reservation?.status === "pending"
    ).length;
    const visibleRevenue = reservations.reduce(
      (sum, reservation) => sum + Number(reservation?.paymentTotal || 0),
      0
    );

    return {
      totalReservations,
      approvedReservations,
      pendingReservations,
      visibleRevenue,
    };
  }, [reservations]);

  const revenueSeries = useMemo(() => {
    const now = new Date();
    const points = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const label = target.toLocaleDateString("fr-FR", { month: "short" });
      const value = reservations.reduce((sum, reservation) => {
        const bookingDate = reservation?.reservationDate
          ? new Date(reservation.reservationDate)
          : null;
        if (!bookingDate || Number.isNaN(bookingDate.getTime())) return sum;
        if (
          bookingDate.getMonth() !== target.getMonth() ||
          bookingDate.getFullYear() !== target.getFullYear()
        ) {
          return sum;
        }
        return sum + Number(reservation?.paymentTotal || 0);
      }, 0);

      points.push({ label, value });
    }

    return points;
  }, [reservations]);

  const topVehicles = useMemo(() => {
    const counts = reservations.reduce((acc, reservation) => {
      const key = reservation.vehicleLabel;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...reservations]
      .sort(
        (left, right) =>
          new Date(right?.reservationDate || 0).getTime() -
          new Date(left?.reservationDate || 0).getTime()
      )
      .filter((reservation) => {
        if (!query) return true;
        const target = [
          reservation.id,
          reservation.customerName,
          reservation.customerEmail,
          reservation.vehicleLabel,
          reservation.pickupLabel,
          reservation.returnLabel,
          reservation.status,
        ]
          .join(" ")
          .toLowerCase();
        return target.includes(query);
      });
  }, [reservations, search]);

  const polylinePoints = useMemo(() => buildPolyline(revenueSeries), [revenueSeries]);
  const maxVehicleCount = useMemo(
    () => Math.max(...topVehicles.map((item) => item.value), 1),
    [topVehicles]
  );

  return (
    <PartnerPortalShell title="Dashboard">
      <div className="partner-dashboard-board">
        {error ? <p className="error-box">{error}</p> : null}

        <section className="partner-dashboard-top">
          <article className="partner-dashboard-card dark">
            <div className="partner-dashboard-card-head">
              <h2>Revenue Overview</h2>
            </div>
            <div className="partner-dashboard-stats-row">
              <div className="partner-dashboard-stat">
                <span>Total Revenue</span>
                <strong>{formatMoney(stats.visibleRevenue)}</strong>
              </div>
              <div className="partner-dashboard-stat">
                <span>Total Bookings</span>
                <strong>{stats.totalReservations}</strong>
              </div>
              <div className="partner-dashboard-stat">
                <span>Approved</span>
                <strong>{stats.approvedReservations}</strong>
              </div>
              <div className="partner-dashboard-stat">
                <span>Pending</span>
                <strong>{stats.pendingReservations}</strong>
              </div>
            </div>
            <svg viewBox="0 0 520 220" className="partner-dashboard-chart" aria-hidden="true">
              <polyline points={polylinePoints} />
            </svg>
            <div className="partner-dashboard-label-row">
              {revenueSeries.map((item) => (
                <span key={item.label}>{item.label}</span>
              ))}
            </div>
          </article>

          <article className="partner-dashboard-card dark">
            <div className="partner-dashboard-card-head">
              <h2>Most Rented Vehicles</h2>
            </div>
            <div className="partner-dashboard-bars">
              {topVehicles.length ? (
                topVehicles.map((item) => (
                  <div key={item.label} className="partner-dashboard-bar-item">
                    <div
                      className="partner-dashboard-bar"
                      style={{
                        height: `${Math.max(
                          24,
                          (item.value / maxVehicleCount) * 180
                        )}px`,
                      }}
                    />
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))
              ) : (
                <p className="muted-dark">No rental activity yet.</p>
              )}
            </div>
          </article>
        </section>

        <section className="partner-dashboard-table-card">
          <div className="partner-dashboard-table-head">
            <div>
              <h2>Recent Reservations & Invoice</h2>
              <p>
                All reservation details, customer data, pickup and return entries are
                visible here and inside the invoice.
              </p>
            </div>
            <input
              type="text"
              placeholder="Search reservation..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="partner-table-wrap">
            <table className="partner-table partner-dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Vehicle</th>
                  <th>Pickup</th>
                  <th>Return</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>#{reservation.id}</td>
                    <td>
                      <div className="partner-dashboard-cell-stack">
                        <strong>{reservation.customerName}</strong>
                        <span>{reservation.customerEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className="partner-dashboard-cell-stack">
                        <strong>{reservation.vehicleLabel}</strong>
                        <span>{reservation?.car?.year || "-"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="partner-dashboard-cell-stack">
                        <strong>{reservation.pickupLabel}</strong>
                        <span>
                          {formatShortDate(reservation.start_date)} {reservation.pickupTime}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="partner-dashboard-cell-stack">
                        <strong>{reservation.returnLabel}</strong>
                        <span>
                          {formatShortDate(reservation.end_date)} {reservation.returnTime}
                        </span>
                      </div>
                    </td>
                    <td>{formatMoney(reservation.paymentTotal)}</td>
                    <td>
                      <span className={`partner-status ${reservation.status || ""}`}>
                        {formatStatus(reservation.status)}
                      </span>
                    </td>
                    <td>
                      <div className="partner-dashboard-actions">
                        <button
                          type="button"
                          className="partner-dashboard-pdf-btn"
                          onClick={() =>
                            openReservationContractDocument({
                              reservation,
                              company: profile,
                            })
                          }
                        >
                          View PDF
                        </button>
                        <button
                          type="button"
                          className="partner-dashboard-download-btn"
                          onClick={() =>
                            downloadReservationContractDocument({
                              reservation,
                              company: profile,
                            })
                          }
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={8}>No reservation data available.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PartnerPortalShell>
  );
}
