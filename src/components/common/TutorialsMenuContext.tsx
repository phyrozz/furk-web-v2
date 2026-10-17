import { createContext, useContext, type Dispatch, type RefObject, type SetStateAction } from 'react';

interface TutorialsMenuContextValue {
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
  mobileTriggerRef: RefObject<HTMLButtonElement>;
}

export const TutorialsMenuContext = createContext<TutorialsMenuContextValue | null>(null);

export const useTutorialsMenu = (): TutorialsMenuContextValue => {
  const context = useContext(TutorialsMenuContext);
  if (!context) {
    throw new Error('useTutorialsMenu must be used inside TutorialsMenuContext.Provider');
  }
  return context;
};
