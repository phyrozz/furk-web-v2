import { useState } from 'react';
import TutorialVideoModal from '../../common/TutorialVideoModal';
import { HelpCircle, Play } from 'lucide-react';
import HelpFaq from './HelpFaq';
import { motion } from 'framer-motion';
import TopNavbarPageShell from '../../common/TopNavbarPageShell';
import MerchantNavbar from '../../common/MerchantNavbar';
import { loginService } from '../../../services/auth/auth-service';

const HelpPage = () => {
  const isMerchant = loginService.getUserRole() === 'merchant';
  const [selectedTutorial, setSelectedTutorial] = useState<{
    title: string;
    videoUrl: string;
    description: string;
  } | null>(null);

  const tutorials = [
    {
      id: 1,
      title: 'How to use Merchant Dashboard',
      description: 'Learn how to manage your services, bookings, and payouts from your dashboard.',
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder
    },
    {
      id: 2,
      title: 'Setting up Business Hours',
      description: 'See how to configure your business and break hours to manage your availability.',
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder
    },
  ];

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
            Find answers to common questions and watch video tutorials to get the most out of FURK.
          </p>
        </motion.div>

        <motion.div
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
                  className="flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Tutorial
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {selectedTutorial && (
          <TutorialVideoModal
            isOpen={!!selectedTutorial}
            onClose={() => setSelectedTutorial(null)}
            title={selectedTutorial.title}
            videoUrl={selectedTutorial.videoUrl}
            description={selectedTutorial.description}
          />
        )}

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
        <div className="min-h-screen bg-gray-50 select-none lg:pl-72 pt-16 lg:pt-0">
          {content}
        </div>
      </>
    );
  }

  return (
    <TopNavbarPageShell className="select-none">
      {content}
    </TopNavbarPageShell>
  );
};

export default HelpPage;
