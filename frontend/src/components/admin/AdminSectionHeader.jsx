export default function AdminSectionHeader({ title, subtitle, actions = null, inline = false }) {
  const className = inline ? "admin-section-title is-inline" : "admin-section-title";

  return (
    <header className={className}>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions}
    </header>
  );
}
