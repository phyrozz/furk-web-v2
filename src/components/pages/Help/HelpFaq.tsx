import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FaqAudience = 'pet_owner' | 'merchant' | 'affiliate';

interface FaqItem {
  question: string;
  answer: string;
}

const audienceLabels: Record<FaqAudience, string> = {
  pet_owner: 'Pet Owners',
  merchant: 'Merchants',
  affiliate: 'Affiliates',
};

const HelpFaq = () => {
  const [activeAudience, setActiveAudience] = useState<FaqAudience>('pet_owner');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = useMemo<Record<FaqAudience, FaqItem[]>>(
    () => ({
      pet_owner: [
        {
          question: 'How do I book a service for my pet?',
          answer:
            'Browse services, select a merchant, choose your pet, pick a date and time, then confirm your booking. You will see a confirmation message right away and receive updates in the app and by email as the merchant accepts and completes the booking.',
        },
        {
          question: 'Can I reschedule or cancel a booking?',
          answer:
            'Yes. Open your booking details and choose reschedule or cancel. Each merchant sets their own rules, so check the cancellation window before confirming. If a fee applies, it will be shown before you finalize the change.',
        },
        {
          question: 'What payment methods are supported?',
          answer:
            'Payments are processed through Maya\'s payment gateway. On FURK, you will see two currencies: Furkredits and Furkoins. Furkredits are used for bookings and paid services, while Furkoins are only used for redeeming free merchandise products. You will always see the final amount, fees, and payment method before confirming.',
        },
        {
          question: 'How do Furkredits and Furkoins work?',
          answer:
            'Furkredits are used to pay for bookings and services on the platform. Furkoins are only for redeeming free merchandise products. You will always see which currency applies before you confirm an action.',
        },
        {
          question: 'Do I need to provide pet information before booking?',
          answer:
            'Yes. Add your pet profile with details like breed, size, and any notes so merchants can prepare properly. Some services may require vaccine or grooming history, which you can include in your notes.',
        },
        {
          question: 'How do I contact a merchant?',
          answer:
            'Use the in-app message option on the merchant profile or inside your booking details. This keeps all communication tied to your booking for easier updates and support.',
        },
        {
          question: 'What if a merchant cancels my booking?',
          answer:
            'If a merchant cancels, you will be notified immediately. Any payments made for that booking are handled based on the merchant policy, and you can rebook with the same or a different merchant.',
        },
        {
          question: 'How do I leave a review?',
          answer:
            'After a booking is completed, you will see a prompt to rate and review the service. Your feedback helps other pet owners and improves service quality.',
        },
        {
          question: 'How can I get help with a booking issue?',
          answer:
            'Start by messaging the merchant from your booking details. If the issue is not resolved, contact support and include your booking ID for faster assistance.',
        },
      ],
      merchant: [
        {
          question: 'How do I set up my services and pricing?',
          answer:
            'Go to your Merchant Dashboard, open Services, and add packages with pricing, duration, and requirements. You can include add-ons and notes for pet owners. Save to publish immediately.',
        },
        {
          question: 'Where do I manage my business hours?',
          answer:
            'In your dashboard, open Settings and configure your business hours and breaks. This controls your booking availability, so keep it updated for holidays and special schedules.',
        },
        {
          question: 'When do I receive payouts?',
          answer:
            'Merchant earnings are tracked in Furkredits and paid out monthly in Philippine pesos (PHP). Payouts are processed through Maya\'s API after booking completion. You can view payout history and status in the dashboard so you can track totals and timing.',
        },
        {
          question: 'How do Furkredits and Furkoins work for merchants?',
          answer:
            'Bookings and services earn Furkredits, which are converted to PHP for monthly payouts via Maya. Furkoins are only for redeeming free merchandise products and are not part of merchant earnings.',
        },
        {
          question: 'How do I get verified?',
          answer:
            'Submit the required business documents in your profile. Our team reviews them and will notify you once approved. Verification helps build trust and improves visibility.',
        },
        {
          question: 'How do I accept, reschedule, or cancel bookings?',
          answer:
            'Open your Bookings page to view requests. You can accept, reschedule, or cancel with a reason. Clear communication helps avoid disputes and improves your rating.',
        },
        {
          question: 'Can I set cancellation or rescheduling policies?',
          answer:
            'Yes. Define your policy in your settings so pet owners see your rules before booking. This helps reduce last-minute changes and sets expectations.',
        },
        {
          question: 'How do I promote my services on FURK?',
          answer:
            'Complete your profile with photos, service details, and accurate hours. Encourage reviews and keep response times fast to improve visibility.',
        },
        {
          question: 'Who can I contact for merchant support?',
          answer:
            'Use the support contact on your dashboard for account or payout issues. Include your merchant ID and booking references to speed up resolution.',
        },
      ],
      affiliate: [
        {
          question: 'How do I share my affiliate link?',
          answer:
            'From your Affiliate Dashboard, copy your referral link and share it with merchants via email, socials, or direct messaging. You can also share your affiliate code if the merchant prefers manual entry.',
        },
        {
          question: 'How are referrals tracked?',
          answer:
            'Referrals are tracked when a merchant signs up using your link or code and completes verification. You can monitor their status in your dashboard.',
        },
        {
          question: 'When do I earn commissions?',
          answer:
            'You earn commissions based on the program terms after your referred merchant bookings are completed. The details and totals appear in your earnings summary.',
        },
        {
          question: 'How do Furkredits and Furkoins relate to affiliate earnings?',
          answer:
            'Affiliate commissions are based on completed bookings paid with Furkredits. Furkoins are only used to redeem free merchandise and do not affect affiliate commissions.',
        },
        {
          question: 'Can I see my referral performance?',
          answer:
            'Yes. The Affiliate Dashboard shows your total referred merchants, their verification status, and booking activity so you can track progress over time.',
        },
        {
          question: 'When are affiliate payouts released?',
          answer:
            'Payout timing follows the program schedule after commissions are confirmed. Check your dashboard for payout status and history.',
        },
        {
          question: 'What happens if a referral is rejected?',
          answer:
            'If a merchant does not complete verification or is rejected, the referral will not qualify for commission. You can still refer other merchants using your link.',
        },
        {
          question: 'Do you provide marketing materials?',
          answer:
            'Yes. Use the messaging and promotional assets provided in your affiliate resources. If you need specific materials, contact support.',
        },
      ],
    }),
    []
  );

  const items = faqs[activeAudience];

  return (
    <section className="mt-12">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="inline-flex rounded-full bg-gray-100 p-1">
            {(Object.keys(audienceLabels) as FaqAudience[]).map((audience) => (
              <button
                key={audience}
                type="button"
                onClick={() => {
                  setActiveAudience(audience);
                  setOpenIndex(0);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeAudience === audience
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {audienceLabels[audience]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="border border-gray-200 rounded-xl">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="text-gray-900 font-medium">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-gray-600">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HelpFaq;
