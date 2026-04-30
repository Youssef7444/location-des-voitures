import axios from "axios";

const TOKEN_KEY = "auth_token";
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common.Authorization;
}

const existingToken = getAuthToken();
if (existingToken) {
  setAuthToken(existingToken);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status || 0;
    const data = error?.response?.data || {};

    const normalizedError = {
      status,
      message:
        data.message ||
        (status === 401
          ? "Unauthenticated."
          : status === 403
            ? "Unauthorized"
            : status === 422
              ? "Validation failed"
              : "Internal Server Error"),
      errors: data.errors || null,
      raw: data,
    };

    if (status === 401) {
      clearAuthToken();
    }

    return Promise.reject(normalizedError);
  }
);

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function unwrapResponse(promise) {
  return promise.then((response) => response.data);
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

export function resolveMediaUrl(path) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API_ORIGIN}${path}`;
  }

  return `${API_ORIGIN}/storage/${path}`;
}

export const authApi = {
  companyRegister(formData) {
    return unwrapResponse(
      api.post("/auth/company-register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).then((data) => {
      if (data?.token) setAuthToken(data.token);
      return data;
    });
  },

  register(payload) {
    return unwrapResponse(api.post("/auth/register", payload)).then((data) => {
      if (data?.token) setAuthToken(data.token);
      return data;
    });
  },

  login(payload) {
    return unwrapResponse(api.post("/auth/login", payload)).then((data) => {
      if (data?.token) setAuthToken(data.token);
      return data;
    });
  },

  me() {
    return unwrapResponse(api.get("/auth/me"));
  },

  refresh() {
    return unwrapResponse(api.post("/auth/refresh")).then((data) => {
      if (data?.token) setAuthToken(data.token);
      return data;
    });
  },

  logout() {
    return unwrapResponse(api.post("/auth/logout")).finally(() => {
      clearAuthToken();
    });
  },
};

export const publicApi = {
  listCars(params = {}) {
    const query = buildQuery(params);
    return unwrapResponse(api.get(`/cars${query ? `?${query}` : ""}`));
  },

  searchCars(params = {}) {
    const query = buildQuery(params);
    return unwrapResponse(api.get(`/cars/search${query ? `?${query}` : ""}`));
  },

  getCar(carId) {
    return unwrapResponse(api.get(`/cars/${carId}`));
  },

  getCarReviews(carId) {
    return unwrapResponse(api.get(`/cars/${carId}/reviews`));
  },

  listCategories() {
    return unwrapResponse(api.get("/categories"));
  },

  listCities() {
    return unwrapResponse(api.get("/cities"));
  },

  listCompanies(params = {}) {
    const query = buildQuery(params);
    return unwrapResponse(api.get(`/companies${query ? `?${query}` : ""}`));
  },

  getCompany(companyId) {
    return unwrapResponse(api.get(`/companies/${companyId}`));
  },

  listInsuranceTypes() {
    return unwrapResponse(api.get("/insurance-types"));
  },
};

export const userApi = {
  getProfile() {
    return unwrapResponse(api.get("/user/profile"));
  },

  updateProfile(payload) {
    return unwrapResponse(api.post("/user/profile", payload));
  },

  changePassword(payload) {
    return unwrapResponse(api.post("/user/change-password", payload));
  },

  getReservations() {
    return unwrapResponse(api.get("/user/reservations"));
  },

  createReservation(payload) {
    return unwrapResponse(api.post("/reservations", payload));
  },

  getReservation(reservationId) {
    return unwrapResponse(api.get(`/reservations/${reservationId}`));
  },

  updateReservation(reservationId, payload) {
    return unwrapResponse(api.put(`/reservations/${reservationId}`, payload));
  },

  cancelReservation(reservationId) {
    return unwrapResponse(api.post(`/reservations/${reservationId}/cancel`));
  },

  createReview(payload) {
    return unwrapResponse(api.post("/reviews", payload));
  },

  updateReview(reviewId, payload) {
    return unwrapResponse(api.put(`/reviews/${reviewId}`, payload));
  },

  deleteReview(reviewId) {
    return unwrapResponse(api.delete(`/reviews/${reviewId}`));
  },

  listNotifications() {
    return unwrapResponse(api.get("/notifications"));
  },

  getUnreadNotificationsCount() {
    return unwrapResponse(api.get("/notifications/unread/count"));
  },

  markNotificationAsRead(notificationId) {
    return unwrapResponse(api.post(`/notifications/${notificationId}/read`));
  },

  markAllNotificationsAsRead() {
    return unwrapResponse(api.post("/notifications/read-all"));
  },

  deleteNotification(notificationId) {
    return unwrapResponse(api.delete(`/notifications/${notificationId}`));
  },

  listDocuments() {
    return unwrapResponse(api.get("/documents"));
  },

  createDocument(payload) {
    return unwrapResponse(api.post("/documents", payload));
  },

  deleteDocument(documentId) {
    return unwrapResponse(api.delete(`/documents/${documentId}`));
  },

  listPayments() {
    return unwrapResponse(api.get("/payments"));
  },

  createPayment(payload) {
    return unwrapResponse(api.post("/payments", payload));
  },
};

export const adminApi = {
  createCategory(payload) {
    return unwrapResponse(api.post("/admin/categories", payload));
  },

  createCompany(payload) {
    return unwrapResponse(api.post("/admin/companies", payload));
  },

  listReservations() {
    return unwrapResponse(api.get("/admin/reservations"));
  },

  updateReservationStatus(reservationId, payload) {
    return unwrapResponse(
      api.post(`/admin/reservations/${reservationId}/status`, payload)
    );
  },

  getPaymentStats() {
    return unwrapResponse(api.get("/admin/payments/stats"));
  },
};

export const companyApi = {
  createCar(payload) {
    return unwrapResponse(api.post("/company/cars", payload));
  },

  updateCar(carId, payload) {
    return unwrapResponse(api.put(`/company/cars/${carId}`, payload));
  },

  deleteCar(carId) {
    return unwrapResponse(api.delete(`/company/cars/${carId}`));
  },

  createCarImage(formData) {
    return unwrapResponse(
      api.post("/company/car-images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    );
  },

  getStats() {
    return unwrapResponse(api.get("/company/stats"));
  },

  getReservations() {
    return unwrapResponse(api.get("/company/reservations"));
  },

  getPayments() {
    return unwrapResponse(api.get("/company/payments"));
  },
};
