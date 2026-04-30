export default function AdminStatusBadge({ status, children }) {
  return <span className={`admin-status-pill ${status || "pending"}`}>{children}</span>;
}
