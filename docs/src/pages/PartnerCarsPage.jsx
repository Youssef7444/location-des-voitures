import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PartnerPortalShell from "../components/PartnerPortalShell";
import { publicApi } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

function asList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export default function PartnerCarsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCars() {
      setLoading(true);
      setError("");

      try {
        const [carsResponse, companiesResponse] = await Promise.all([
          publicApi.listCars({ per_page: 200 }),
          publicApi.listCompanies({ per_page: 200 }),
        ]);

        const allCars = asList(carsResponse);
        const allCompanies = asList(companiesResponse);
        const myCompany = allCompanies.find(
          (company) => Number(company?.user_id) === Number(user?.id)
        );

        const companyCars = myCompany
          ? allCars.filter((car) => Number(car?.company_id) === Number(myCompany.id))
          : [];

        if (mounted) setCars(companyCars);
      } catch (apiError) {
        if (mounted) setError(apiError?.message || "Unable to load cars.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCars();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const brandOptions = useMemo(
    () =>
      Array.from(new Set(cars.map((car) => car?.brand).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b))
      ),
    [cars]
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(cars.map((car) => car?.category?.name).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b))
      ),
    [cars]
  );

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const searchText = `${car?.brand || ""} ${car?.model || ""} ${car?.license_plate || ""}`.toLowerCase();
      const searchOk = !search || searchText.includes(search.toLowerCase());
      const brandOk = !brand || car?.brand === brand;
      const categoryOk = !category || car?.category?.name === category;
      const statusOk =
        !status ||
        (status === "active" ? Boolean(car?.available) : !Boolean(car?.available));

      return searchOk && brandOk && categoryOk && statusOk;
    });
  }, [cars, search, brand, category, status]);

  return (
    <PartnerPortalShell
      title="Car Management"
      actions={
        <>
          <button
            className="partner-primary-btn"
            type="button"
            onClick={() => navigate("/partner/cars/new")}
          >
            + Add New Car
          </button>
          <button className="partner-ghost-btn" type="button">
            Export CSV
          </button>
        </>
      }
    >
      <div className="partner-filters-row">
        <input
          type="text"
          placeholder="Search cars by name or id..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={brand} onChange={(event) => setBrand(event.target.value)}>
          <option value="">All Brands</option>
          {brandOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All Categories</option>
          {categoryOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All Status</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </div>

      {loading ? <p className="muted-dark">Loading cars...</p> : null}
      {!loading && error ? <p className="error-box">{error}</p> : null}

      {!loading && !error ? (
        <div className="partner-table-wrap">
          <table className="partner-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Car Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Year</th>
                <th>Price/Day</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.map((car) => (
                <tr key={car.id}>
                  <td>{car.id}</td>
                  <td>{`${car.brand || ""} ${car.model || ""}`.trim()}</td>
                  <td>{car.brand || "-"}</td>
                  <td>{car.category?.name || "-"}</td>
                  <td>{car.year || "-"}</td>
                  <td>${car.price_per_day ?? "-"}</td>
                  <td>
                    <span className={`partner-status ${car.available ? "active" : "inactive"}`}>
                      {car.available ? "active" : "inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="partner-table-actions">
                      <button type="button">Edit</button>
                      <button type="button">Delete</button>
                      <button type="button">View</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={8}>No cars found for this company.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </PartnerPortalShell>
  );
}
