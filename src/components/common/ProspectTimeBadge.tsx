'use client';

import React, { useMemo } from 'react';
import { getProspectLocalTime } from '@/lib/timezone';
import { Clock } from 'lucide-react';

interface ProspectTimeBadgeProps {
  isoCode?: string;
  className?: string;
  showDetails?: boolean;
}

export const ProspectTimeBadge: React.FC<ProspectTimeBadgeProps> = ({
  isoCode,
  className = '',
  showDetails = false,
}) => {
  const timeInfo = useMemo(() => getProspectLocalTime(isoCode), [isoCode]);

  const colorStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-500/50',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:border-cyan-500/50',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:border-rose-500/50',
  }[timeInfo.badgeColor];

  return (
    <div
      title={`${timeInfo.statusText} (${timeInfo.badgeLabel})`}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-all select-none ${colorStyles} ${className}`}
    >
      <Clock className="h-3 w-3 shrink-0 opacity-80" />
      <span>{timeInfo.formattedTime}</span>
      <span className="text-[10px] opacity-75">{timeInfo.badgeEmoji}</span>
      {showDetails && (
        <span className="text-[10px] hidden xs:inline opacity-80 font-normal">
          • {timeInfo.badgeLabel}
        </span>
      )}
    </div>
  );
};
