import React from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const alertClass = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
  };

  return (
    <div className={`alert ${alertClass[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  );
};

export const Toaster: React.FC = () => {
  // This is a placeholder. In a real application, you'd manage toasts with a context or state management library.
  return <div id="toast-container" className="toast toast-top toast-end"></div>;
};