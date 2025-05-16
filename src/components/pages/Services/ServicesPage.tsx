import { useEffect } from 'react';
import ServicesList from './ServicesList';
import ServiceHero from './ServiceHero';

const ServicesPage = () => {
  useEffect(() => {
    // Update the page title when component mounts
    document.title = 'Core Services - FURK';
    
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
      <ServiceHero />
      <ServicesList />
    </div>
  );
};

export default ServicesPage;