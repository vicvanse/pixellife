'use client';

import { ReactNode } from 'react';

interface PixelCardProps {
  children: ReactNode;
  className?: string;
}

export function PixelCard({ children, className = '' }: PixelCardProps) {
  return (
    <div 
      className={`bg-white border border-[#d8d4c7] rounded-md shadow-[0_2px_0_#e6e2da] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

