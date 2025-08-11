import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TooltipState {
  isNewUser: boolean;
  showDashboardTip: boolean;
  showSettingsTip: boolean;
  // Add more flags in the future
}

interface GuideTooltipContextType {
  tooltipState: TooltipState;
  setTooltipState: React.Dispatch<React.SetStateAction<TooltipState>>;
}

const GuideTooltipContext = createContext<GuideTooltipContextType | undefined>(undefined);

interface GuideTooltipProviderProps {
  children: ReactNode;
}

export const GuideTooltipProvider: React.FC<GuideTooltipProviderProps> = ({ children }) => {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    isNewUser: false,
    showDashboardTip: false,
    showSettingsTip: false,
  });

  return (
    <GuideTooltipContext.Provider value={{ tooltipState, setTooltipState }}>
      {children}
    </GuideTooltipContext.Provider>
  );
};

export const useGuideTooltip = () => {
  const context = useContext(GuideTooltipContext);
  if (context === undefined) {
    throw new Error('useGuideTooltip must be used within a GuideTooltipProvider');
  }
  return context;
};
