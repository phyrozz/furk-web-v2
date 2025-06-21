import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceHero from './ServiceHero';
import ServicesList from './ServicesList';
import ServicesResult from './ServicesResult';
import Button from '../../common/Button';
import { ArrowLeft } from 'lucide-react';

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
  const [selectedServiceGroupId, setSelectedServiceGroupId] = useState<number>(
    searchParams.get('serviceGroup') ? parseInt(searchParams.get('serviceGroup') || '0', 10) : 0
  );
  const [isSearching, setIsSearching] = useState(!!searchParams.get('search') || !!searchParams.get('serviceGroup'));

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
    setIsSearching(!!keyword || !!selectedServiceGroupId);
    
    const newParams = new URLSearchParams(searchParams);
    if (keyword) {
      newParams.set('search', keyword);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleFindMerchant = (serviceGroupId: number) => {
    setSelectedServiceGroupId(serviceGroupId);
    setIsSearching(!!serviceGroupId || !!searchKeyword);

    const newParams = new URLSearchParams(searchParams);
    if (serviceGroupId) {
      newParams.set('serviceGroup', serviceGroupId.toString());
    } else {
      newParams.delete('serviceGroup');
    }
    setSearchParams(newParams);
  };

  return (
    <div className="pt-16 cursor-default">
      <ServiceHero onSearch={handleSearch} />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
        {isSearching ? (
          <>
            <div className="w-full flex flex-row justify-start items-center mt-4">
              <Button
                variant="ghost"
                icon={<ArrowLeft size={18} />}
                onClick={() => {
                  setIsSearching(false);
                  setSearchKeyword('');
                  setSelectedServiceGroupId(0);
                  setSearchParams({});
                }}
              >
                Back
              </Button>
            </div>
            <ServicesResult keyword={searchKeyword} serviceGroupId={selectedServiceGroupId} />
          </>
        ) : (
          <ServicesList onFindMerchant={handleFindMerchant} />
        )}
      </div>
    </div>
  );
};

export default ServicesPage;