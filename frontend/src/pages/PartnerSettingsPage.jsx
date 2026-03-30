import { useEffect, useState } from "react";
import PartnerPortalShell from "../components/PartnerPortalShell";
import { userApi } from "../services/apiClient";

export default function PartnerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const profile = await userApi.getProfile();
        if (mounted) {
          setForm({
            name: profile?.name || "",
            email: profile?.email || "",
            phone: profile?.phone || "",
            address: profile?.address || "",
            city: profile?.city || "",
          });
        }
      } catch (apiError) {
        if (mounted) setError(apiError?.message || "Unable to load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await userApi.updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
      });
      setSuccess("Settings updated successfully.");
    } catch (apiError) {
      setError(apiError?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PartnerPortalShell
      title="Settings"
      actions={
        <button
          className="partner-primary-btn"
          type="submit"
          form="partner-settings-form"
          disabled={saving || loading}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      }
    >
      {loading ? <p className="muted-dark">Loading settings...</p> : null}
      {!loading && error ? <p className="error-box">{error}</p> : null}
      {!loading && success ? <p className="success-box">{success}</p> : null}

      {!loading ? (
        <form id="partner-settings-form" className="partner-settings-grid" onSubmit={handleSubmit}>
          <article className="partner-settings-card">
            <h3>Profile Information</h3>
            <label>
              Full Name
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            <label>
              Email (readonly)
              <input value={form.email} disabled />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </label>
          </article>

          <article className="partner-settings-card">
            <h3>Company Address</h3>
            <label>
              Address
              <input
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </label>
            <label>
              City
              <input
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </label>
          </article>
        </form>
      ) : null}
    </PartnerPortalShell>
  );
}

