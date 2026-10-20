interface PetOwnerTourStep {
  title: string;
  description: string;
  targetId?: string;
  mobileTargetId?: string;
  route?: string;
  items: readonly string[];
  note: string;
  nextLabel: string;
  action?: { targetId: string; label: string };
}

export const petOwnerTourSteps: readonly PetOwnerTourStep[] = [
  {
    title: 'Your first booking starts here',
    description: 'Welcome to FURK! Let’s get you and your pets ready for their first appointment.',
    targetId: undefined,
    route: undefined,
    items: ['Top up Furkredits to pay for services.', 'Add your pets so you can select them when booking.', 'Find a service, choose a time, and review your booking.'],
    note: 'Take this at your own pace. You can pause and continue from your profile or Services.',
    nextLabel: 'Show me around',
  },
  {
    title: 'Furkredits first, then booking',
    description: 'You must top up your Furkredits before you can confirm a paid service booking. Your balance needs to cover the full booking total.',
    targetId: 'pet-owner-wallet',
    mobileTargetId: 'pet-owner-top-up',
    route: '/profile?tab=profile',
    items: ['In My Profile, choose Top up beside your wallet.', 'Enter an amount, review the Furkredits you’ll receive, then continue to payment.', 'After successful payment, return and check your Furkredits balance.'],
    note: 'Furkoins are rewards. They cannot pay for service bookings.',
    nextLabel: 'Next: pet profiles',
    action: { targetId: 'pet-owner-top-up', label: 'Top up now' },
  },
  {
    title: 'A profile for every companion',
    description: 'My Profile → My Pets is where your pets live. Add a profile for each pet you want to book a pet-specific service for.',
    targetId: 'nav-tab-pets',
    route: '/profile?tab=pets',
    items: ['Choose My Pets to see and manage their profiles.', 'Keep each pet’s details up to date for your service provider.'],
    note: 'A saved pet profile is required when a service asks you to select a pet.',
    nextLabel: 'Show me Add Pet',
  },
  {
    title: 'Meet the Add Pet button',
    description: 'Choose Add Pet to create a profile. Add all the pets you’ll bring so you can select the right ones when booking.',
    targetId: 'pet-owner-add-pet',
    route: '/profile?tab=pets',
    items: ['Upload a pet photo and fill in the requested pet details.', 'Add helpful care notes, then save the profile.', 'Repeat for your other pets. You can edit their profiles later.'],
    note: 'Want to do this now? The tour will pause while you add your pet. Continue it from the guide on your profile.',
    nextLabel: 'Next: find a service',
    action: { targetId: 'pet-owner-add-pet', label: 'Add a pet now' },
  },
  {
    title: 'Discover the right service',
    description: 'This is Services. Search for the care you need, or use the category filters to narrow your choices.',
    targetId: 'pet-owner-service-search',
    mobileTargetId: 'service-search',
    route: '/services',
    items: ['Search by a service name or select a category.', 'Open a service card to see its details, merchant, and Furkredits price.', 'Check that your wallet covers the total for your selected pets.'],
    note: 'You can return to Services anytime from the main navigation.',
    nextLabel: 'How do I book?',
  },
  {
    title: 'From service to scheduled care',
    description: 'Open a service you like and choose Book Now on its details page. Then follow these steps:',
    targetId: 'pet-owner-booking-guide',
    mobileTargetId: 'pet-owner-booking-heading',
    route: '/services',
    items: ['Choose your pet(s) if required, plus an available date and time.', 'Review your pets, schedule, and total in Furkredits.', 'Choose Confirm booking when everything looks right. Track it in My Profile → Booking History.'],
    note: 'Remember: top up first and save your pet profiles. You can explore now and complete these before booking.',
    nextLabel: 'Explore services',
  },
] as const;
