import { Dog, PawPrint } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './TutorialVideoLoading.module.css';

interface TutorialVideoLoadingProps {
  active: boolean;
  visible: boolean;
}

const TutorialVideoLoading = ({ active, visible }: TutorialVideoLoadingProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={styles.overlay}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
      data-active={active && visible}
      aria-hidden={!visible}
      role="status"
      aria-label="Loading tutorial video"
      aria-atomic="true"
    >
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.ground} />
        <div className={styles.dog}><Dog size={40} strokeWidth={1.6} /></div>
        <div className={styles.trail}>
          <PawPrint size={15} />
          <PawPrint size={15} />
          <PawPrint size={15} />
        </div>
        <svg className={styles.ball} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" fill="#C9D994" stroke="#788B46" strokeWidth="1.5" />
          <path d="M7 5c10 5 10 17 0 22M25 5c-10 5-10 17 0 22" stroke="#FBF8F4" strokeWidth="2" />
        </svg>
      </div>
      {/* <div>
        <p className={styles.title}>Fetching your video…</p>
        <p className={styles.caption}>A new trick is on its way.</p>
      </div> */}
    </motion.div>
  );
};

export default TutorialVideoLoading;
