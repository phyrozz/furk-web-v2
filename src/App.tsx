import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastProvider } from './services/toast/ToastProvider';
import AuthWrapper from './components/AuthWrapper';
import BookingProgressTracker from './components/common/BookingProgressTracker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { GuideTooltipProvider } from './providers/GuideTooltip';
import { ScrollToHashElement } from './utils/scroll-to-hash-element';
import PageRoutes from './PageRoutes';

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
  const [userRole, setUserRole] = useState<string | null>(null);

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
          <ScrollToHashElement />
          <AuthWrapper onAuthStatusChange={(isAuthenticated, role) => {
            setIsAuthenticated(isAuthenticated);
            setUserRole(role);
          }}>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <PageRoutes isAuthenticated={isAuthenticated} userRole={userRole} />
            </div>
          </AuthWrapper>
          
        </Router>
        {/* <TokenExpiredDialog isOpen={isTokenExpired} onConfirm={handleConfirmRefresh} /> */}
      </ToastProvider>
    </GuideTooltipProvider>
  );
}

export default App;