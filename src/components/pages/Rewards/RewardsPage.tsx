import { useEffect } from 'react';
import RewardsHero from './RewardsHero';
import RewardsExplanation from './RewardsExplanation';
import RewardsRedemption from './RewardsRedemption';
import RewardsTiers from './RewardsTiers';
import Reveal from '../../common/Reveal';

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
      <Reveal><RewardsHero /></Reveal>
      <Reveal><RewardsExplanation /></Reveal>
      <Reveal><RewardsTiers /></Reveal>
      <RewardsRedemption />
    </div>
  );
};

export default RewardsPage;
