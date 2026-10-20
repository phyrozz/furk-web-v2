import { useState } from 'react';
import { Search } from 'lucide-react';
import Button from '../../common/Button';

interface ServiceHeroProps {
  onSearch: (keyword: string) => void;
}

const ServiceHero: React.FC<ServiceHeroProps> = ({ onSearch }) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  return (
    <section className="border-b border-primary-100 bg-primary-50/60 pb-3 pt-4 sm:py-10 md:py-14">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* <p className="furk-eyebrow">Care for every companion</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Pet Services</h1>
          <p className="text-base md:text-lg text-gray-600 mb-7">
            Discover and book the best services for your beloved pets
          </p> */}

          <form id="pet-owner-service-search" role="search" onSubmit={handleSubmit} className="furk-panel p-2 max-w-2xl mx-auto">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-grow">
                <label htmlFor="service-search" className="sr-only">Search for services</label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Search size={20} />
                </div>
                <input
                  id="service-search"
                  type="search"
                  className="block min-h-12 w-full pl-10 pr-3 py-3 border-0 rounded-xl text-gray-900 placeholder:text-gray-500"
                  placeholder="Search for services..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              {/* <div className="hidden md:flex items-center border-l border-gray-200 ml-2 pl-2">
                <Filter size={20} className="text-gray-500 mr-2" />
                <select className="border-0 py-3 text-gray-700 focus:ring-0 focus:outline-none">
                  <option value="">All Categories</option>
                  <option value="grooming">Grooming</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="boarding">Boarding</option>
                  <option value="training">Training</option>
                </select>
              </div> */}
              <Button
                type="submit"
                size="lg"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ServiceHero;
