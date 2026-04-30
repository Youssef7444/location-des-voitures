export function formatAdminCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatAdminDate(value, options = {}) {
  if (!value) return options.fallback || "Non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return options.fallback || "Non disponible";
  return date.toLocaleDateString("fr-FR", options.format || undefined);
}

export function getAdminReservationStatusLabel(status) {
  const labels = {
    pending: "En attente",
    confirmed: "Approuvee",
    completed: "Terminee",
    cancelled: "Annulee",
    rejected: "Refusee",
  };

  return labels[status] || status || "Inconnu";
}

export function getAdminCompanyStatusLabel(status) {
  const labels = {
    approved: "Approuve",
    pending: "En attente",
    rejected: "Refusee",
    active: "Actif",
    inactive: "Inactif",
  };

  return labels[status] || status || "Inconnu";
}

function readVehicleValue(...values) {
  return values
    .map((value) => String(value || "").trim())
    .find(Boolean);
}

export function getAdminVehicleLabel(car) {
  if (!car || typeof car !== "object") {
    return "Vehicule non renseigne";
  }

  const brand = readVehicleValue(car.brand, car.make, car.manufacturer);
  const model = readVehicleValue(car.model, car.model_name, car.modelName);
  const combined = [brand, model].filter(Boolean).join(" ").trim();

  if (combined) {
    return combined;
  }

  const namedCandidate = readVehicleValue(
    car.vehicle_label,
    car.vehicleLabel,
    car.full_name,
    car.fullName,
    car.name,
    car.title
  );

  if (namedCandidate) {
    return namedCandidate;
  }

  return car.id ? `Vehicule #${car.id}` : "Vehicule non renseigne";
}

export function getAdminCompanyCars(company) {
  const candidates = [company?.cars, company?.vehicles, company?.fleet];
  const found = candidates.find(Array.isArray);
  return Array.isArray(found) ? found.filter((item) => item && typeof item === "object") : [];
}

export function buildDashboardLinePoints(series) {
  const items = Array.isArray(series) && series.length ? series : [];
  if (!items.length) return "";

  const max = Math.max(...items.map((item) => Number(item?.value || 0)), 1);
  return items
    .map((item, index) => {
      const x = (index / Math.max(items.length - 1, 1)) * 100;
      const y = 100 - (Number(item?.value || 0) / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export function hasCustomAdminAvatar(path) {
  const clean = String(path || "").trim();
  return Boolean(clean && clean !== "default-avatar.png" && clean !== "/default-avatar.png");
}

export function buildAdminCompanyStats(company, reservations) {
  const companyCars = getAdminCompanyCars(company);
  const companyReservations = (reservations || []).filter(
    (reservation) => Number(reservation?.car?.company_id) === Number(company?.id)
  );

  return {
    reservations: companyReservations.length,
    activeReservations: companyReservations.filter((item) => item.status === "confirmed").length,
    pendingReservations: companyReservations.filter((item) => item.status === "pending").length,
    cars: companyCars.length,
  };
}

export function readAdminSupportThreads() {
  if (typeof window === "undefined") return [];

  const threads = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith("support-thread:")) continue;

    try {
      const value = JSON.parse(window.localStorage.getItem(key) || "[]");
      threads.push({
        key,
        role: key.includes(":company") ? "company" : "client",
        label: key.replace("support-thread:", ""),
        messages: Array.isArray(value)
          ? value.map((message, messageIndex) => ({
              ...message,
              id: message?.id ?? `${key}-${messageIndex}`,
              createdAt: message?.createdAt || message?.created_at || new Date().toISOString(),
            }))
          : [],
      });
    } catch {
      // ignore invalid data
    }
  }

  return threads.sort((left, right) => {
    const leftDate = new Date(left.messages.at(-1)?.createdAt || 0).getTime();
    const rightDate = new Date(right.messages.at(-1)?.createdAt || 0).getTime();
    return rightDate - leftDate;
  });
}

export function formatAdminThreadTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function getAdminThreadDisplayName(thread) {
  const firstUserMessage = thread?.messages?.find((message) => message.role !== "admin" && message.role !== "bot");
  if (firstUserMessage?.author) return firstUserMessage.author;
  return thread?.role === "company" ? "Entreprise" : "Client";
}

export function getAdminInitials(name) {
  return String(name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}
