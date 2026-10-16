import { useEffect } from 'react';
import HeroSection from './HeroSection';
import PopularServices from './PopularServices';
import WalletBasicsSection from './WalletBasicsSection';
import WhatsNewSection from './WhatsNewSection';
import WhyFurkSection from './WhyFurkSection';
import PartnerSection from './PartnerSection';
import Footer from '../../common/Footer';
import HiddenPreviewDrawer from './HiddenPreviewDrawer';
import Reveal from '../../common/Reveal';

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
    <div className="pt-16 cursor-default">
      <HeroSection />
      <PopularServices />
      <Reveal><WalletBasicsSection /></Reveal>
      <Reveal><WhatsNewSection /></Reveal>
      <Reveal><WhyFurkSection /></Reveal>
      <Reveal><PartnerSection /></Reveal>
      <Footer />
      <HiddenPreviewDrawer />
    </div>
  );
};

export default HomePage;
