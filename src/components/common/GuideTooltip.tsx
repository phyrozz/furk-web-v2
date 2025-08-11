import React, { ReactNode } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface GuideTipProps {
  children: ReactNode;
  show?: boolean;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onClose?: () => void;
}

const GuideTip: React.FC<GuideTipProps> = ({
  children,
  show = true,
  content,
  position = 'bottom',
  onClose
}) => {
  const [visible, setVisible] = React.useState(show);
  const tooltipId = Math.random().toString(36).substr(2, 9);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <>
      <div data-tooltip-id={tooltipId} style={{ display: 'inline-block' }}>
        {children}
      </div>
      {visible && (
        <Tooltip
        id={tooltipId}
        place={position}
        isOpen={visible}
        clickable
        style={{
          opacity: 1,
          backgroundColor: '#fff',
          color: '#000',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          minWidth: '300px',
          maxWidth: '400px',
        }}
      >
        <div style={{ position: 'relative', paddingRight: '20px' }}>
          {content}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#666',
            }}
          >
            ✕
          </button>
        </div>
      </Tooltip>
      )}
    </>
  );
};

export default GuideTip;
