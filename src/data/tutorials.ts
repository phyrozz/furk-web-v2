export type TutorialAudience = 'pet-owner' | 'merchant';

export type TutorialId =
  | 'book-service'
  | 'add-pet'
  | 'top-up-furkredits'
  | 'furkoins-and-rewards'
  | 'track-booking'
  | 'message-merchant'
  | 'merchant-verification'
  | 'manage-services'
  | 'business-hours'
  | 'manage-bookings'
  | 'merchant-profile'
  | 'merchant-earnings';

export interface Tutorial {
  id: TutorialId;
  audience: TutorialAudience;
  title: string;
  description: string;
  steps: string[];
  tip?: string;
  relatedPaths: string[];
  action: { label: string; to: string };
}

// Add a filename only after the recording is uploaded and ready to watch.
// Paths are relative to the existing VITE_CDN_URL/tutorials/ directory.
export const tutorialVideoFiles: Partial<Record<TutorialId, string>> = {
  'book-service': 'pet-owner/book-service.mp4',
  'add-pet': 'pet-owner/add-pet.mp4',
  'top-up-furkredits': 'pet-owner/top-up-furkredits.mp4',
  // 'furkoins-and-rewards': 'pet-owner/furkoins-and-rewards.mp4',
  // 'track-booking': 'pet-owner/track-booking.mp4',
  // 'message-merchant': 'pet-owner/message-merchant.mp4',
  // 'merchant-verification': 'merchant/merchant-verification.mp4',
  'manage-services': 'merchant/manage-services.mp4',
  'business-hours': 'merchant/business-hours.mp4',
  'manage-bookings': 'merchant/manage-bookings.mp4',
  // 'merchant-profile': 'merchant/merchant-profile.mp4',
  // 'merchant-earnings': 'merchant/merchant-earnings.mp4',
};

export const tutorials: Tutorial[] = [
  {
    id: 'book-service',
    audience: 'pet-owner',
    title: 'Book a pet service',
    description: 'Choose a service and find a time slot that works for you.',
    steps: [
      'Sign in as a pet owner, then top up Furkredits in My Profile so your balance covers the booking total. Add your pets in My Profile → My Pets for services that require pet selection.',
      'Open Services. Choose a service to see its details and price.',
      'Select Book Now. Choose your pet if the service requires one; add a pet in My Profile → My Pets first if needed.',
      'Choose an available date and time slot, then review the booking total in Furkredits. Apply a coupon if you have one.',
      'Select Confirm Booking, then open My Profile → Booking History to follow its status.',
    ],
    tip: 'Check your Furkredits balance before booking. Available time slots depend on the merchant’s schedule.',
    relatedPaths: ['/services', '/merchants'],
    action: { label: 'Browse services', to: '/services' },
  },
  {
    id: 'add-pet',
    audience: 'pet-owner',
    title: 'Add a pet profile',
    description: 'Introduce your pet so you can select them when booking.',
    steps: [
      'Open My Profile and select the My Pets tab.',
      'Select Add Pet and enter your pet’s name, species, breed, and other requested details.',
      'Add a photo and useful notes, then save the profile.',
      'Your pet will appear in My Pets. Use the edit button whenever their details change.',
    ],
    relatedPaths: ['/profile'],
    action: { label: 'Open my profile', to: '/profile' },
  },
  {
    id: 'top-up-furkredits',
    audience: 'pet-owner',
    title: 'Top up Furkredits',
    description: 'Add funds to your wallet for service bookings.',
    steps: [
      'Open My Profile and find your wallet. On mobile, select the Profile tab to see it.',
      'Select Top up and enter the amount you want to add.',
      'Review the Furkredits amount shown, then continue to the payment checkout.',
      'Complete the payment and return to FURK. Check your wallet balance and Transaction History.',
    ],
    tip: 'Furkredits pay for services. Furkoins are a separate rewards currency.',
    relatedPaths: ['/profile'],
    action: { label: 'Open my profile', to: '/profile' },
  },
  {
    id: 'furkoins-and-rewards',
    audience: 'pet-owner',
    title: 'Furkoins & rewards',
    description: 'Understand your rewards balance and what Furkoins are for.',
    steps: [
      'Open My Profile to check your Furkoins balance beside your Furkredits.',
      'Select Reward Tiers to see your membership tier and its benefits.',
      'Furkoins are intended for merchandise rewards; use Furkredits when paying for service bookings.',
    ],
    tip: 'In-app Furkoin redemption is not available yet. You can check your balance and reward tier now.',
    relatedPaths: ['/rewards', '/profile'],
    action: { label: 'Open my profile', to: '/profile' },
  },
  {
    id: 'track-booking',
    audience: 'pet-owner',
    title: 'Track a booking & find your QR',
    description: 'Check your appointment and prepare your QR for the merchant.',
    steps: [
      'Open My Profile → Booking History to see your bookings.',
      'Check the service, scheduled time, and current status of your appointment.',
      'For a service that requires a pet, open My Pets and use the QR button on that pet’s profile.',
      'For a service that does not require a pet, use Pet Owner QR in the Profile tab. Show the appropriate QR to the merchant when requested.',
    ],
    relatedPaths: ['/profile'],
    action: { label: 'Open my profile', to: '/profile' },
  },
  {
    id: 'message-merchant',
    audience: 'pet-owner',
    title: 'Message a merchant',
    description: 'Ask about a service and keep your conversation in FURK.',
    steps: [
      'Sign in and open the service you want to ask about.',
      'Select Message Merchant to start or reopen your conversation.',
      'Type your question and send it. Include the service and appointment time when asking about a booking.',
      'Return to Messages or use the floating chat button to read replies.',
    ],
    relatedPaths: ['/services', '/merchants'],
    action: { label: 'Find a service', to: '/services' },
  },
  {
    id: 'merchant-verification',
    audience: 'merchant',
    title: 'Submit merchant verification',
    description: 'Prepare your merchant details and submit them for review.',
    steps: [
      'Open Merchant Verification from your merchant account.',
      'Complete the business details and address requested for your merchant type.',
      'Upload the documents requested by the form and check that the information is correct.',
      'Select Submit for Verification and follow the application status shown in your account.',
    ],
    relatedPaths: ['/merchant/verify', '/merchant/dashboard'],
    action: { label: 'Open verification', to: '/merchant/verify' },
  },
  {
    id: 'manage-services',
    audience: 'merchant',
    title: 'Add & edit a service',
    description: 'Create a service listing with clear pricing and details.',
    steps: [
      'From your dashboard, select Add New Service.',
      'Enter the service name, choose a category, and describe what the service includes.',
      'Set the price and duration, review the pet requirement, and add service images.',
      'Select Add Service. To update a listing later, open Manage Services and choose the service to edit.',
    ],
    relatedPaths: ['/merchant/add-service', '/merchant/manage-services', '/merchant/edit-service', '/merchant/service-categories'],
    action: { label: 'Manage services', to: '/merchant/manage-services' },
  },
  {
    id: 'business-hours',
    audience: 'merchant',
    title: 'Set business & break hours',
    description: 'Keep your booking availability aligned with your schedule.',
    steps: [
      'Open your merchant Profile → Business Hours and select the edit button.',
      'Set the opening and closing times for each working day, checking AM and PM carefully. Clear times for days you are closed.',
      'Save your business hours, then open Profile → Break Hours and select the edit button.',
      'Add the start and end time of each break on the relevant day and save your changes.',
    ],
    tip: 'Review both business hours and breaks when changing your availability.',
    relatedPaths: ['/merchant/business-hours', '/merchant/break-hours', '/merchant/profile'],
    action: { label: 'Set business hours', to: '/merchant/business-hours' },
  },
  {
    id: 'manage-bookings',
    audience: 'merchant',
    title: 'Manage a booking from start to finish',
    description: 'Review appointments, confirm arrivals, and complete services.',
    steps: [
      'Open Bookings and select an appointment to review the customer, pet, and service details.',
      'For a pending appointment, use Confirm Booking, or use Scan Booking QR with the appropriate pet or pet-owner QR.',
      'When the booking is confirmed and the service is ready to begin, select Start Service.',
      'After finishing the service, select Complete Service. Review each confirmation carefully before continuing.',
    ],
    tip: 'The available actions depend on the booking’s current status. Use Messages to coordinate with the pet owner.',
    relatedPaths: ['/merchant/bookings', '/merchant/dashboard'],
    action: { label: 'Open bookings', to: '/merchant/bookings' },
  },
  {
    id: 'merchant-profile',
    audience: 'merchant',
    title: 'Update your merchant profile',
    description: 'Help pet owners recognize and contact your business.',
    steps: [
      'Open your merchant Profile after submitting your verification details.',
      'Use the edit controls to update the available business and contact details.',
      'Review your profile information and save your changes.',
      'Use the Business Hours and Break Hours tabs to keep your availability up to date too.',
    ],
    relatedPaths: ['/merchant/profile'],
    action: { label: 'Open merchant profile', to: '/merchant/profile' },
  },
  {
    id: 'merchant-earnings',
    audience: 'merchant',
    title: 'Check your earnings',
    description: 'Find your monthly earnings and service earning records.',
    steps: [
      'Open Payouts from your merchant navigation.',
      'Choose the month you want to review and check Monthly Earnings.',
      'Use search to find a record and review the earning date, service, and amount.',
      'Select the linked service if you need to check its listing.',
    ],
    relatedPaths: ['/merchant/payouts', '/merchant/dashboard'],
    action: { label: 'View earnings', to: '/merchant/payouts' },
  },
];

export const getTutorialsForAudience = (audience: TutorialAudience): Tutorial[] =>
  tutorials.filter((tutorial) => tutorial.audience === audience);

const matchesPath = (pathname: string, path: string): boolean =>
  pathname === path || pathname.startsWith(`${path}/`);

export const getTutorialAudienceForPage = (
  pathname: string,
  isAuthenticated: boolean,
  userRole: string | null,
): TutorialAudience | null => {
  if (isAuthenticated && userRole !== 'user' && userRole !== 'merchant') return null;
  const audience = isAuthenticated && userRole === 'merchant' ? 'merchant' : 'pet-owner';
  const isPublicTutorialPage = pathname === '/' ||
    ['/services', '/merchants', '/profile', '/rewards', '/help'].some((path) => matchesPath(pathname, path));
  const isMerchantTutorialPage = audience === 'merchant' && pathname.startsWith('/merchant/') &&
    !matchesPath(pathname, '/merchant/chat');
  return isPublicTutorialPage || isMerchantTutorialPage ? audience : null;
};

export const getSuggestedTutorials = (audience: TutorialAudience, pathname: string): Tutorial[] => {
  const matchesPage = (tutorial: Tutorial) => tutorial.relatedPaths.some((path) => matchesPath(pathname, path));
  const available = getTutorialsForAudience(audience);
  return [...available.filter(matchesPage), ...available.filter((tutorial) => !matchesPage(tutorial))].slice(0, 3);
};

export const getTutorialVideoUrl = (id: TutorialId, cdnUrl: string | undefined): string | undefined => {
  const file = tutorialVideoFiles[id];
  if (!file || !cdnUrl?.trim()) return undefined;
  return `${cdnUrl.trim().replace(/\/+$/, '')}/tutorials/${file.split('/').map(encodeURIComponent).join('/')}`;
};
