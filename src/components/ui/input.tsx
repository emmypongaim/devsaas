import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-700/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-white ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';