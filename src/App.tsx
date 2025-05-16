import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './components/pages/Home/HomePage';
import ServicesPage from './components/pages/Services/ServicesPage';
import RewardsPage from './components/pages/Rewards/RewardsPage';
import LoginPage from './components/pages/Login/LoginPage';
import MerchantDashboard from './components/pages/Merchant/MerchantDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route
            path="/*"
            element={
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
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;