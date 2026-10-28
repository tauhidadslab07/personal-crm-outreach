'use client';

import React from 'react';
import { useCRMStore } from '@/lib/store';
import { Building2, Code, ChevronDown } from 'lucide-react';

interface NicheDropdownProps {
  leadId: string;
  leadName?: string;
  currentNiche?: string;
  size?: 'sm' | 'md';
  className?: string;
  onChange?: (newNiche: string) => void;
}

export const NicheDropdown: React.FC<NicheDropdownProps> = ({
  leadId,
  leadName,
  currentNiche = 'Website Development Agency',
  size = 'md',
  className = '',
  onChange,
}) => {
  const updateLead = useCRMStore((s) => s.updateLead);

  const isAgency = currentNiche === 'Website Development Agency';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateLead(leadId, { niche: val });
    if (onChange) {
      onChange(val);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={currentNiche || 'Website Development Agency'}
        onChange={handleChange}
        title="Select Target Niche (Website Development Agency vs Website Developer)"
        className={`appearance-none font-bold rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-1 pr-6 ${
          isSmall ? 'text-[10px] py-0.5 pl-2' : 'text-xs py-1 pl-2.5'
        } ${
          isAgency
            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/40 focus:ring-cyan-500'
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/40 focus:ring-emerald-500'
        }`}
      >
        <option value="Website Development Agency" className="bg-zinc-900 text-cyan-300 font-bold py-1">
          🏢 Website Development Agency
        </option>
        <option value="Website Developer" className="bg-zinc-900 text-emerald-300 font-bold py-1">
          💻 Website Developer
        </option>
      </select>
      <div className="pointer-events-none absolute right-1.5 flex items-center text-zinc-400">
        <ChevronDown className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </div>
    </div>
  );
};
