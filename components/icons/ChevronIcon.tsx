
import React from 'react';

interface ChevronIconProps {
  isExpanded: boolean;
  className?: string;
}

export const ChevronIcon: React.FC<ChevronIconProps> = ({ isExpanded, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${
      isExpanded ? 'rotate-180' : ''
    } ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
