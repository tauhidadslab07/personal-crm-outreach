'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { CountryBadge } from '../common/CountryBadge';
import { useCRMStore } from '@/lib/store';
import { getAllCountries, parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from '@/lib/phone';
import { STAGE_TITLES } from '@/lib/date-utils';
import { CountryCode } from 'libphonenumber-js';
import { AlertTriangle, Check, UserPlus, Globe, ShieldAlert, ExternalLink, Mail, Building, Phone, Sparkles } from 'lucide-react';
import { Lead } from '@/types/crm';
import { cleanCompanyName, cleanContactName } from '@/lib/cleaner';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNiche?: string;
}

export interface MatchedDuplicateField {
  type: 'phone' | 'email' | 'company';
  label: string;
  value: string;
}

export interface DuplicateDetectionResult {
  lead: Lead;
  matchedFields: MatchedDuplicateField[];
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, initialNiche }) => {
  const addLead = useCRMStore((s) => s.addLead);
  const niches = useCRMStore((s) => s.niches);
  const leads = useCRMStore((s) => s.leads);
  const setSearchQuery = useCRMStore((s) => s.setSearchQuery);
  const setActiveTab = useCRMStore((s) => s.setActiveTab);

  const countryList = useMemo(() => getAllCountries(), []);

  const [selectedCountryIso, setSelectedCountryIso] = useState<CountryCode>('BD');
  const [localNumber, setLocalNumber] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [niche, setNiche] = useState(initialNiche || niches[0]?.name || 'General');
  const [allowDuplicate, setAllowDuplicate] = useState(false);

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

  // Comprehensive multi-field duplicate detection (Phone, Email, Company)
  const duplicateResults = useMemo<DuplicateDetectionResult[]>(() => {
    const results: DuplicateDetectionResult[] = [];
    const sanitized = fullPhoneNumber.trim()
      ? sanitizePhoneForWhatsApp(countryInfo.e164 || fullPhoneNumber)
      : '';
    const cleanEmail = email.trim().toLowerCase();
    const cleanCompany = company.trim().toLowerCase();

    leads.forEach((l) => {
      const matchedFields: MatchedDuplicateField[] = [];

      // Check phone match
      if (sanitized && sanitized.length >= 6) {
        const matchSanitized = l.phoneSanitized === sanitized;
        const matchRawDigits = l.phoneRaw && l.phoneRaw.replace(/\D/g, '') === sanitized;
        if (matchSanitized || matchRawDigits) {
          matchedFields.push({
            type: 'phone',
            label: 'Phone Number',
            value: l.phoneRaw,
          });
        }
      }

      // Check email match
      if (cleanEmail && l.email && l.email.trim().toLowerCase() === cleanEmail) {
        matchedFields.push({
          type: 'email',
          label: 'Email Address',
          value: l.email,
        });
      }

      // Check company match (length >= 3)
      if (
        cleanCompany &&
        cleanCompany.length >= 3 &&
        l.company &&
        l.company.trim().toLowerCase() === cleanCompany
      ) {
        matchedFields.push({
          type: 'company',
          label: 'Company / Brand',
          value: l.company,
        });
      }

      if (matchedFields.length > 0) {
        results.push({ lead: l, matchedFields });
      }
    });

    return results;
  }, [leads, fullPhoneNumber, countryInfo, email, company]);

  const primaryDuplicate = duplicateResults[0] || null;
  const isPhoneDuplicate = duplicateResults.some((d) => d.matchedFields.some((f) => f.type === 'phone'));
  const isEmailDuplicate = duplicateResults.some((d) => d.matchedFields.some((f) => f.type === 'email'));
  const isCompanyDuplicate = duplicateResults.some((d) => d.matchedFields.some((f) => f.type === 'company'));

  const handleJumpToLead = (targetLead: Lead) => {
    setSearchQuery(targetLead.phoneRaw || targetLead.name);
    setActiveTab('leads');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localNumber.trim() || !fullPhoneNumber.trim()) return;
    if (primaryDuplicate && !allowDuplicate) return;

    const cleanedContactName = cleanContactName(name);
    const cleanedCompanyName = cleanCompanyName(company);
    const sanitized = sanitizePhoneForWhatsApp(countryInfo.e164 || fullPhoneNumber);
    const finalName =
      cleanedContactName.trim() ||
      (cleanedCompanyName.trim()
        ? `${cleanedCompanyName.trim()} Contact`
        : `Lead (${currentCountryOption.code} ${sanitized ? sanitized.slice(-4) : 'Prospect'})`);

    addLead({
      name: finalName,
      phoneRaw: fullPhoneNumber.trim(),
      company: cleanedCompanyName.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      niche,
      tags: [],
    });

    // Reset & close
    setName('');
    setLocalNumber('');
    setCompany('');
    setEmail('');
    setWebsite('');
    setAllowDuplicate(false);
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
          {name.trim() && cleanContactName(name) !== name.trim() && (
            <button
              type="button"
              onClick={() => setName(cleanContactName(name))}
              className="mt-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-all"
            >
              <Sparkles className="h-3 w-3" />
              <span>Clean Name: &ldquo;{cleanContactName(name)}&rdquo; (Click to apply)</span>
            </button>
          )}
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

          {/* Duplicate Lead Detection Alert Banner */}
          {primaryDuplicate && (
            <div className="mt-3 rounded-2xl border border-rose-500/50 bg-rose-950/20 p-3.5 space-y-3 animate-in fade-in shadow-lg shadow-rose-950/30">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="rounded-lg bg-rose-500/20 p-1.5 text-rose-400 shrink-0 mt-0.5">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="space-y-1.5 text-zinc-200 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-rose-200 text-sm">
                      ⚠️ Duplicate Contact / Data Detected!
                    </p>
                    {primaryDuplicate.matchedFields.map((f, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300"
                      >
                        Match: {f.label} ({f.value})
                      </span>
                    ))}
                  </div>
                  <p className="text-zinc-300 text-xs">
                    This contact is already in your database as{' '}
                    <strong className="text-white">&ldquo;{primaryDuplicate.lead.name}&rdquo;</strong>
                    {primaryDuplicate.lead.company ? ` at ${primaryDuplicate.lead.company}` : ''}.
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span>
                      Current Status: <strong className="text-emerald-400">{STAGE_TITLES[primaryDuplicate.lead.currentStage]}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Niche: <strong className="text-zinc-300">{primaryDuplicate.lead.niche || 'General'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-rose-500/20 text-xs">
                <button
                  type="button"
                  onClick={() => handleJumpToLead(primaryDuplicate.lead)}
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold underline-offset-2 hover:underline transition-all text-left"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  View & Open Existing Lead in Pipeline
                </button>

                <label className="flex items-center gap-2 text-[11px] text-amber-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowDuplicate}
                    onChange={(e) => setAllowDuplicate(e.target.checked)}
                    className="rounded border-amber-500/40 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Allow adding duplicate record anyway</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Company & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Company / Brand
              </label>
              {isCompanyDuplicate && (
                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Duplicate
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. Apex Tech Solutions"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={`w-full rounded-xl border bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all ${
                isCompanyDuplicate
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
            {company.trim() && cleanCompanyName(company) !== company.trim() && (
              <button
                type="button"
                onClick={() => setCompany(cleanCompanyName(company))}
                className="mt-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-all"
              >
                <Sparkles className="h-3 w-3" />
                <span>Clean Suffix: &ldquo;{cleanCompanyName(company)}&rdquo; (Click to apply)</span>
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Email Address
              </label>
              {isEmailDuplicate && (
                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Duplicate
                </span>
              )}
            </div>
            <input
              type="email"
              placeholder="lead@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-xl border bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all ${
                isEmailDuplicate
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            Website URL / Portfolio <span className="text-[10px] lowercase text-zinc-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. apextech.com or https://company.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
          />
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
            disabled={!localNumber.trim() || (Boolean(primaryDuplicate) && !allowDuplicate)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-95 ${
              Boolean(primaryDuplicate) && !allowDuplicate
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50 cursor-pointer'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            {Boolean(primaryDuplicate) && !allowDuplicate
              ? '⚠️ Duplicate Warning Active'
              : 'Add Lead & Schedule Stage 0'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
