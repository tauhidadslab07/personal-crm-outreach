'use client';

import React, { useState } from 'react';
import { Globe, ExternalLink, Edit2, Check, X, Plus } from 'lucide-react';
import { getEffectiveDomain, formatUrlForVisiting } from '@/lib/domain';
import { useCRMStore } from '@/lib/store';

interface DomainBadgeProps {
  leadId: string;
  website?: string;
  email?: string;
  leadName?: string;
  className?: string;
  showIcon?: boolean;
}

export const DomainBadge: React.FC<DomainBadgeProps> = ({
  leadId,
  website,
  email,
  leadName,
  className = '',
  showIcon = true,
}) => {
  const updateLead = useCRMStore((s) => s.updateLead);
  const [isEditing, setIsEditing] = useState(false);
  const [tempDomain, setTempDomain] = useState(website || '');

  const { domain, source } = getEffectiveDomain(website, email);

  const handleSave = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = tempDomain.trim();
    updateLead(leadId, { website: clean });
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempDomain(website || '');
    setIsEditing(false);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempDomain(website || domain || '');
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 bg-zinc-900 border border-cyan-500/60 rounded-xl p-1 shadow-lg z-10 ${className}`}
      >
        <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0 ml-1" />
        <input
          type="text"
          value={tempDomain}
          onChange={(e) => setTempDomain(e.target.value)}
          placeholder="example.com"
          autoFocus
          className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-0.5 text-xs text-cyan-200 placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan-400 w-36"
        />
        <button
          type="submit"
          title="Save domain"
          className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          title="Cancel"
          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </form>
    );
  }

  if (domain) {
    const visitUrl = formatUrlForVisiting(website || domain);
    return (
      <div className={`group inline-flex items-center gap-1 ${className}`}>
        <a
          href={visitUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Visit website: ${visitUrl} (Opens in new tab)`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 hover:border-cyan-400/80 px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 hover:text-white transition-all shadow-sm max-w-[210px] truncate"
        >
          {showIcon && <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />}
          <span className="truncate">{domain}</span>
          {source === 'email' && (
            <span className="text-[9px] font-sans text-cyan-400/70 border border-cyan-500/20 bg-cyan-950/40 px-1 rounded shrink-0">
              via mail
            </span>
          )}
          <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
        </a>

        <button
          type="button"
          onClick={handleStartEdit}
          title="Edit website domain"
          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-cyan-300 transition-all rounded hover:bg-zinc-800 cursor-pointer"
        >
          <Edit2 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={`group inline-flex items-center gap-1 ${className}`}>
      <span
        title="No website domain recorded (null)"
        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900/60 border border-dashed border-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-500 shadow-sm"
      >
        <Globe className="h-3 w-3 text-zinc-600 shrink-0" />
        <span className="italic font-semibold text-zinc-500">null</span>
      </span>
      <button
        type="button"
        onClick={handleStartEdit}
        title="Add website domain"
        className="opacity-40 group-hover:opacity-100 p-1 text-zinc-500 hover:text-cyan-300 transition-all rounded hover:bg-zinc-800 cursor-pointer"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
};
