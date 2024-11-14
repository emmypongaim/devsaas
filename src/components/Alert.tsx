import React from 'react';
import { useState, useCallback } from 'react';

export interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Alert: React.FC<AlertProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`relative overflow-hidden rounded-md text-white ${bgColor} animate-fade-in-down`}>
        <div className="p-4 flex items-center justify-between">
          <span>{message}</span>
          <button 
            onClick={onClose}
            className="ml-4 hover:opacity-80 transition-opacity"
          >
            ×
          </button>
        </div>
        <div 
          className="absolute bottom-0 left-0 h-1 bg-white/30 animate-shrink-width"
          style={{ 
            width: '100%',
          }}
        />
      </div>
    </div>
  );
};

export const useAlert = () => {
  const [alert, setAlert] = useState<Omit<AlertProps, 'onClose'> | null>(null);

  const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  return {
    alert: alert ? { ...alert, onClose: () => setAlert(null) } : null,
    showAlert,
  };
};

export default Alert;