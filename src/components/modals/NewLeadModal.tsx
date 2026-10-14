'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { CountryBadge } from '../common/CountryBadge';
import { useCRMStore } from '@/lib/store';
import { getAllCountries, parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from '@/lib/phone';
import { CountryCode } from 'libphonenumber-js';
import { AlertTriangle, Check, UserPlus, Globe } from 'lucide-react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNiche?: string;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, initialNiche }) => {
  const addLead = useCRMStore((s) => s.addLead);
  const niches = useCRMStore((s) => s.niches);

  const countryList = useMemo(() => getAllCountries(), []);

  const [selectedCountryIso, setSelectedCountryIso] = useState<CountryCode>('BD');
  const [localNumber, setLocalNumber] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [niche, setNiche] = useState(initialNiche || niches[0]?.name || 'General');

  // Sync initialNiche when opened
  React.useEffect(() => {
    if (initialNiche) {
      setNiche(initialNiche);
    }
  }, [initialNiche]);

  const currentCountryOption = useMemo(() => {
    return (
      countryList.find((c) => c.iso === selectedCountryIso) ||
      countryList[0] || {
        iso: 'BD' as CountryCode,
        name: 'Bangladesh',
        code: '+880',
        flag: '🇧🇩',
      }
    );
  }, [countryList, selectedCountryIso]);

  // Compute full international number
  const fullPhoneNumber = useMemo(() => {
    const raw = localNumber.trim();
    if (!raw) return '';
    if (raw.startsWith('+')) {
      return raw;
    }
    // Remove leading zeroes if entered for local formatting
    const cleanDigits = raw.replace(/^0+/, '');
    return `${currentCountryOption.code} ${cleanDigits}`;
  }, [localNumber, currentCountryOption]);

  // Real-time phone parsing & country info
  const countryInfo = useMemo(() => {
    if (!fullPhoneNumber) {
      return {
        isoCode: currentCountryOption.iso,
        countryCode: currentCountryOption.code,
        countryName: currentCountryOption.name,
        flagEmoji: currentCountryOption.flag,
        isValid: false,
        formattedInternational: '',
        e164: '',
      };
    }
    return parsePhoneAndDetectCountry(fullPhoneNumber, selectedCountryIso);
  }, [fullPhoneNumber, selectedCountryIso, currentCountryOption]);

  const handleCountryChange = (iso: CountryCode) => {
    setSelectedCountryIso(iso);
  };

  const handleLocalNumberChange = (val: string) => {
    // If user pasted a full international number with '+'
    if (val.trim().startsWith('+')) {
      const parsed = parsePhoneAndDetectCountry(val);
      if (parsed.isoCode) {
        setSelectedCountryIso(parsed.isoCode as CountryCode);
        const national = val.trim().replace(parsed.countryCode, '').trim();
        setLocalNumber(national);
        return;
      }
    }
    setLocalNumber(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localNumber.trim() || !fullPhoneNumber.trim()) return;

    const sanitized = sanitizePhoneForWhatsApp(countryInfo.e164 || fullPhoneNumber);
    const finalName =
      name.trim() ||
      (company.trim()
        ? `${company.trim()} Contact`
        : `Lead (${currentCountryOption.code} ${sanitized ? sanitized.slice(-4) : 'Prospect'})`);

    addLead({
      name: finalName,
      phoneRaw: fullPhoneNumber.trim(),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      niche,
      tags: [],
    });

    // Reset & close
    setName('');
    setLocalNumber('');
    setCompany('');
    setEmail('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Target Lead"
      subtitle="Select country for auto country-code, enter local phone number, and schedule Initial Outreach"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Full Name <span className="text-[10px] lowercase text-zinc-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Tanvir Ahmed, Sarah Jenkins"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Real-time Phone Number with Dedicated Country Selector & Auto-Code (REQUIRED) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Phone Number <span className="text-rose-400">*</span>
            </label>
            {/* Live Detected Country Badge */}
            {countryInfo.isoCode && (
              <CountryBadge country={countryInfo} size="sm" showName={true} />
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Country Selector Dropdown */}
            <div className="relative sm:w-56 shrink-0">
              <select
                value={selectedCountryIso}
                onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
                className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-800/90 pl-3 pr-8 py-2.5 text-xs text-zinc-100 font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all"
              >
                {countryList.map((c) => (
                  <option key={c.iso} value={c.iso}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-3 text-zinc-400">
                <Globe className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Local Phone Number Input with Dial Code Badge */}
            <div className="relative flex-1">
              <div className="absolute left-3 top-2.5 flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400 select-none">
                <span>{currentCountryOption.flag}</span>
                <span>{currentCountryOption.code}</span>
              </div>
              <input
                type="tel"
                required
                placeholder="e.g. 1712-345678"
                value={localNumber}
                onChange={(e) => handleLocalNumberChange(e.target.value)}
                style={{
                  paddingLeft: `${Math.max(68, (currentCountryOption.code.length + 3) * 9)}px`,
                }}
                className={`w-full rounded-xl border bg-zinc-800/80 pr-10 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all ${
                  localNumber && !countryInfo.isValid && countryInfo.isoCode
                    ? 'border-amber-500/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    : 'border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
              {countryInfo.isValid && (
                <div className="absolute right-3 top-2.5 text-emerald-400">
                  <Check className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>

          {/* Real-time formatted number feedback */}
          <div className="mt-1.5 flex items-center justify-between text-xs">
            {localNumber && !countryInfo.isValid && countryInfo.isoCode ? (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Number may be incomplete or invalid for {currentCountryOption.name}.
              </span>
            ) : fullPhoneNumber ? (
              <span className="text-emerald-400/90 font-mono flex items-center gap-1.5">
                <span className="text-zinc-500">Auto WhatsApp Format:</span>
                <span className="font-bold">
                  {countryInfo.formattedInternational || fullPhoneNumber}
                </span>
              </span>
            ) : (
              <span className="text-zinc-500">
                Select your country and type local digits. Country code applies automatically.
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
            Target Industry Niche
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
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Add Lead & Schedule Stage 0
          </button>
        </div>
      </form>
    </Modal>
  );
};
