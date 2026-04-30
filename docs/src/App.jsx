import { Navigate, Route, Routes } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import AuthPage from "./pages/AuthPage";
import BookingPage from "./pages/BookingPage";
import CarDetailsPage from "./pages/CarDetailsPage";
import CompanyPage from "./pages/CompanyPage";
import CompaniesPage from "./pages/CompaniesPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ArchivesPage from "./pages/ArchivesPage";
import PartnerAuthPage from "./pages/PartnerAuthPage";
import PartnerCarsPage from "./pages/PartnerCarsPage";
import PartnerAddCarPage from "./pages/PartnerAddCarPage";
import PartnerBookingsPage from "./pages/PartnerBookingsPage";
import PartnerSettingsPage from "./pages/PartnerSettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/cars/:carId" element={<CarDetailsPage />} />
        <Route path="/booking/:carId" element={<BookingPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:companyId" element={<CompanyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/partner/auth" element={<PartnerAuthPage />} />
        <Route path="/partner/cars" element={<PartnerCarsPage />} />
        <Route path="/partner/cars/new" element={<PartnerAddCarPage />} />
        <Route path="/partner/bookings" element={<PartnerBookingsPage />} />
        <Route path="/partner/settings" element={<PartnerSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
