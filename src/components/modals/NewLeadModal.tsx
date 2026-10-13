'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { usePhoneDetection } from '@/hooks/use-phone-detection';
import { CountryBadge } from '../common/CountryBadge';
import { useCRMStore } from '@/lib/store';
import { LeadSource } from '@/types/crm';
import { AlertTriangle, Check, UserPlus, Sparkles } from 'lucide-react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNiche?: string;
}

const SOURCES: LeadSource[] = [
  'LinkedIn',
  'Cold Inbound',
  'Referral',
  'Website',
  'Twitter/X',
  'Upwork',
  'Conference',
  'Other',
];

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, initialNiche }) => {
  const addLead = useCRMStore((s) => s.addLead);
  const niches = useCRMStore((s) => s.niches);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [niche, setNiche] = useState(initialNiche || (niches[0]?.name || 'General'));
  const [tagsInput, setTagsInput] = useState('');

  // Sync initialNiche when opened
  React.useEffect(() => {
    if (initialNiche) {
      setNiche(initialNiche);
    }
  }, [initialNiche]);

  const { phoneNumber, setPhoneNumber, countryInfo, isValid } = usePhoneDetection('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addLead({
      name: name.trim(),
      phoneRaw: phoneNumber.trim(),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      niche,
      tags,
    });

    // Reset & close
    setName('');
    setPhoneNumber('');
    setCompany('');
    setEmail('');
    setTagsInput('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Target Lead"
      subtitle="Instantly auto-detects country, sanitizes phone, and schedules Initial WhatsApp outreach"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Full Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Tanvir Ahmed, Sarah Jenkins"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Real-time Phone Number with Auto-Country Detection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Phone Number (with Country Code) <span className="text-rose-400">*</span>
            </label>
            {/* Live Detected Country Badge */}
            {countryInfo.isoCode && (
              <CountryBadge
                country={countryInfo}
                size="sm"
                showName={true}
              />
            )}
          </div>

          <div className="relative">
            <input
              type="tel"
              required
              placeholder="e.g. +880 1712-345678 or +1 (415) 555-2671"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`w-full rounded-xl border bg-zinc-800/80 px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all ${
                phoneNumber && !isValid && countryInfo.isoCode
                  ? 'border-amber-500/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  : 'border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
            {isValid && (
              <div className="absolute right-3 top-2.5 text-emerald-400">
                <Check className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Real-time validation & formatting hints */}
          <div className="mt-1.5 flex items-center justify-between text-xs">
            {phoneNumber && !isValid && countryInfo.isoCode ? (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Number may be incomplete or invalid for {countryInfo.countryName}.
              </span>
            ) : phoneNumber && !countryInfo.isoCode ? (
              <span className="text-zinc-400">
                Tip: Include country code prefix (e.g. +1, +44, +880, +971)
              </span>
            ) : countryInfo.formattedInternational ? (
              <span className="text-zinc-400 font-mono">
                Detected: {countryInfo.formattedInternational} ({countryInfo.countryCode})
              </span>
            ) : (
              <span className="text-zinc-500">
                Instant auto-detection via libphonenumber-js
              </span>
            )}
          </div>
        </div>

        {/* Company & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Company / Brand
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Tech Solutions"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="lead@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Niche / Industry */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Target Industry Niche *
          </label>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
          >
            {niches.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
            <option value="General">General / Other</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Tags (comma separated)
          </label>
          <input
            type="text"
            placeholder="High Ticket, Decision Maker, Q4 Focus"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Add Lead & Schedule Stage 0
          </button>
        </div>
      </form>
    </Modal>
  );
};
