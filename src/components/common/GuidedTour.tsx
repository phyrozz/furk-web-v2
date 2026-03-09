import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Button from './Button';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  videoFileName?: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ steps, isOpen, onClose, onFinish }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' | 'left' | 'right' }>({ top: 0, left: 0, placement: 'bottom' });
  const cdnUrl = import.meta.env.VITE_CDN_URL;
  const requestRef = useRef<number>();
  const retryCountRef = useRef(0);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateHighlight = (scroll: boolean = false) => {
    const step = steps[currentStepIndex];
    if (!step) return;
    
    const element = document.getElementById(step.targetId);
    if (element) {
      retryCountRef.current = 0;
      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      const newHighlightRect = {
        top: rect.top - padding,
        bottom: rect.bottom + padding,
        left: rect.left - padding,
        right: rect.right + padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      } as DOMRect;
      
      // Update highlight rect if it changed significantly
      setHighlightRect(prev => {
        if (!prev || 
            Math.abs(prev.top - newHighlightRect.top) > 0.5 || 
            Math.abs(prev.left - newHighlightRect.left) > 0.5 ||
            Math.abs(prev.width - newHighlightRect.width) > 0.5) {
          return newHighlightRect;
        }
        return prev;
      });

      // Calculate tooltip position
      const tooltipPadding = 16;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 350;
      const tooltipWidth = tooltipRef.current?.offsetWidth || 400;

      const spaceAbove = newHighlightRect.top;
      const spaceBelow = window.innerHeight - newHighlightRect.bottom;
      
      let placement: 'top' | 'bottom' = 'bottom';
      let top = newHighlightRect.bottom + tooltipPadding;
      
      // If there's more space above AND either not enough space below or above is just much better
      if (spaceAbove > spaceBelow && (spaceBelow < tooltipHeight + tooltipPadding)) {
        placement = 'top';
        top = newHighlightRect.top - tooltipPadding;
      }

      // Final bounds checking for vertical position
      if (placement === 'bottom') {
        if (top + tooltipHeight > window.innerHeight - 16) {
          top = window.innerHeight - tooltipHeight - 16;
        }
      } else {
        if (top - tooltipHeight < 16) {
          top = tooltipHeight + 16;
        }
      }

      let left = newHighlightRect.left + newHighlightRect.width / 2;
      // Center the tooltip relative to its width
      const idealLeft = left - tooltipWidth / 2;
      // Keep it within horizontal bounds
      const finalLeft = Math.min(Math.max(idealLeft, 16), window.innerWidth - tooltipWidth - 16);

      const newTooltipPos = { top, left: finalLeft, placement };
      setTooltipPosition(prev => {
        if (!prev || 
            Math.abs(prev.top - newTooltipPos.top) > 0.5 || 
            Math.abs(prev.left - newTooltipPos.left) > 0.5 ||
            prev.placement !== newTooltipPos.placement) {
          return newTooltipPos;
        }
        return prev;
      });

      if (scroll) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // If element not found, wait a few frames before skipping
      if (retryCountRef.current < 60) { // Wait for ~1 second
        retryCountRef.current += 1;
      } else {
        retryCountRef.current = 0;
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          onFinish();
        }
      }
    }
  };

  useEffect(() => {
    const animate = () => {
      updateHighlight(false);
      requestRef.current = requestAnimationFrame(animate);
    };

    if (isOpen) {
      updateHighlight(true); // Initial scroll and update
      requestRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isOpen, currentStepIndex, steps]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (!isOpen || !highlightRect) return null;

  const currentStep = steps[currentStepIndex];
  const videoUrl = `${cdnUrl}/tutorials/${currentStep.videoFileName}`;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Overlay with hole */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 pointer-events-auto"
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${highlightRect.left}px 100%, 
            ${highlightRect.left}px ${highlightRect.top}px, 
            ${highlightRect.right}px ${highlightRect.top}px, 
            ${highlightRect.right}px ${highlightRect.bottom}px, 
            ${highlightRect.left}px ${highlightRect.bottom}px, 
            ${highlightRect.left}px 100%, 
            100% 100%, 
            100% 0%
          )`
        }}
      />

      {/* Tooltip */}
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        key={currentStepIndex}
        className="absolute pointer-events-auto bg-white rounded-2xl shadow-2xl p-6 w-[320px] md:w-[400px] z-[210] flex flex-col"
        style={{
          top: tooltipPosition.placement === 'top' ? 'auto' : tooltipPosition.top,
          bottom: tooltipPosition.placement === 'top' ? window.innerHeight - tooltipPosition.top : 'auto',
          left: tooltipPosition.left,
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        <div className="overflow-y-auto pr-1 custom-scrollbar">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          {currentStep.videoFileName && <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-inner">
            <img 
              src={videoUrl} 
              alt={currentStep.title}
              className="w-full h-full object-cover"
            />
          </div>}

          <h3 className="text-xl font-cursive font-bold text-gray-900 mb-2">{currentStep.title}</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{currentStep.description}</p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className={`flex items-center text-sm font-medium transition-colors ${
              currentStepIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ChevronLeft size={18} className="mr-1" />
            Back
          </button>

          <Button
            size="sm"
            onClick={handleNext}
            className="px-6"
          >
            {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            {currentStepIndex !== steps.length - 1 && <ChevronRight size={18} className="ml-1" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default GuidedTour;
