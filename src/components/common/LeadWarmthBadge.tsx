'use client';

import React, { useMemo } from 'react';
import { Lead, CadenceStage } from '@/types/crm';
import { calculateLeadWarmth } from '@/lib/warmth';

interface LeadWarmthBadgeProps {
  lead: Lead;
  stages?: CadenceStage[];
  className?: string;
  showText?: boolean;
}

export const LeadWarmthBadge: React.FC<LeadWarmthBadgeProps> = ({
  lead,
  stages = [],
  className = '',
  showText = true,
}) => {
  const warmth = useMemo(() => calculateLeadWarmth(lead, stages), [lead, stages]);

  return (
    <span
      title={`${warmth.label}: ${warmth.description}`}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold select-none transition-all ${warmth.badgeClass} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${warmth.dotClass}`} />
      <span>{warmth.emoji}</span>
      {showText && <span>{warmth.label}</span>}
    </span>
  );
};
