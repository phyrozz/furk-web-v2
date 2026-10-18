import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceHero from './ServiceHero';
import ServicesList from './ServicesList';
import ServicesResult from './ServicesResult';
import Button from '../../common/Button';
import { ArrowLeft, X } from 'lucide-react';
import { PetServicesService } from '../../../services/pet-services/pet-services';

interface ServiceGroup {
  id: number;
  name: string;
}

interface ServicesPageProps {
  isPetOwner: boolean;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ isPetOwner }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const petServicesService = useMemo(() => new PetServicesService(), []);
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
  const [selectedServiceGroupId, setSelectedServiceGroupId] = useState<number>(
    searchParams.get('serviceGroup') ? parseInt(searchParams.get('serviceGroup') || '0', 10) : 0
  );
  const [isSearching, setIsSearching] = useState(isPetOwner || !!searchParams.get('search') || !!searchParams.get('serviceGroup'));
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [isLoadingServiceGroups, setIsLoadingServiceGroups] = useState(false);
  const [serviceGroupsError, setServiceGroupsError] = useState(false);

  const loadServiceGroups = useCallback(async () => {
    setIsLoadingServiceGroups(true);
    setServiceGroupsError(false);

    try {
      const response = await petServicesService.listServiceGroups();
      setServiceGroups(response.data || []);
    } catch (error) {
      console.error('Failed to load service categories:', error);
      setServiceGroupsError(true);
    } finally {
      setIsLoadingServiceGroups(false);
    }
  }, [petServicesService]);

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

  useEffect(() => {
    const serviceGroupParam = searchParams.get('serviceGroup');
    const serviceGroupId = serviceGroupParam ? Number.parseInt(serviceGroupParam, 10) : 0;
    setSelectedServiceGroupId(Number.isNaN(serviceGroupId) ? 0 : serviceGroupId);
  }, [searchParams]);

  useEffect(() => {
    if (isPetOwner) {
      void loadServiceGroups();
    }
  }, [isPetOwner, loadServiceGroups]);

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

  const handleCategoryFilter = (serviceGroupId: number) => {
    setSelectedServiceGroupId(serviceGroupId);
    setIsSearching(true);

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
            {isPetOwner && (
              <section className="mt-4 border-b border-gray-200 pb-4" aria-labelledby="service-category-filter-heading">
                <h2 id="service-category-filter-heading" className="mb-2 text-sm font-semibold text-gray-800">
                  Filter by category
                </h2>
                {isLoadingServiceGroups ? (
                  <p role="status" className="py-2 text-sm text-gray-600">Loading categories…</p>
                ) : serviceGroupsError ? (
                  <div role="alert" className="flex flex-wrap items-center gap-3 py-2 text-sm text-gray-700">
                    <span>Categories could not be loaded.</span>
                    <button type="button" onClick={() => void loadServiceGroups()} className="font-semibold text-primary-800 underline underline-offset-2">
                      Try again
                    </button>
                  </div>
                ) : (
                  <div role="group" aria-labelledby="service-category-filter-heading" className="flex gap-2 overflow-x-auto py-1 pb-2">
                    <button
                      type="button"
                      aria-pressed={selectedServiceGroupId === 0}
                      onClick={() => handleCategoryFilter(0)}
                      className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${
                        selectedServiceGroupId === 0
                          ? 'border-primary-800 bg-primary-800 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-primary-700 hover:text-primary-800'
                      }`}
                    >
                      All categories
                    </button>
                    {serviceGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        aria-pressed={selectedServiceGroupId === group.id}
                        onClick={() => handleCategoryFilter(group.id)}
                        className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${
                          selectedServiceGroupId === group.id
                            ? 'border-primary-800 bg-primary-800 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-700 hover:text-primary-800'
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
            <ServicesResult
              keyword={searchKeyword}
              serviceGroupId={selectedServiceGroupId}
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
