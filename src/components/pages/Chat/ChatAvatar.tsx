import { useState } from 'react';
import styles from './Chat.module.css';
import { getInitials } from './chat-utils';

interface Props {
  name: string;
  imageUrl?: string | null;
  variant?: 'inbox' | 'header' | 'compact';
}

const DEFAULT_IMAGE_NAMES = new Set([
  'default_profile.png',
  'default-profile.png',
  'default_profile.jpg',
  'default-profile.jpg',
  'default_profile.jpeg',
  'default-profile.jpeg',
]);

function isDefaultImage(url?: string | null) {
  if (!url?.trim()) return true;
  const filename = url.split(/[?#]/, 1)[0].replace(/\\/g, '/').split('/').pop()?.toLocaleLowerCase();
  return !filename || DEFAULT_IMAGE_NAMES.has(filename);
}

export default function ChatAvatar({ name, imageUrl, variant = 'inbox' }: Props) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const showImage = !isDefaultImage(imageUrl) && failedImageUrl !== imageUrl;
  const hasHeaderStyle = variant === 'header';
  const hasCompactStyle = variant === 'compact';

  return (
    <span
      className={`${styles.avatar} ${hasHeaderStyle ? styles.headerAvatar : ''} ${hasCompactStyle ? styles.compactAvatar : ''}`}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          key={imageUrl}
          src={imageUrl!}
          alt=""
          className={styles.avatarImage}
          onError={() => setFailedImageUrl(imageUrl ?? null)}
        />
      ) : getInitials(name)}
      {showImage && <span className={styles.avatarInitials}>{getInitials(name)}</span>}
    </span>
  );
}
