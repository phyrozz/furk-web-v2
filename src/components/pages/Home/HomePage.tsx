import { useEffect } from 'react';
import HeroSection from './HeroSection';
import WhatsNewSection from './WhatsNewSection';
import WhyFurkSection from './WhyFurkSection';
import PartnerSection from './PartnerSection';
import { loginService } from '../../../services/auth/auth-service';
import Footer from '../../common/Footer';

const HomePage = () => {
  useEffect(() => {
    // Update the page title when component mounts
    document.title = 'FURK - Your One-Stop Shop for All Pet Needs';
    
    // Reset title when component unmounts
    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  return (
    <div className="pt-16">
      <HeroSection />
      <WhatsNewSection />
      <WhyFurkSection />
      { !loginService.isAuthenticated() && 
      <PartnerSection />}
      <Footer />
    </div>
  );
};

export default HomePage;