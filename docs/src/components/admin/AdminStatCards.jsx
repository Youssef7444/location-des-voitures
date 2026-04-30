export function AdminStatCards({ items = [] }) {
  return (
    <section className="admin-dashboard-stat-grid">
      {items.map((item) => (
        <article
          key={item.label}
          className={`admin-light-card admin-dashboard-stat-card ${item.loading ? "is-loading" : ""}`}
        >
          <span>{item.label}</span>
          {item.loading ? (
            <div className="admin-skeleton admin-skeleton-stat" aria-hidden="true" />
          ) : (
            <strong className={item.accent ? "is-accent" : ""}>{item.value}</strong>
          )}
        </article>
      ))}
    </section>
  );
}
