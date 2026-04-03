import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { loginService } from './services/auth/auth-service';
import MiniChatWidget from './components/pages/Chat/MiniChatWidget';
import Navbar from './components/common/Navbar';
import MerchantNavbar from './components/common/MerchantNavbar';
import AdminNavbar from './components/common/AdminNavbar';
import AffiliateNavbar from './components/common/AffiliateNavbar';
import AdminDashboardPage from './components/pages/Admin/AdminDashboardPage';
import AdminPage from './components/pages/Admin/AdminPage';
import AffiliatePage from './components/pages/Admin/AffiliatePage';
import PromosPage from './components/pages/Admin/PromosPage';
import RewardProductsPage from './components/pages/Admin/RewardProductsPage';
import AdminPayoutsPage from './components/pages/Admin/Payouts/AdminPayoutsPage';
import AffiliateDashboard from './components/pages/Affiliate/AffiliateDashboard';
import AffiliateLoginPage from './components/pages/Affiliate/LoginPage';
import AffiliateSignUpPage from './components/pages/Affiliate/SignupPage';
import ChatPage from './components/pages/Chat/ChatPage';
import HomePage from './components/pages/Home/HomePage';
import LoginPage from './components/pages/Login/LoginPage';
import AddService from './components/pages/Merchant/AddService/AddService';
import BookingCalendar from './components/pages/Merchant/BookingCalendar/BookingCalendar';
import ManageService from './components/pages/Merchant/ManageService/ManageService';
import MerchantDashboard from './components/pages/Merchant/MerchantDashboard';
import MerchantDetailsPage from './components/pages/Merchant/MerchantDetails/MerchantDetailsPage';
import MerchantProfilePage from './components/pages/Merchant/MerchantProfilePage';
import MerchantVerificationForm from './components/pages/Merchant/MerchantVerification/MerchantVerificationForm';
import PayoutsPage from './components/pages/Merchant/Payouts/PayoutsPage';
import ServiceCategoriesPage from './components/pages/Merchant/ServiceCategories/ServiceCategoriesPage';
import SetBreakHoursPage from './components/pages/Merchant/SetBreakHours/SetBreakHoursPage';
import SetBusinessHoursPage from './components/pages/Merchant/SetBusinessHours/SetBusinessHoursPage';
import PaymentCancelledPage from './components/pages/Payment/PaymentCancelledPage';
import PaymentFailedPage from './components/pages/Payment/PaymentFailedPage';
import PaymentPage from './components/pages/Payment/PaymentPage';
import PaymentSuccessPage from './components/pages/Payment/PaymentSuccessPage';
import ProfilePage from './components/pages/Profile/ProfilePage';
import ResetPasswordPage from './components/pages/ResetPassword/ResetPasswordPage';
import RewardsPage from './components/pages/Rewards/RewardsPage';
import MerchantsPage from './components/pages/Merchants/MerchantsPage';
import ServiceDetails from './components/pages/Services/ServiceDetails';
import ServicesPage from './components/pages/Services/ServicesPage';
import SignUpPage from './components/pages/SignUp/SignUpPage';
import TermsOfService from './components/pages/TermsOfService/TermsOfService';
import HelpPage from './components/pages/Help/HelpPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import RoleRedirect from './components/RoleRedirect';
import EditService from './components/pages/Merchant/EditService/EditService';

function PageRoutes({ isAuthenticated, userRole }: { isAuthenticated: boolean, userRole: string | null }) {
  const location = useLocation();
  const merchantStatus = localStorage.getItem('merchantStatus');
  const canAccessMerchantProfile = merchantStatus && merchantStatus !== 'unverified';

  const isChatPage =
    location.pathname === '/chat' || location.pathname === '/merchant/chat';

  const renderTopNavbar = () => {
    if (!isAuthenticated) {
      return <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />;
    }

    switch (userRole) {
      case 'merchant':
        return <MerchantNavbar />;
      case 'admin':
        return <AdminNavbar />;
      case 'affiliate':
        return <AffiliateNavbar />;
      default:
        return <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />;
    }
  };

  return (
    <>
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
            {renderTopNavbar()}
            <main className="flex-grow">
              <Routes>
                {/* redirect logic for root */}
                <Route path="/" element={
                  isAuthenticated ? <RoleRedirect /> : <HomePage />
                } />

                <Route path="/services" element={<ServicesPage />} />
                <Route path="/merchants" element={<MerchantsPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/services/:id" element={<ServiceDetails />} />
                <Route path="/merchants/:id" element={<MerchantDetailsPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Routes>
            </main>
          </>
        } />

        {/* Protected Routes */}
        <Route path='/admin/dashboard' element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
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
        <Route path="/admin/reward-products" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <RewardProductsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/payouts" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminPayoutsPage />
          </ProtectedRoute>
        } />
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
        <Route path="/merchant/edit-service/:id" element={
          <ProtectedRoute requiredRoles={['merchant']}>
            <EditService />
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
            {canAccessMerchantProfile ? <MerchantProfilePage /> : <Navigate to="/merchant/verify" replace />}
          </ProtectedRoute>
        } />
        <Route path='/merchant/payouts' element={
          <ProtectedRoute requiredRoles={['merchant']}>
            <PayoutsPage />
          </ProtectedRoute>
        } />
        <Route path='/merchant/business-hours' element={
          <ProtectedRoute requiredRoles={['merchant']}>
            <SetBusinessHoursPage />
          </ProtectedRoute>
        } />
        <Route path="/merchant/break-hours" element={
          <ProtectedRoute requiredRoles={['merchant']}>
            <SetBreakHoursPage />
          </ProtectedRoute>
        } />
        <Route path="/merchant/service-categories" element={
          <ProtectedRoute requiredRoles={['merchant']}>
            <ServiceCategoriesPage />
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
        <Route path="/payment" element={
          <ProtectedRoute requiredRoles={['user', 'merchant']}>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="/payment/success" element={
          <ProtectedRoute requiredRoles={['user', 'merchant']}>
            <PaymentSuccessPage />
          </ProtectedRoute>
        } />
        <Route path="/payment/cancelled" element={
          <ProtectedRoute requiredRoles={['user', 'merchant']}>
            <PaymentCancelledPage />
          </ProtectedRoute>
        } />
        <Route path="/payment/failed" element={
          <ProtectedRoute requiredRoles={['user', 'merchant']}>
            <PaymentFailedPage />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute requiredRoles={['user']}>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/merchant/chat" element={
          <ProtectedRoute requiredRoles={['merchant']}>
            <ChatPage />
          </ProtectedRoute>
        } />
      </Routes>

      {isAuthenticated && (userRole === 'user' || userRole === 'merchant') && !isChatPage && (
        <MiniChatWidget />
      )}
    </>
  );
}

export default PageRoutes;
