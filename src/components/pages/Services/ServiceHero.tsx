import { Search, Filter } from 'lucide-react';

const ServiceHero = () => {
  return (
    <section className="bg-primary-600 text-white py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Core Pet Services</h1>
          <p className="text-xl opacity-90 mb-8">
            Discover and book the best services for your beloved pets
          </p>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-lg shadow-lg max-w-3xl mx-auto">
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border-0 focus:ring-0 focus:outline-none rounded-lg text-gray-800"
                  placeholder="Search for services..."
                />
              </div>
              <div className="hidden md:flex items-center border-l border-gray-200 ml-2 pl-2">
                <Filter size={20} className="text-gray-500 mr-2" />
                <select className="border-0 py-3 text-gray-700 focus:ring-0 focus:outline-none">
                  <option value="">All Categories</option>
                  <option value="grooming">Grooming</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="boarding">Boarding</option>
                  <option value="training">Training</option>
                </select>
              </div>
              <button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-6 rounded-lg ml-2 transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceHero;