import { motion } from 'framer-motion';
import type { RichContent } from './chat-utils';
import styles from './Chat.module.css';

interface Props {
  isMine: boolean;
  text: string;
  time: string;
  richContent?: RichContent | null;
  pending?: boolean;
  animateEntry?: boolean;
}

export default function MessageBubble({ isMine, text, time, richContent, pending, animateEntry = false }: Props) {
  const isServiceCard = richContent?.type === 'service_card';

  return (
    <motion.div
      className={styles.messageRow}
      data-mine={isMine}
      initial={animateEntry ? { opacity: 0, y: 7, scale: 0.99 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className={`${styles.bubble} ${isServiceCard ? styles.serviceBubble : ''}`}>
        {isServiceCard ? (
          <div className={styles.serviceCard}>
            {richContent.image_url && <img src={richContent.image_url} alt={richContent.title || 'Service'} loading="lazy" />}
            <div>
              <span className={styles.serviceLabel}>Shared service</span>
              <h3>{richContent.title || 'Service'}</h3>
              {richContent.business_name && <p>{richContent.business_name}</p>}
              {typeof richContent.price === 'number' && <strong>{richContent.price.toLocaleString()} <span>Furkredits</span></strong>}
            </div>
          </div>
        ) : <p className={styles.messageText}>{text}</p>}
        <span className={styles.messageTime}>{pending ? 'Sending…' : time}</span>
      </div>
    </motion.div>
  );
}
