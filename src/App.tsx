import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
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

function App() {
  return (
    <ToastProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
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

            {/* Main Routes */}
            <Route path="/*" element={
              <>
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/rewards" element={<RewardsPage />} />
                  </Routes>
                </main>
                <Footer />
              </>
            } />

            {/* Protected Routes */}
            <Route path='/admin/dashboard' element={
              <ProtectedRoute requiredRole='admin'>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/merchant/dashboard" element={
              <ProtectedRoute requiredRole='merchant'>
                <MerchantDashboard />
              </ProtectedRoute>
            } />
            <Route path="/merchant/verify" element={
              <ProtectedRoute requiredRole='merchant'>
                <MerchantVerificationForm />
              </ProtectedRoute>
            } />
            <Route path="/merchant/add-service" element={
              <ProtectedRoute requiredRole='merchant'>
                <AddService />
              </ProtectedRoute>
            } />
            <Route path="/merchant/manage-services" element={
              <ProtectedRoute requiredRole='merchant'>
                <ManageService />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;