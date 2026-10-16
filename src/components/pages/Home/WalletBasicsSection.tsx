import { ArrowRight, Coins, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';

const WalletBasicsSection = () => (
  <section className="border-y border-gray-200 bg-gray-50 py-14 md:py-20" aria-labelledby="wallet-basics-title">
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="furk-eyebrow">Before your first booking</p>
        <h2 id="wallet-basics-title" className="text-3xl font-extrabold text-gray-900 md:text-4xl">
          Your FURK wallet, explained
        </h2>
        <p className="mt-4 text-base leading-relaxed text-gray-600 md:text-lg">
          Add Furkredits to your wallet before booking a service. Furkoins are a separate reward balance.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
        <article className="furk-panel p-6 sm:p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700" aria-hidden="true">
            <WalletCards size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Furkredits pay for services</h3>
          <p className="mt-3 leading-relaxed text-gray-600">
            Top up your Furkredits from the Wallet section in your Profile. Use your balance to pay for pet service bookings on FURK.
          </p>
        </article>

        <article className="furk-panel p-6 sm:p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700" aria-hidden="true">
            <Coins size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Furkoins are for merchandise</h3>
          <p className="mt-3 leading-relaxed text-gray-600">
            Furkoins are used to redeem eligible merchandise. They cannot be used to pay for service bookings.
          </p>
        </article>
      </div>

      <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-5 rounded-2xl border border-primary-200 bg-primary-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900">New to FURK?</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Create a pet owner account, top up your Furkredits from Profile, then book a service.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-4">
          <Link to="/services" className="text-sm font-bold text-primary-700 hover:text-primary-900">
            Browse services
          </Link>
          <Link
            to="/sign-up/user"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            Create an account <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-5xl text-xs leading-relaxed text-gray-500">
        Furkredits and Furkoins have different uses. Check the amount and payment details shown before you confirm a transaction.
      </p>
    </div>
  </section>
);

export default WalletBasicsSection;
