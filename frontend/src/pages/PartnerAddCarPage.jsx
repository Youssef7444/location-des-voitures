import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PartnerPortalShell from "../components/PartnerPortalShell";
import { companyApi, publicApi } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

function asList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

const defaultForm = {
  category_id: "",
  type_car: "sedan",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  license_plate: "",
  mileage: 0,
  fuel_type: "gasoline",
  transmission: "automatic",
  seats: 5,
  price_per_day: "",
  discount_percent: 0,
  available: true,
  description: "",
  featuresText: "",
  image: null,
};

export default function PartnerAddCarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [categories, setCategories] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      setLoading(true);
      setError("");

      try {
        const [categoriesResponse, companiesResponse] = await Promise.all([
          publicApi.listCategories(),
          publicApi.listCompanies({ per_page: 200 }),
        ]);

        const categoriesList = asList(categoriesResponse);
        const companies = asList(companiesResponse);
        const myCompany = companies.find((company) => Number(company?.user_id) === Number(user?.id));

        if (!myCompany) {
          throw new Error("Company profile not found.");
        }

        if (mounted) {
          setCategories(categoriesList);
          setCompanyId(myCompany.id);
          setForm((prev) => ({
            ...prev,
            category_id: categoriesList[0]?.id ? String(categoriesList[0].id) : "",
          }));
        }
      } catch (apiError) {
        if (mounted) setError(apiError?.message || "Unable to load form data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const featuresArray = useMemo(
    () =>
      form.featuresText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [form.featuresText]
  );

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!companyId) {
      setError("Company profile not found.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        company_id: companyId,
        category_id: Number(form.category_id),
        type_car: form.type_car || null,
        brand: form.brand,
        model: form.model,
        year: Number(form.year),
        color: form.color || null,
        license_plate: form.license_plate,
        mileage: Number(form.mileage || 0),
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        seats: Number(form.seats),
        price_per_day: Number(form.price_per_day),
        discount_percent: Number(form.discount_percent || 0),
        available: Boolean(form.available),
        features: JSON.stringify(featuresArray),
        description: form.description || null,
      };

      const created = await companyApi.createCar(payload);
      const carId = created?.car?.id;

      if (carId && form.image) {
        const imageForm = new FormData();
        imageForm.append("car_id", String(carId));
        imageForm.append("is_main", "1");
        imageForm.append("image", form.image);
        await companyApi.createCarImage(imageForm);
      }

      window.dispatchEvent(new CustomEvent("app-toast", { detail: "Voiture ajoutee avec succes." }));
      navigate("/partner/cars");
    } catch (apiError) {
      setError(apiError?.message || "Unable to create car.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PartnerPortalShell
      title="Add New Car"
      actions={
        <button className="partner-ghost-btn" type="button" onClick={() => navigate("/partner/cars")}>
          Back to Cars
        </button>
      }
    >
      {loading ? <p className="muted-dark">Loading form...</p> : null}
      {!loading && error ? <p className="error-box">{error}</p> : null}

      {!loading && !error ? (
        <form className="partner-add-car-form" onSubmit={handleSubmit}>
          <div className="partner-add-grid">
            <label>
              Category
              <select
                value={form.category_id}
                onChange={(event) => updateField("category_id", event.target.value)}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Car Type
              <select value={form.type_car} onChange={(event) => updateField("type_car", event.target.value)}>
                <option value="sedan">sedan</option>
                <option value="suv">suv</option>
                <option value="truck">truck</option>
                <option value="luxury">luxury</option>
                <option value="convertible">convertible</option>
                <option value="van">van</option>
              </select>
            </label>

            <label>
              Brand
              <input value={form.brand} onChange={(event) => updateField("brand", event.target.value)} required />
            </label>

            <label>
              Model
              <input value={form.model} onChange={(event) => updateField("model", event.target.value)} required />
            </label>

            <label>
              Year
              <input
                type="number"
                value={form.year}
                onChange={(event) => updateField("year", event.target.value)}
                min={1900}
                max={2099}
                required
              />
            </label>

            <label>
              Color
              <input value={form.color} onChange={(event) => updateField("color", event.target.value)} />
            </label>

            <label>
              License Plate
              <input
                value={form.license_plate}
                onChange={(event) => updateField("license_plate", event.target.value)}
                required
              />
            </label>

            <label>
              Mileage
              <input
                type="number"
                value={form.mileage}
                onChange={(event) => updateField("mileage", event.target.value)}
                min={0}
              />
            </label>

            <label>
              Fuel Type
              <select value={form.fuel_type} onChange={(event) => updateField("fuel_type", event.target.value)}>
                <option value="gasoline">gasoline</option>
                <option value="diesel">diesel</option>
                <option value="electric">electric</option>
                <option value="hybrid">hybrid</option>
              </select>
            </label>

            <label>
              Transmission
              <select value={form.transmission} onChange={(event) => updateField("transmission", event.target.value)}>
                <option value="automatic">automatic</option>
                <option value="manual">manual</option>
              </select>
            </label>

            <label>
              Seats
              <input
                type="number"
                value={form.seats}
                onChange={(event) => updateField("seats", event.target.value)}
                min={1}
                max={10}
              />
            </label>

            <label>
              Price per day
              <input
                type="number"
                value={form.price_per_day}
                onChange={(event) => updateField("price_per_day", event.target.value)}
                min={0}
                step="0.01"
                required
              />
            </label>

            <label>
              Discount %
              <input
                type="number"
                value={form.discount_percent}
                onChange={(event) => updateField("discount_percent", event.target.value)}
                min={0}
                max={100}
              />
            </label>

            <label className="partner-span-2">
              Features (comma separated)
              <input
                value={form.featuresText}
                onChange={(event) => updateField("featuresText", event.target.value)}
                placeholder="GPS, Bluetooth, Leather Seats"
              />
            </label>

            <label className="partner-span-2">
              Description
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={4}
              />
            </label>

            <label>
              Main Image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => updateField("image", event.target.files?.[0] || null)}
              />
            </label>

            <label className="partner-checkbox">
              <input
                type="checkbox"
                checked={Boolean(form.available)}
                onChange={(event) => updateField("available", event.target.checked)}
              />
              Available
            </label>
          </div>

          <button className="partner-primary-btn partner-add-submit" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Car"}
          </button>
        </form>
      ) : null}
    </PartnerPortalShell>
  );
}

