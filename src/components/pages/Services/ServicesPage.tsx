import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceHero from './ServiceHero';
import ServicesList from './ServicesList';
import ServicesResult from './ServicesResult';

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
  const [isSearching, setIsSearching] = useState(!!searchParams.get('search'));

  useEffect(() => {
    document.title = 'Core Services - FURK';
    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setIsSearching(!!keyword);
    if (keyword) {
      setSearchParams({ search: keyword });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="pt-16">
      <ServiceHero onSearch={handleSearch} />
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {isSearching ? (
          <ServicesResult keyword={searchKeyword} />
        ) : (
          <ServicesList />
        )}
      </div>
    </div>
  );
};

export default ServicesPage;