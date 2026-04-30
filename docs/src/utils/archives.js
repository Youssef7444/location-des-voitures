const ARCHIVE_KEY_PREFIX = "saved_cars_";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCarSnapshot(car) {
  return {
    id: toNumber(car?.id),
    brand: String(car?.brand || ""),
    model: String(car?.model || ""),
    price_per_day: toNumber(car?.price_per_day),
    fuel_type: String(car?.fuel_type || ""),
    transmission: String(car?.transmission || ""),
    seats: toNumber(car?.seats),
    year: toNumber(car?.year),
    color: String(car?.color || ""),
    company: car?.company
      ? {
          id: toNumber(car.company.id),
          name: String(car.company.name || ""),
          logo: car.company.logo || null,
          city: String(car.company.city || ""),
          address: String(car.company.address || ""),
        }
      : null,
    images: Array.isArray(car?.images)
      ? car.images.map((image) => ({
          id: toNumber(image?.id),
          image_path: image?.image_path || "",
          is_main: Boolean(image?.is_main),
        }))
      : [],
    saved_at: new Date().toISOString(),
  };
}

function getArchiveStorageKey(userId) {
  return `${ARCHIVE_KEY_PREFIX}${userId || "guest"}`;
}

export function loadArchivedCars(userId) {
  const key = getArchiveStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveArchivedCars(userId, cars) {
  const key = getArchiveStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(cars));
}

export function isCarArchived(carId, userId) {
  const target = toNumber(carId);
  return loadArchivedCars(userId).some((car) => toNumber(car?.id) === target);
}

export function addCarToArchives(car, userId) {
  const snapshot = normalizeCarSnapshot(car);
  if (!snapshot.id) {
    return { added: false, cars: loadArchivedCars(userId) };
  }

  const current = loadArchivedCars(userId);
  const alreadyExists = current.some((item) => toNumber(item?.id) === snapshot.id);
  if (alreadyExists) {
    return { added: false, cars: current };
  }

  const next = [snapshot, ...current];
  saveArchivedCars(userId, next);
  return { added: true, cars: next };
}

export function removeCarFromArchives(carId, userId) {
  const target = toNumber(carId);
  const current = loadArchivedCars(userId);
  const next = current.filter((item) => toNumber(item?.id) !== target);
  saveArchivedCars(userId, next);
  return next;
}
