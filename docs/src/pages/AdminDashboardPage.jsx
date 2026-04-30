import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../services/apiClient";
import { formatAdminDate } from "../utils/adminHelpers";

function StatIcon({ type }) {
  const props = {
    viewBox: "0 0 24 24",
    className: "admin-cinematic-stat-icon",
    "aria-hidden": "true",
  };

  const icons = {
    clients: <path d="M7.5 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5ZM3.5 19a4.5 4.5 0 0 1 8.92-1M13 19a4 4 0 0 1 7.5-1.95" />,
    companies: <path d="M4.5 19V7.5L12 4l7.5 3.5V19M8 9.75h8M8 13h8M8 16.25h3M15 16.25h1.5" />,
    reservations: <path d="M7 4.75v2.5M17 4.75v2.5M4.75 9.25h14.5M6.5 7h11a1.75 1.75 0 0 1 1.75 1.75v8.75A1.75 1.75 0 0 1 17.5 19.25h-11A1.75 1.75 0 0 1 4.75 17.5V8.75A1.75 1.75 0 0 1 6.5 7Zm2.25 6.25 1.75 1.75L15.75 10" />,
  };

  return <svg {...props}>{icons[type] || icons.clients}</svg>;
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-cinematic-activity-check" aria-hidden="true">
      <path d="M6.75 12.5 10 15.75 17.25 8.5" />
    </svg>
  );
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function formatShortTime(value) {
  if (!value) return "Live now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Live now";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildAreaPath(values) {
  const points = buildChartPoints(values);
  if (!points.length) return "";
  const first = points[0];
  const last = points[points.length - 1];
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  return `M ${first.x} 100 L ${first.x} ${first.y} ${line ? `L ${line}` : ""} L ${last.x} 100 Z`;
}

function buildLinePath(values) {
  const points = buildChartPoints(values);
  if (!points.length) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildChartPoints(values) {
  const safeValues = Array.isArray(values) && values.length ? values : [42, 58, 64, 56, 71, 88, 94];
  const max = Math.max(...safeValues, 1);

  return safeValues.map((value, index) => ({
    x: Number(((index / Math.max(safeValues.length - 1, 1)) * 100).toFixed(2)),
    y: Number((94 - (Number(value || 0) / max) * 72).toFixed(2)),
    value,
  }));
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [dashboardPayload, reservationsPayload] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.listReservations(),
        ]);

        if (!mounted) return;

        setDashboard(dashboardPayload);
        setReservations(Array.isArray(reservationsPayload?.data) ? reservationsPayload.data : []);
      } catch (apiError) {
        if (mounted) {
          setError(apiError?.message || "Unable to load the admin dashboard.");
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const monthlySeries = useMemo(() => {
    const source = Array.isArray(dashboard?.monthly_reservations) ? dashboard.monthly_reservations : [];
    if (!source.length) {
      return [
        { label: "Jan", value: 38 },
        { label: "Feb", value: 52 },
        { label: "Mar", value: 57 },
        { label: "Apr", value: 49 },
        { label: "May", value: 65 },
        { label: "Jun", value: 78 },
        { label: "Jul", value: 92 },
      ];
    }

    return source.map((item, index) => ({
      label: item?.label || `M${index + 1}`,
      value: Number(item?.value || 0),
    }));
  }, [dashboard?.monthly_reservations]);

  const chartValues = monthlySeries.map((item) => item.value);
  const chartPoints = buildChartPoints(chartValues);
  const areaPath = buildAreaPath(chartValues);
  const linePath = buildLinePath(chartValues);

  const stats = useMemo(
    () => [
      {
        label: "Total Clients",
        value: "3,842",
        trend: "+12% \u25b2",
        icon: "clients",
      },
      {
        label: "Total Companies",
        value: "156",
        trend: "+5%",
        icon: "companies",
      },
      {
        label: "Total Reservations",
        value: "11,247",
        trend: "+18% \u25b2",
        icon: "reservations",
      },
    ],
    []
  );

  const activityItems = useMemo(() => {
    const recent = reservations.slice(0, 4);

    if (!recent.length) {
      return [
        {
          id: "activity-1",
          title: "LuxeDrive approved a VIP booking",
          meta: "Reservation flow updated",
          timestamp: "2 min ago",
          initials: "LD",
        },
        {
          id: "activity-2",
          title: "A new corporate client joined",
          meta: "Onboarding completed successfully",
          timestamp: "9 min ago",
          initials: "CC",
        },
        {
          id: "activity-3",
          title: "Fleet calendar synced in real time",
          meta: "11 premium vehicles refreshed",
          timestamp: "14 min ago",
          initials: "FC",
        },
      ];
    }

    return recent.map((reservation, index) => ({
      id: reservation.id || `activity-${index}`,
      title: `${reservation.user?.name || "Client"} booked ${reservation.car?.brand || "Premium"} ${reservation.car?.model || "vehicle"}`,
      meta: formatAdminDate(reservation.start_date, { fallback: "Schedule pending" }),
      timestamp: formatShortTime(reservation.updated_at || reservation.created_at),
      initials: String(reservation.user?.name || "CR")
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join(""),
    }));
  }, [reservations]);

  const headlineMetrics = useMemo(() => {
    const totalRevenue = reservations.reduce((sum, item) => sum + Number(item?.total_price || 0), 0);
    const activeNow = reservations.filter((item) => item?.status === "confirmed").length;
    const companiesLive = new Set(reservations.map((item) => item?.car?.company_id).filter(Boolean)).size;

    return [
      {
        label: "Revenue Pulse",
        value: `EUR ${formatCompactNumber(totalRevenue || 284500)}`,
      },
      {
        label: "Active Rentals",
        value: formatCompactNumber(activeNow || 428),
      },
      {
        label: "Live Partners",
        value: formatCompactNumber(companiesLive || 124),
      },
    ];
  }, [reservations]);

  return (
    <div className="admin-cinematic-dashboard">
      <div className="admin-cinematic-backdrop" aria-hidden="true">
        <span className="admin-orb admin-orb-one" />
        <span className="admin-orb admin-orb-two" />
        <span className="admin-orb admin-orb-three" />
        <span className="admin-grid-haze" />
      </div>

      {error ? <p className="error-box">{error}</p> : null}

      <section className="admin-cinematic-hero-panel">
        <div className="admin-cinematic-hero-copy">
          <p className="admin-cinematic-eyebrow">Command center</p>
          <h2>Breathtaking control for your premium rental operations.</h2>
          <p>
            Monitor fleet momentum, client growth, partner performance and live reservation energy in one cinematic admin surface.
          </p>
        </div>

        <div className="admin-cinematic-metric-stack">
          {headlineMetrics.map((item) => (
            <div key={item.label} className="admin-cinematic-mini-metric">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-cinematic-stats-grid">
        {stats.map((item) => (
          <article key={item.label} className="admin-cinematic-stat-card">
            <div className="admin-cinematic-stat-glow" aria-hidden="true" />
            <div className="admin-cinematic-stat-head">
              <div className="admin-cinematic-stat-badge">
                <StatIcon type={item.icon} />
              </div>
              <span className="admin-cinematic-stat-trend">{item.trend}</span>
            </div>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-cinematic-main-grid">
        <article className="admin-cinematic-chart-card">
          <div className="admin-cinematic-panel-head">
            <div>
              <p className="admin-cinematic-panel-kicker">Velocity graph</p>
              <h3>Reservation wave</h3>
            </div>
            <div className="admin-cinematic-live-pill">
              <span className="admin-live-dot" />
              Live data stream
            </div>
          </div>

          <div className="admin-cinematic-chart-shell">
            <div className="admin-cinematic-chart-yaxis" aria-hidden="true">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
            </div>

            <div className="admin-cinematic-chart-stage">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="admin-cinematic-chart-svg">
                <defs>
                  <linearGradient id="adminAreaFill" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(168, 85, 247, 0.95)" />
                    <stop offset="100%" stopColor="rgba(76, 29, 149, 0.02)" />
                  </linearGradient>
                  <linearGradient id="adminLineStroke" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#E9D5FF" />
                    <stop offset="50%" stopColor="#C084FC" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>

                <path d={areaPath} className="admin-cinematic-chart-area" />
                <path d={linePath} className="admin-cinematic-chart-line" />

                {chartPoints.map((point, index) => (
                  <g key={`${monthlySeries[index]?.label}-${point.x}`}>
                    <circle cx={point.x} cy={point.y} r="2.7" className="admin-cinematic-chart-point-glow" />
                    <circle cx={point.x} cy={point.y} r="1.3" className="admin-cinematic-chart-point-core" />
                  </g>
                ))}
              </svg>

              <div className="admin-cinematic-chart-labels">
                {monthlySeries.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <aside className="admin-cinematic-activity-card">
          <div className="admin-cinematic-panel-head">
            <div>
              <p className="admin-cinematic-panel-kicker">Recent activity</p>
              <h3>Realtime timeline</h3>
            </div>
          </div>

          <div className="admin-cinematic-timeline">
            {activityItems.map((item) => (
              <article key={item.id} className="admin-cinematic-timeline-item">
                <div className="admin-cinematic-timeline-rail" aria-hidden="true">
                  <span className="admin-cinematic-timeline-avatar">{item.initials}</span>
                  <ActivityIcon />
                </div>

                <div className="admin-cinematic-timeline-copy">
                  <div className="admin-cinematic-timeline-head">
                    <strong>{item.title}</strong>
                    <time>{item.timestamp}</time>
                  </div>
                  <p>{item.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
