import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import HomePage from './components/pages/Home/HomePage';
import ServicesPage from './components/pages/Services/ServicesPage';
import RewardsPage from './components/pages/Rewards/RewardsPage';
import LoginPage from './components/pages/Login/LoginPage';
import MerchantDashboard from './components/pages/Merchant/MerchantDashboard';
import SignUpPage from './components/pages/SignUp/SignUpPage';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPasswordPage from './components/pages/ResetPassword/ResetPasswordPage';
import PublicRoute from './components/PublicRoute';
import AdminPage from './components/pages/Admin/AdminPage';
import MerchantVerificationForm from './components/pages/Merchant/MerchantVerification/MerchantVerificationForm';
import AddService from './components/pages/Merchant/AddService/AddService';
import { ToastProvider } from './services/toast/ToastProvider';
import ManageService from './components/pages/Merchant/ManageService/ManageService';
import AuthWrapper from './components/AuthWrapper';
import ServiceDetails from './components/pages/Services/ServiceDetails';
import ProfilePage from './components/pages/Profile/ProfilePage';
import AdminProfilePage from './components/pages/Admin/AdminProfilePage';
import MerchantProfilePage from './components/pages/Merchant/MerchantProfilePage';
import MerchantDetailsPage from './components/pages/Merchant/MerchantDetails/MerchantDetailsPage';
import BookingCalendar from './components/pages/Merchant/BookingCalendar/BookingCalendar';
import TokenExpiredDialog from './components/common/TokenExpiredDialog';
import { eventEmitter } from './utils/event-emitter';
import { loginService } from './services/auth/auth-service';
import SetBusinessHoursPage from './components/pages/Merchant/SetBusinessHours/SetBusinessHoursPage';
import BookingProgressTracker from './components/common/BookingProgressTracker';
import TermsOfService from './components/pages/TermsOfService/TermsOfService';
import AffiliateLoginPage from './components/pages/Affiliate/LoginPage';
import AffiliateSignUpPage from './components/pages/Affiliate/SignupPage';
import AffiliateDashboard from './components/pages/Affiliate/AffiliateDashboard';
import AffiliatePage from './components/pages/Admin/AffiliatePage';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { GuideTooltipProvider } from './providers/GuideTooltip';
import PromosPage from './components/pages/Admin/PromosPage';

// Fix Leaflet's default icon path issues in bundlers like Vite/Vercel
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl: iconUrl,
  shadowUrl: iconShadow,
});


function App() {
  // const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // useEffect(() => {
  //   const handleTokenExpired = () => {
  //     setIsTokenExpired(true);
  //   };

  //   eventEmitter.on('tokenExpired', handleTokenExpired);

  //   // Periodically check token status
  //   const intervalId = setInterval(async () => {
  //     await loginService.isAuthenticated();
  //   }, 60 * 1000); // Check every 1 minute

  //   return () => {
  //     eventEmitter.off('tokenExpired', handleTokenExpired);
  //     clearInterval(intervalId);
  //   };
  // }, []);

  // const handleConfirmRefresh = () => {
  //   setIsTokenExpired(false);
  //   window.location.reload();
  // };

  return (
    <GuideTooltipProvider>
      <ToastProvider>
        <BookingProgressTracker isAuthenticated={isAuthenticated} />
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthWrapper onAuthStatusChange={setIsAuthenticated}>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path="/sign-up/merchant" element={
                  <PublicRoute>
                    <SignUpPage userType='merchant' />
                  </PublicRoute>
                } />
                <Route path="/sign-up/user" element={
                  <PublicRoute>
                    <SignUpPage userType='user' />
                  </PublicRoute>
                } />
                <Route path="/reset-password" element={
                  <PublicRoute>
                    <ResetPasswordPage />
                  </PublicRoute>
                } />
                <Route path="/affiliate/login" element={
                  <PublicRoute>
                    <AffiliateLoginPage />
                  </PublicRoute>
                } />
                <Route path="/affiliate/sign-up" element={
                  <PublicRoute>
                    <AffiliateSignUpPage />
                  </PublicRoute>
                } />
                <Route path="/terms-of-service" element={
                  <TermsOfService />
                } />

                {/* Main Routes */}
                <Route path="/*" element={
                  <>
                    <Navbar />
                    <main className="flex-grow">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/rewards" element={<RewardsPage />} />
                        <Route path="/services/:id" element={<ServiceDetails />} />
                        <Route path="/merchants/:id" element={<MerchantDetailsPage />} />
                      </Routes>
                    </main>
                  </>
                } />

                {/* Protected Routes */}
                <Route path='/admin/merchants' element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/affiliates" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <AffiliatePage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/promos" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <PromosPage />
                  </ProtectedRoute>
                } />
                {/* <Route path='/admin/profile' element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <AdminProfilePage />
                  </ProtectedRoute>
                } /> */}
                <Route path="/merchant/dashboard" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <MerchantDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/merchant/verify" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <MerchantVerificationForm />
                  </ProtectedRoute>
                } />
                <Route path="/merchant/add-service" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <AddService />
                  </ProtectedRoute>
                } />
                <Route path="/merchant/manage-services" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <ManageService />
                  </ProtectedRoute>
                } />
                <Route path="/merchant/bookings" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <BookingCalendar />
                  </ProtectedRoute>
                } />
                <Route path='/merchant/profile' element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <MerchantProfilePage />
                  </ProtectedRoute>
                } />
                <Route path='/merchant/business-hours' element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <SetBusinessHoursPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute requiredRoles={['user']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }></Route>
                <Route path="/affiliate/dashboard" element={
                  <ProtectedRoute requiredRoles={['affiliate']}>
                    <AffiliateDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </AuthWrapper>
          
        </Router>
        {/* <TokenExpiredDialog isOpen={isTokenExpired} onConfirm={handleConfirmRefresh} /> */}
      </ToastProvider>
    </GuideTooltipProvider>
  );
}

export default App;