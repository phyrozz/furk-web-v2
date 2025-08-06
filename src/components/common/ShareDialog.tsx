import React, { useState } from 'react';
import { SocialIcon } from 'react-social-icons';
import Modal from './Modal';
import Button from './Button';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  socials: Social[];
}

interface Social {
  name: string;
  url: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, shareUrl, socials }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share"
      showCancel={false}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 bg-transparent outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-1 text-sm bg-white rounded-md hover:bg-gray-50 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className='flex justify-center'>
          {socials.map((social, index) => (
          <Button variant='ghost' key={index}>
            <SocialIcon url={`${social.url}`} target='_blank' />
          </Button>
        ))}
        </div>
      </div>
    </Modal>
  );
};

export default ShareDialog;
