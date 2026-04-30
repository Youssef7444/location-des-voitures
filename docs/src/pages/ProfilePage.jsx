import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resolveMediaUrl, userApi } from "../services/apiClient";
import { AVATAR_OPTIONS, getAvatarSrcByKey } from "../utils/avatars";
import archiveArrowIcon from "../assets/icon-flich2.png";

function splitName(fullName) {
  const clean = String(fullName || "").trim();
  if (!clean) return { firstName: "", lastName: "" };
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function splitAddress(address) {
  const parts = String(address || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    street: parts[0] || "",
    city: parts[1] || "",
    country: parts[2] || "",
  };
}

function formatMemberSince(rawDate) {
  if (!rawDate) return "N/A";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function hasCustomAvatarPath(path) {
  const clean = String(path || "").trim();
  return Boolean(clean && clean !== "default-avatar.png" && clean !== "/default-avatar.png");
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated, refreshUser, updateLocalUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    street: "",
    city: "",
    country: "",
    username: "",
    driverLicenseNumber: "",
    avatarKey: "",
  });

  useEffect(() => {
    if (isAuthenticated && !user) {
      refreshUser();
    }
  }, [isAuthenticated, user, refreshUser]);

  useEffect(() => {
    if (!user) return;

    const name = splitName(user.name);
    const address = splitAddress(user.address);

    setForm({
      firstName: user.first_name || name.firstName,
      lastName: user.last_name || name.lastName,
      email: user.email || "",
      phone: user.phone || "",
      gender: user.gender || "",
      dateOfBirth: user.date_of_birth || "",
      street: address.street || "",
      city: user.city || address.city || "",
      country: user.country || address.country || "",
      username: user.username || "",
      driverLicenseNumber: user.driver_license_number || "",
      avatarKey: user.avatar_key || "",
    });
  }, [user]);

  const profileAvatar = useMemo(() => {
    if (hasCustomAvatarPath(user?.avatar)) {
      return resolveMediaUrl(user.avatar);
    }
    return getAvatarSrcByKey(form.avatarKey);
  }, [user?.avatar, form.avatarKey]);

  const fullName = `${form.firstName} ${form.lastName}`.trim() || user?.name || "Client";

  if (!authLoading && !isAuthenticated) {
    return <Navigate replace to="/auth?mode=signin&next=%2Fprofile" />;
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const composedName = `${form.firstName} ${form.lastName}`.trim();
      const addressValue = [form.street, form.city, form.country].filter(Boolean).join(", ");

      const payload = await userApi.updateProfile({
        name: composedName || user.name,
        first_name: form.firstName || null,
        last_name: form.lastName || null,
        username: form.username || null,
        phone: form.phone || null,
        gender: form.gender || null,
        date_of_birth: form.dateOfBirth || null,
        address: addressValue || null,
        country: form.country || null,
        city: form.city || null,
        driver_license_number: form.driverLicenseNumber || null,
        avatar_key: form.avatarKey || null,
      });

      if (payload?.user) {
        updateLocalUser(payload.user);
      } else {
        updateLocalUser({
          ...user,
          name: composedName || user.name,
          first_name: form.firstName || null,
          last_name: form.lastName || null,
          username: form.username || null,
          phone: form.phone || null,
          gender: form.gender || null,
          date_of_birth: form.dateOfBirth || null,
          address: addressValue || null,
          country: form.country || null,
          city: form.city || null,
          driver_license_number: form.driverLicenseNumber || null,
          avatar_key: form.avatarKey || null,
        });
      }

      setEditing(false);
      setSuccess("Profile updated successfully.");
      window.dispatchEvent(new CustomEvent("app-toast", { detail: "Profil mis a jour avec succes." }));
    } catch (apiError) {
      if (apiError?.errors && typeof apiError.errors === "object") {
        const firstKey = Object.keys(apiError.errors)[0];
        const firstMessage = firstKey ? apiError.errors[firstKey]?.[0] : "";
        setError(firstMessage || "Unable to update profile.");
      } else {
        setError(apiError?.message || "Unable to update profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <section className="section profile-page profile-home-theme">
      <div className="content-wrap">
        <div className="profile-head-row">
          <h1 className="profile-title">My Profile</h1>
          <button className="profile-archives-btn" type="button" onClick={() => navigate("/archives")}>
            <img src={archiveArrowIcon} alt="" className="profile-archives-icon" />
            <span>Open Archives</span>
          </button>
        </div>

        <div className="profile-layout">
          <aside className="profile-summary-card">
            {profileAvatar ? (
              <img className="profile-avatar-large" src={profileAvatar} alt={`${fullName} avatar`} />
            ) : (
              <div className="profile-avatar-empty">No Avatar</div>
            )}
            <h2>{fullName}</h2>
            <p>{form.email || "example@email.com"}</p>
            <p>{form.phone || "Not provided"}</p>
            <p>
              <strong>Member Since:</strong> {formatMemberSince(user?.created_at)}
            </p>
            <button className="profile-edit-btn" type="button" onClick={() => setEditing((prev) => !prev)}>
              {editing ? "Cancel Edit" : "Edit Profile"}
            </button>
          </aside>

          <form className="profile-form-card" onSubmit={handleSave}>
            <div className="profile-form-grid">
              <div>
                <h3>Personal Information</h3>
                <div className="profile-two-cols">
                  <label>
                    First Name
                    <input
                      type="text"
                      disabled={!editing}
                      value={form.firstName}
                      onChange={(event) => updateForm("firstName", event.target.value)}
                    />
                  </label>
                  <label>
                    Last Name
                    <input
                      type="text"
                      disabled={!editing}
                      value={form.lastName}
                      onChange={(event) => updateForm("lastName", event.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Email
                  <input type="email" disabled value={form.email} />
                </label>
                <label>
                  Phone Number
                  <input
                    type="text"
                    disabled={!editing}
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                  />
                </label>
                <div className="profile-two-cols">
                  <label>
                    Gender
                    <select
                      disabled={!editing}
                      value={form.gender}
                      onChange={(event) => updateForm("gender", event.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label>
                    Date of Birth
                    <input
                      type="date"
                      disabled={!editing}
                      value={form.dateOfBirth}
                      onChange={(event) => updateForm("dateOfBirth", event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3>Address</h3>
                <label>
                  Street
                  <input
                    type="text"
                    disabled={!editing}
                    value={form.street}
                    onChange={(event) => updateForm("street", event.target.value)}
                  />
                </label>
                <div className="profile-two-cols">
                  <label>
                    City
                    <input
                      type="text"
                      disabled={!editing}
                      value={form.city}
                      onChange={(event) => updateForm("city", event.target.value)}
                    />
                  </label>
                  <label>
                    Country
                    <input
                      type="text"
                      disabled={!editing}
                      value={form.country}
                      onChange={(event) => updateForm("country", event.target.value)}
                    />
                  </label>
                </div>

                <h3>Account Settings</h3>
                <label>
                  Username
                  <input
                    type="text"
                    disabled={!editing}
                    value={form.username}
                    onChange={(event) => updateForm("username", event.target.value)}
                  />
                </label>
                <label>
                  Driver's License Number
                  <input
                    type="text"
                    disabled={!editing}
                    value={form.driverLicenseNumber}
                    onChange={(event) => updateForm("driverLicenseNumber", event.target.value)}
                  />
                </label>
              </div>
            </div>

            {editing ? (
              <div className="avatar-picker">
                <h3>Choose Avatar</h3>
                <div className="avatar-grid">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.key}
                      type="button"
                      className={`avatar-choice ${form.avatarKey === avatar.key ? "active" : ""}`}
                      onClick={() => updateForm("avatarKey", avatar.key)}
                    >
                      <img src={avatar.src} alt={avatar.key} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {success ? <p className="profile-success">{success}</p> : null}
            {error ? <p className="error-box">{error}</p> : null}

            {editing ? (
              <button className="profile-save-btn" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
