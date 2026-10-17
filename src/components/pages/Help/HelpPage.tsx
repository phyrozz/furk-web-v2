import { useState } from 'react';
import TutorialGuide from '../../common/TutorialGuide';
import { BookOpen, HelpCircle, Play } from 'lucide-react';
import HelpFaq from './HelpFaq';
import { motion } from 'framer-motion';
import TopNavbarPageShell from '../../common/TopNavbarPageShell';
import MerchantNavbar from '../../common/MerchantNavbar';
import { loginService } from '../../../services/auth/auth-service';
import { getTutorialsForAudience, getTutorialVideoUrl, type Tutorial, type TutorialAudience } from '../../../data/tutorials';

const HelpPage = () => {
  const userRole = loginService.getUserRole();
  const isMerchant = userRole === 'merchant';
  const [audience, setAudience] = useState<TutorialAudience>(isMerchant ? 'merchant' : 'pet-owner');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const tutorials = getTutorialsForAudience(audience);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const content = (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
        >
          <HelpCircle className="mx-auto h-12 w-12 text-primary-500 mb-4" />
          <h1 className="text-4xl font-cursive font-bold text-gray-900 mb-2">Help & Tutorials</h1>
          <p className="text-lg text-gray-600">
            Follow a quick how-to guide, pick up useful tips, and watch tutorials when available.
          </p>
        </motion.div>

        <div className="mb-6 flex justify-center gap-2" role="group" aria-label="Tutorial audience">
          {(['pet-owner', 'merchant'] as const).map((option) => (
            <button key={option} type="button" aria-pressed={audience === option} onClick={() => setAudience(option)} className={`rounded-full px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${audience === option ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-primary-50'}`}>
              {option === 'pet-owner' ? 'Pet owners' : 'Merchants'}
            </button>
          ))}
        </div>

        <motion.div
          key={audience}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {tutorials.map((tutorial) => (
            <motion.div
              key={tutorial.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
              variants={fadeUp}
              transition={{ duration: 0.4 }}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{tutorial.title}</h3>
                <p className="text-gray-600 mb-6 line-clamp-2">{tutorial.description}</p>
                <button
                  onClick={() => setSelectedTutorial(tutorial)}
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Open guide: ${tutorial.title}`}
                  className="flex items-center rounded-lg py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                >
                  {getTutorialVideoUrl(tutorial.id, import.meta.env.VITE_CDN_URL) ? <Play className="h-5 w-5 mr-2" aria-hidden="true" /> : <BookOpen className="h-5 w-5 mr-2" aria-hidden="true" />}
                  Open guide
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <TutorialGuide
          tutorial={selectedTutorial}
          onClose={() => setSelectedTutorial(null)}
          showAction={selectedTutorial?.audience === (isMerchant ? 'merchant' : 'pet-owner') && (!userRole || userRole === 'user' || isMerchant)}
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <HelpFaq />
        </motion.div>
      </div>
    </div>
  );

  if (isMerchant) {
    return (
      <>
        <MerchantNavbar />
        <div className="min-h-screen bg-gray-50 lg:pl-[var(--merchant-navbar-width,18rem)] pt-16 lg:pt-0">
          {content}
        </div>
      </>
    );
  }

  return (
    <TopNavbarPageShell>
      {content}
    </TopNavbarPageShell>
  );
};

export default HelpPage;
