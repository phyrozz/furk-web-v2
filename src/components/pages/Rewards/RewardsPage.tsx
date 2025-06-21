import { useEffect } from 'react';
import RewardsHero from './RewardsHero';
import RewardsExplanation from './RewardsExplanation';
import RewardsRedemption from './RewardsRedemption';
import RewardsTiers from './RewardsTiers';

const RewardsPage = () => {
  useEffect(() => {
    // Update the page title when component mounts
    document.title = 'Rewards Program - FURK';
    
    // Reset title when component unmounts
    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  return (
    <div className="pt-16 cursor-default">
      <RewardsHero />
      <RewardsExplanation />
      <RewardsTiers />
      <RewardsRedemption />
    </div>
  );
};

export default RewardsPage;