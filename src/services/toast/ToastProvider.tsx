import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastService } from './toast-service';

interface ToastContextType {
  show: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((message: string, duration = 3000) => {
    setToast(message);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => setToast(null), 300); // fade out
    }, duration);
  }, []);

  React.useEffect(() => {
    ToastService.registerShowHandler(show);
  }, [show]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded shadow-lg transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ zIndex: 9999 }}
        >
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};