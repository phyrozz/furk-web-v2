import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceHero from './ServiceHero';
import ServicesList from './ServicesList';
import ServicesResult from './ServicesResult';
import Button from '../../common/Button';
import { ArrowLeft, X } from 'lucide-react';

interface ServicesPageProps {
  isPetOwner: boolean;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ isPetOwner }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
  const [selectedServiceGroupId, setSelectedServiceGroupId] = useState<number>(
    searchParams.get('serviceGroup') ? parseInt(searchParams.get('serviceGroup') || '0', 10) : 0
  );
  const [isSearching, setIsSearching] = useState(isPetOwner || !!searchParams.get('search') || !!searchParams.get('serviceGroup'));

  useEffect(() => {
    document.title = 'Core Services - FURK';
    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  useEffect(() => {
    if (isPetOwner && !searchParams.get('search') && !searchParams.get('serviceGroup')) {
      setIsSearching(true);
    }
  }, [isPetOwner, searchParams]);

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setIsSearching(isPetOwner || !!keyword || !!selectedServiceGroupId);
    
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
    setIsSearching(isPetOwner || !!serviceGroupId || !!searchKeyword);

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
            {(!isPetOwner || searchKeyword.trim()) && (
              <div className="w-full flex flex-row justify-start items-center mt-4">
                <Button
                  variant="ghost"
                  icon={isPetOwner ? <X size={18} /> : <ArrowLeft size={18} />}
                  onClick={() => {
                    setIsSearching(isPetOwner);
                    setSearchKeyword('');
                    setSelectedServiceGroupId(0);
                    setSearchParams({});
                  }}
                >
                  {isPetOwner ? 'Clear search' : 'Back'}
                </Button>
              </div>
            )}
            <ServicesResult
              keyword={searchKeyword}
              serviceGroupId={isPetOwner ? 0 : selectedServiceGroupId}
              showAllCategories={isPetOwner || !selectedServiceGroupId}
            />
          </>
        ) : (
          <ServicesList onFindMerchant={handleFindMerchant} />
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
