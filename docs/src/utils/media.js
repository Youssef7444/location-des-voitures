import { resolveMediaUrl } from "../services/apiClient";
import autocarLogo from "../assets/autocar.webp";

const FALLBACK_CAR_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80";
const FALLBACK_COMPANY_LOGO = autocarLogo;

export function getCarMainImage(car) {
  const images = Array.isArray(car?.images) ? car.images : [];
  const mainImage = images.find((image) => image.is_main) || images[0];

  if (!mainImage) {
    return FALLBACK_CAR_IMAGE;
  }

  if (mainImage.image_url) {
    return mainImage.image_url;
  }

  if (mainImage.image_path) {
    return resolveMediaUrl(mainImage.image_path);
  }

  return FALLBACK_CAR_IMAGE;
}

export function getCompanyLogo(company) {
  if (!company) {
    return FALLBACK_COMPANY_LOGO;
  }

  if (company.logo_url) {
    return company.logo_url;
  }

  if (company.logo) {
    return resolveMediaUrl(company.logo);
  }

  return FALLBACK_COMPANY_LOGO;
}

export function formatPricePerDay(value) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return amount % 1 === 0 ? String(amount) : amount.toFixed(2);
}
