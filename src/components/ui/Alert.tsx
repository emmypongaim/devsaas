import React, { useState, useEffect } from 'react';

interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export const Alert: React.FC<AlertProps> = ({ message, type, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  const alertClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md text-white ${alertClasses[type]}`}>
      {message}
    </div>
  );
};

export const useAlert = () => {
  const [alertProps, setAlertProps] = useState<AlertProps | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' | 'info', duration?: number) => {
    setAlertProps({ message, type, duration });
  };

  return { Alert, showAlert };
};