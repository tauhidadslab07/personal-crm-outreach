'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from '@/lib/phone';
import { useCRMStore } from '@/lib/store';
import { LeadSource } from '@/types/crm';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { CountryBadge } from '../common/CountryBadge';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  raw: string;
  name: string;
  phoneRaw: string;
  company?: string;
  source: LeadSource;
  country: ReturnType<typeof parsePhoneAndDetectCountry>;
  isValid: boolean;
}

const SAMPLE_BULK_INPUT = `Tanvir Ahmed, +880 1712-345678, LinkedIn, Apex Tech
Sarah Jenkins, +1 (415) 555-2671, Referral, CloudScale AI
Oliver Smith, +44 20 7946 0958, Cold Inbound, FinEdge Capital
Zayed Al-Mansoor, +971 50 123 4567, Conference, Gulf Oasis
Maximilian Weber, +49 151 23456789, Twitter/X, Berlin SaaS Hub
Elena Rostova, +1 (647) 555-0199, Website, NorthStar
Marcus Tan, +65 9123 4567, LinkedIn, LionCity
Liam O'Connor, +61 412 345 678, Upwork, Sydney Media`;

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const addBulkLeads = useCRMStore((s) => s.addBulkLeads);
  const niches = useCRMStore((s) => s.niches);
  const [inputText, setInputText] = useState('');
  const [batchNiche, setBatchNiche] = useState(niches[0]?.name || 'General');

  // Live parser for lines
  const parsedRows: ParsedRow[] = useMemo(() => {
    if (!inputText.trim()) return [];

    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line) => {
      // Split by comma or tab or semicolon
      const parts = line.split(/[,;\t]+/).map((p) => p.trim());
      let name = '';
      let phoneRaw = '';
      let source: LeadSource = 'LinkedIn';
      let company = '';

      if (parts.length >= 2) {
        // Test which part looks like phone
        const part0HasDigits = /\d{4,}/.test(parts[0]);
        const part1HasDigits = /\d{4,}/.test(parts[1]);

        if (part0HasDigits && !part1HasDigits) {
          // Phone, Name format
          phoneRaw = parts[0];
          name = parts[1];
          source = (parts[2] as LeadSource) || 'LinkedIn';
          company = parts[3] || '';
        } else {
          // Name, Phone format
          name = parts[0];
          phoneRaw = parts[1];
          source = (parts[2] as LeadSource) || 'LinkedIn';
          company = parts[3] || '';
        }
      } else if (parts.length === 1) {
        // Just phone or name
        if (/\d{5,}/.test(parts[0])) {
          phoneRaw = parts[0];
          name = 'Prospect';
        } else {
          name = parts[0];
          phoneRaw = '';
        }
      }

      const country = parsePhoneAndDetectCountry(phoneRaw);
      const isValid = Boolean(name && phoneRaw && country.countryCode);

      return {
        raw: line,
        name: name || 'Unnamed Lead',
        phoneRaw,
        company,
        source,
        country,
        isValid,
      };
    });
  }, [inputText]);

  const validCount = parsedRows.filter((r) => r.isValid).length;

  const handleImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    addBulkLeads(
      validRows.map((r) => ({
        name: r.name,
        phoneRaw: r.phoneRaw,
        company: r.company || undefined,
        source: r.source,
        niche: batchNiche,
      })),
      batchNiche
    );

    setInputText('');
    onClose();
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_BULK_INPUT);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rapid Bulk Lead Importer"
      subtitle="Paste 10-20 leads at once (formats: Name, Phone, Source, Company or Phone, Name)"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Niche Selector for the Batch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
          <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Assign Industry Niche to this Batch:
          </label>
          <select
            value={batchNiche}
            onChange={(e) => setBatchNiche(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none font-medium"
          >
            {niches.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
            <option value="General">General</option>
          </select>
        </div>

        {/* Input Textarea Header */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Paste Leads (One per line)
          </label>
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline-offset-2 hover:underline transition-all"
          >
            Load Sample 8-Lead Batch
          </button>
        </div>

        <textarea
          rows={5}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Tanvir Ahmed, +880 1712-345678, LinkedIn, Apex Tech\nSarah Jenkins, +1 (415) 555-2671, Referral, CloudScale\nOliver Smith, +44 7911 123456, Cold Inbound`}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 text-xs sm:text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
        />

        {/* Live Parse Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-zinc-200">
                Live Parse Preview ({validCount} valid of {parsedRows.length})
              </span>
              <span>Auto-detecting country & WhatsApp E.164</span>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-2 divide-y divide-zinc-800/60">
              {parsedRows.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-2 text-xs hover:bg-zinc-900/60 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono text-zinc-500 w-4">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100 truncate max-w-[130px]">
                          {row.name}
                        </span>
                        {row.company && (
                          <span className="text-[11px] text-zinc-400 truncate max-w-[100px]">
                            • {row.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-zinc-400 text-[11px]">
                        <span>{row.phoneRaw || 'Missing phone'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {row.country.isoCode ? (
                      <CountryBadge country={row.country} size="sm" showName={true} />
                    ) : (
                      <span className="text-[10px] text-zinc-500">No code</span>
                    )}
                    {row.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-400">
            {validCount > 0
              ? `${validCount} leads ready to batch insert into Stage 0`
              : 'Add rows above to begin batch import'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validCount === 0}
              onClick={handleImport}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
            >
              <UploadCloud className="h-4 w-4" />
              Batch Import {validCount} Leads
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
