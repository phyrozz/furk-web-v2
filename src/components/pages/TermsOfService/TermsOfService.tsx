import { ScrollText } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from '../../common/Footer';
import Navbar from '../../common/Navbar';

type Audience = 'pet-owner' | 'merchant' | 'affiliate';

const AUDIENCE_OPTIONS: Array<{ value: Audience; label: string }> = [
  { value: 'pet-owner', label: 'Pet Owner' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'affiliate', label: 'Affiliate' },
];

const TermsOfService = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const audienceParam = searchParams.get('audience');
  const selectedAudience = (audienceParam && AUDIENCE_OPTIONS.some((o) => o.value === audienceParam))
    ? (audienceParam as Audience)
    : null;

  const title = useMemo(() => {
    if (!selectedAudience) return 'Terms and Conditions';
    return `${AUDIENCE_OPTIONS.find((o) => o.value === selectedAudience)?.label} Terms and Conditions`;
  }, [selectedAudience]);

  const setAudience = (audience: Audience | null) => {
    if (!audience) {
      setSearchParams({});
      return;
    }
    setSearchParams({ audience });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto mt-20 px-4 py-8">
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex items-center gap-2 mb-2">
            <ScrollText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
          <p className="text-gray-600 mb-6">Effective Date: July 1, 2025</p>

          <div className="flex flex-wrap gap-2 mb-6">
            <button className={`px-3 py-1 rounded border ${selectedAudience === null ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`} onClick={() => setAudience(null)}>
              All
            </button>
            {AUDIENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`px-3 py-1 rounded border ${selectedAudience === option.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                onClick={() => setAudience(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl font-semibold mt-6">1. Acceptance of Terms</h2>
            <p>By creating an account, accessing, or using Furk, you acknowledge that you have read, understood, and agreed to these Terms and our Data Privacy provisions.</p>

            <h2 className="text-xl font-semibold mt-6">2. Eligibility and Account Responsibility</h2>
            <p>You must be at least 18 years old and provide accurate information. You are responsible for your account credentials and all activity under your account.</p>

            {(!selectedAudience || selectedAudience === 'pet-owner') && (
              <>
                <h2 className="text-xl font-semibold mt-6">3. Pet Owner Terms</h2>
                <p>Pet Owners may browse and request services from Merchants. Once a booking is confirmed, service fulfillment is directly between Pet Owner and Merchant.</p>
                <p>Pet Owners are charged based on the booking details shown at checkout. Refunds and cancellations follow platform and merchant policies, and may depend on booking status.</p>
              </>
            )}

            {(!selectedAudience || selectedAudience === 'merchant') && (
              <>
                <h2 className="text-xl font-semibold mt-6">4. Merchant Terms</h2>
                <p>Merchants are responsible for service quality, schedule accuracy, and communication with customers.</p>
                <p>
                  By joining Furk, Merchant agrees to the <strong>agreed platform fee rate (%)</strong> defined in the Merchant agreement and platform policies.
                  Merchant fees are currently waived unless otherwise stated in a signed agreement or official platform notice.
                </p>
                <p>Any disputes, complaints, abuse, or policy violations may affect payout eligibility and account status.</p>
              </>
            )}

            {(!selectedAudience || selectedAudience === 'affiliate') && (
              <>
                <h2 className="text-xl font-semibold mt-6">5. Affiliate Terms</h2>
                <p>Affiliates must provide complete and truthful information, including valid payout details and required verification documents.</p>
                <p>Commissions, eligibility conditions, and payout schedules follow Furk Affiliate Program rules and may be adjusted with prior notice.</p>
                <p>Spam, deceptive promotion, false claims, or misuse of referral mechanisms are prohibited and may result in suspension or termination.</p>
              </>
            )}

            <h2 className="text-xl font-semibold mt-6">6. Force Majeure</h2>
            <p>Furk is not liable for delays or non-performance caused by events beyond reasonable control, including natural disasters, outages, and government actions.</p>

            <h2 className="text-xl font-semibold mt-6">7. Modifications to Terms</h2>
            <p>Furk may update these Terms. Continued platform use after updates constitutes acceptance of revised Terms.</p>

            <div id="data-privacy" />
            <h2 className="text-xl font-semibold mt-6">8. Data Privacy</h2>
            <p>Furk processes personal data in line with the Data Privacy Act of 2012 (RA 10173) and applicable regulations.</p>
            <p>Collected data may include identity, contact, booking, transaction, and service interaction details needed for platform operations and compliance.</p>
            <p>Users may request access, correction, or deletion of data subject to legal and operational limitations.</p>

            <h2 className="text-xl font-semibold mt-6">9. Contact</h2>
            <ul className="list-none">
              <li>Email: support@furk.app</li>
              <li>Phone: +63 917 821 0408</li>
            </ul>
          </div>

          <p className="mt-8 text-left text-xs">Last updated: February 15, 2026</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
