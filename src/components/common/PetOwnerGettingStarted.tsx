import { ArrowRight, CalendarCheck, ChevronDown, PawPrint, Play, RotateCcw, Wallet } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePetOwnerTour } from '../../providers/PetOwnerTourContext';

function TourButton() {
  const { status, resume, restart } = usePetOwnerTour();
  const paused = status === 'paused';
  const Icon = paused ? Play : RotateCcw;
  const label = paused ? 'Continue tour' : status === 'completed' ? 'Replay tour' : 'Take the tour';
  return (
    <button type="button" data-pet-owner-tour-trigger aria-label={label} onClick={paused ? resume : restart} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary-300 bg-white px-3 py-2 text-sm font-bold text-primary-800 hover:bg-primary-50 sm:px-4">
      <Icon size={16} aria-hidden="true" /><span className="sm:hidden">{paused ? 'Continue' : status === 'completed' ? 'Replay' : 'Start tour'}</span><span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function GuideCard({ headingId, targetId, title, description, children, services = false }: {
  headingId: string;
  targetId?: string;
  title: string;
  description: string;
  children: ReactNode;
  services?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return (
    <section aria-labelledby={headingId} className={`${services ? 'mt-3 sm:mt-6' : 'mb-4 sm:mb-6'} rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-3 sm:p-6`}>
      <div id={targetId} className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          {!services && <p className="mb-1 hidden text-xs font-extrabold uppercase tracking-widest text-primary-700 sm:block">A good start for little paws</p>}
          <h2 id={headingId} className="text-sm font-extrabold text-gray-900 sm:text-xl"><span className="sm:hidden">Booking guide</span><span className="hidden sm:inline">{title}</span></h2>
          <p className="mt-2 hidden max-w-xl text-sm text-gray-600 sm:block">{description}</p>
        </div>
        <TourButton />
        <button type="button" aria-expanded={expanded} aria-controls={contentId} aria-label={`${expanded ? 'Hide' : 'Show'} booking setup steps`} onClick={() => setExpanded(value => !value)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-800 hover:bg-primary-100 sm:hidden">
          <ChevronDown size={20} aria-hidden="true" className={expanded ? 'rotate-180' : ''} />
        </button>
      </div>
      <div id={contentId} className={expanded ? 'mt-4' : 'mt-4 hidden sm:block'}>
        <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:hidden">{description}</p>
        {children}
      </div>
    </section>
  );
}

export function PetOwnerGettingStarted() {
  const items = [
    { icon: Wallet, title: 'Top up Furkredits', text: 'Fund your wallet before booking.', to: '/profile?tab=profile' },
    { icon: PawPrint, title: 'Add your pets', text: 'Save a profile for each companion.', to: '/profile?tab=pets' },
    { icon: CalendarCheck, title: 'Find a service', text: 'Choose their next appointment.', to: '/services' },
  ];
  return (
    <GuideCard headingId="pet-owner-start-heading" title="Your first booking, made simple" description="Top up first, introduce your pets, then find the care they need. You can return to this guide anytime.">
      <ol className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {items.map(({ icon: Icon, title, text, to }, index) => (
          <li key={title}>
            <Link to={to} className="group flex h-full min-h-20 items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-primary-400 sm:items-start sm:p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800"><Icon size={20} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-gray-800">{index + 1}. {title}</span><span className="mt-1 block text-xs leading-relaxed text-gray-600">{text}</span></span>
              <ArrowRight size={16} className="shrink-0 text-primary-700" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </GuideCard>
  );
}

export function PetOwnerBookingGuide() {
  return (
    <GuideCard services headingId="pet-owner-booking-heading" targetId="pet-owner-booking-guide" title="A little prep before you book" description="Furkredits pay for your service. Saved pet profiles make pet selection easy.">
      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/profile?tab=profile" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-200 bg-white px-4 text-sm font-bold text-primary-800 hover:border-primary-400"><Wallet size={16} aria-hidden="true" />Top up Furkredits<ArrowRight size={14} aria-hidden="true" /></Link>
        <Link to="/profile?tab=pets" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-200 bg-white px-4 text-sm font-bold text-primary-800 hover:border-primary-400"><PawPrint size={16} aria-hidden="true" />Add pet profiles<ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
      <details className="group border-t border-primary-200">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-bold text-primary-800">How booking works<ChevronDown size={18} aria-hidden="true" className="transition-transform group-open:rotate-180" /></summary>
      <ol className="grid gap-3 pb-2 pt-1 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
        {['Open a service and choose Book Now.', 'Select your pet(s), date, and an available time.', 'Review the Furkredits total and confirm your booking.', 'Follow its status in My Profile → Booking History.'].map((text, index) => (
          <li key={text} className="flex gap-2.5"><span className="font-extrabold text-primary-800" aria-hidden="true">0{index + 1}</span><span>{text}</span></li>
        ))}
      </ol>
      </details>
      <p className="mt-3 text-xs text-gray-600">Pet selection is required for pet-specific services. Some services do not require a pet.</p>
    </GuideCard>
  );
}
