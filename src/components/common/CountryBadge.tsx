'use client';

import React from 'react';
import { CountryInfo } from '@/types/crm';

interface CountryBadgeProps {
  country: Partial<CountryInfo> & { flagEmoji?: string; countryName?: string; isoCode?: string; isValid?: boolean };
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export const CountryBadge: React.FC<CountryBadgeProps> = ({
  country,
  size = 'md',
  showName = true,
  className = '',
}) => {
  const { flagEmoji = '🌐', countryName = '', isoCode = '', isValid } = country;

  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5 gap-1',
    md: 'text-xs py-1 px-2.5 gap-1.5',
    lg: 'text-sm py-1.5 px-3 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-all ${
        isValid === false && isoCode
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      } ${sizeClasses} ${className}`}
      title={countryName || isoCode}
    >
      <span className="text-base leading-none select-none">{flagEmoji}</span>
      {showName && (
        <span className="truncate max-w-[120px] font-medium">
          {countryName || isoCode || 'Auto Detect'}
        </span>
      )}
      {isoCode && !showName && (
        <span className="uppercase text-[10px] tracking-wider font-semibold opacity-90">
          {isoCode}
        </span>
      )}
    </span>
  );
};
