import { ArrowRight, PawPrint, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../../common/Button';

const HERO_IMAGE_URL = 'https://images.pexels.com/photos/46024/pexels-photo-46024.jpeg';

const HeroSection = () => {
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/services?search=' + encodeURIComponent(searchInput.trim()));
  };

  return (
    <section className="overflow-hidden border-b border-primary-100 bg-primary-50">
      <div className="container mx-auto grid items-center gap-10 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="furk-eyebrow mb-5 flex items-center gap-2">
            <PawPrint size={16} aria-hidden="true" />
            For pets. For their people.
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-primary-900 sm:text-5xl xl:text-6xl">
            Your All-in-One Pet Services Platform
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
            Find and book the best pet services in the Philippines, from grooming to healthcare, all in one place.
          </p>
          <form onSubmit={handleSubmit} role="search" className="mt-8 rounded-2xl border border-primary-200 bg-white p-2 shadow-md">
            <label htmlFor="home-service-search" className="sr-only">Search for pet services</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" aria-hidden="true" />
                <input
                  id="home-service-search"
                  type="search"
                  className="min-h-12 w-full rounded-xl border-0 bg-transparent py-3 pl-10 pr-3 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Search for pet services..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg">Search</Button>
            </div>
          </form>
          <Link to="/services" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-primary-700 hover:text-primary-900">
            Explore Services <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <figure className="relative isolate m-0 min-w-0">
          <div className="absolute -right-5 -top-5 -z-10 h-2/3 w-2/3 rounded-full bg-primary-100" aria-hidden="true" />
          <img
            src={HERO_IMAGE_URL}
            alt="A dog enjoying the outdoors"
            className="h-72 w-full rounded-[2rem] bg-primary-100 object-cover sm:h-96 lg:h-[500px]"
          />
          <figcaption className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-sm backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700" aria-hidden="true"><PawPrint size={22} /></span>
            <span>
              <span className="block font-bold text-gray-900">Good care. Happy companions.</span>
              <span className="mt-0.5 block text-sm text-gray-600">A little love for every part of their day.</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
};

export default HeroSection;
