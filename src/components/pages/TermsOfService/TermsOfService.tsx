import { ScrollText } from 'lucide-react';
import Navbar from '../../common/Navbar';
import Footer from '../../common/Footer';

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto mt-20 px-4 py-8">
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex items-center gap-2 mb-6">
            <ScrollText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Terms and Conditions</h1>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-gray-600 mb-4">Effective Date: July 1, 2025</p>

            <p>Welcome to Furk, an online platform that connects pet owners with trusted pet service providers ("Merchants"). By using the Furk mobile or web application (the "App"), you agree to be bound by the following Terms and Conditions ("Terms"). Please read them carefully before using our services.</p>

            <h2 className="text-xl font-semibold mt-6">1. Acceptance of Terms</h2>
            <p>By creating an account, accessing, or using the Furk App, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and any additional policies or agreements referenced herein.</p>

            <h2 className="text-xl font-semibold mt-6">2. Eligibility</h2>
            <p>You must be at least 18 years old to use Furk. By using the App, you represent and warrant that you meet this age requirement and that all information you provide is accurate and truthful.</p>

            <h2 className="text-xl font-semibold mt-6">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your login credentials. You agree to notify Furk immediately of any unauthorized use of your account. Furk reserves the right to suspend or terminate accounts that are found to be fraudulent, abusive, or in violation of these Terms.</p>

            <h2 className="text-xl font-semibold mt-6">4. Services and Bookings</h2>
            <p>The Furk platform allows pet owners to browse, request, and book services offered by registered Merchants (e.g., grooming, walking, sitting). When a booking is confirmed, a contract is formed directly between the pet owner and the Merchant. Furk is not a party to that agreement and acts solely as an intermediary for service discovery and payment facilitation.</p>

            <h2 className="text-xl font-semibold mt-6">5. Payments and Fees</h2>
            <p>Furk uses Maya as its designated payment gateway for processing transactions between users and Merchants. All payments are processed securely within the App.</p>

            <h3 className="text-lg font-semibold mt-4 ml-4">For Pet Owners</h3>
            <p className='ml-4'>Pet owners will be charged the full service amount upon booking confirmation. Any applicable platform fees will be disclosed during checkout. Refunds, cancellations, and disputes must be coordinated directly with the Merchant, subject to their policies.</p>

            <h3 className="text-lg font-semibold mt-4 ml-4">For Merchants</h3>
            <p className='ml-4'>By registering as a Merchant on Furk, you agree to a platform service fee of <strong>10%</strong> of the total booking amount. This fee will be automatically deducted from your payout for each confirmed booking. The remaining 90% will be disbursed to your registered bank account after the service is marked as completed.</p>
            <p className='ml-4'>Merchants are solely responsible for the delivery and quality of their services. Any disputes, complaints, or chargebacks arising from your services may impact your eligibility to continue offering services on Furk.</p>

            <h2 className="text-xl font-semibold mt-6">6. Force Majeure and Weather Conditions</h2>
            <p>Furk shall not be held liable for any failure to perform, delays, or disruptions to services booked through the App due to weather conditions, natural disasters, government actions, pandemics, power outages, or other force majeure events beyond our reasonable control. It is the responsibility of both Pet Owners and Merchants to communicate and resolve any service changes or cancellations arising from such events.</p>

            <h2 className="text-xl font-semibold mt-6">7. Affiliate Program</h2>
            <p>The Furk Affiliate Program allows users to earn commissions by referring new customers to our platform. By participating in the Affiliate Program, you agree to the following terms:</p>
            
            <h3 className="text-lg font-semibold mt-4 ml-4">Eligibility</h3>
            <p className='ml-4'>To participate in the Affiliate Program, you must be at least 18 years old, have a valid bank account, and a valid ID. Furk reserves the right to approve or reject any affiliate application at its sole discretion.</p>
            
            {/* <h3 className="text-lg font-semibold mt-4 ml-4">Commission Structure</h3>
            <p className='ml-4'>Affiliates earn a <strong>5%</strong> commission on the service fee collected by Furk from each qualifying transaction made by a referred user. Commissions are calculated based on the net revenue received by Furk after any refunds, chargebacks, or adjustments.</p>
            
            <h3 className="text-lg font-semibold mt-4 ml-4">Referral Tracking</h3>
            <p className='ml-4'>Referrals are tracked through unique affiliate links or codes provided to each affiliate. To qualify for a commission, a referred user must click on your affiliate link or use your affiliate code during registration and complete a qualifying transaction within 30 days.</p> */}
            
            <h3 className="text-lg font-semibold mt-4 ml-4">Payment Terms</h3>
            <p className='ml-4'>Commissions are paid monthly for all qualifying transactions from the previous month. A minimum payout threshold of ₱500 applies. Payments will be made to the bank account provided in your affiliate profile.</p>
            
            <h3 className="text-lg font-semibold mt-4 ml-4">Prohibited Activities</h3>
            <p className='ml-4'>Affiliates are prohibited from engaging in spamming, false advertising, or any deceptive practices. Violation of these terms may result in termination from the program and forfeiture of unpaid commissions.</p>

            <h2 className="text-xl font-semibold mt-6">8. Modifications to Terms</h2>
            <p>Furk reserves the right to modify these Terms at any time. Changes will be effective upon posting. Continued use of the App after such changes constitutes your acceptance of the revised Terms.</p>

            <h2 className="text-xl font-semibold mt-6">9. Contact Us</h2>
            <p>If you have any questions or concerns about these Terms, please contact us at:</p>
            <ul className="list-none">
              <li>Email: support@furk.app</li>
              <li>Phone: +63 917 821 0408</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
