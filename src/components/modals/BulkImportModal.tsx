'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Modal } from './Modal';
import { parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from '@/lib/phone';
import { useCRMStore } from '@/lib/store';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
  Sparkles,
  FileSpreadsheet,
  FileUp,
  X,
} from 'lucide-react';
import { CountryBadge } from '../common/CountryBadge';
import { cleanCompanyName, cleanContactName } from '@/lib/cleaner';
import { parseExcelWorkbook, RawImportLead } from '@/lib/excel';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  raw: string;
  name: string;
  phoneRaw: string;
  company?: string;
  email?: string;
  country: ReturnType<typeof parsePhoneAndDetectCountry>;
  isValid: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
}

const SAMPLE_BULK_INPUT = `Tanvir Ahmed (Web Dev), +880 1712-345678, Apex Tech Solutions - Best Web Design Agency in Dubai | SEO
Sarah Jenkins, +1 (415) 555-2671, CloudScale AI LLC (San Francisco)
Oliver Smith, +44 20 7946 0958, FinEdge Capital Ltd. | Wealth Tech
Zayed Al-Mansoor, +971 50 123 4567, Gulf Oasis Web Studio (Dubai, UAE)
Maximilian Weber, +49 151 23456789, Berlin SaaS Hub GmbH - Top App Builders
Elena Rostova, +1 (647) 555-0199, NorthStar Digital Media | Branding
Marcus Tan, +65 9123 4567, LionCity Tech Solutions Pte Ltd
Liam O'Connor, +61 412 345 678, Sydney Media Group - Fullstack Developers`;

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const addBulkLeads = useCRMStore((s) => s.addBulkLeads);
  const niches = useCRMStore((s) => s.niches);
  const leads = useCRMStore((s) => s.leads);

  // Import mode: Excel (.xlsx, .xls, .csv) or Manual Paste Text
  const [importMode, setImportMode] = useState<'excel' | 'paste'>('excel');

  // Excel file upload state
  const [excelLeads, setExcelLeads] = useState<RawImportLead[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste text state
  const [inputText, setInputText] = useState('');

  // General settings
  const [batchNiche, setBatchNiche] = useState(niches[0]?.name || 'General');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [autoCleanCompany, setAutoCleanCompany] = useState(true);

  // File Upload Handler (.xlsx, .xls, .csv)
  const handleFileProcess = async (file: File) => {
    setFileError(null);
    setIsProcessingFile(true);

    try {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileNameLower = file.name.toLowerCase();
      const isValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));

      if (!isValidExt) {
        setFileError('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
        setIsProcessingFile(false);
        return;
      }

      const buffer = await file.arrayBuffer();
      const parsed = parseExcelWorkbook(buffer);

      if (parsed.length === 0) {
        setFileError('No valid contacts found. Ensure your spreadsheet contains a column with phone numbers or WhatsApp.');
        setExcelLeads([]);
        setUploadedFileName(null);
      } else {
        setExcelLeads(parsed);
        setUploadedFileName(file.name);
      }
    } catch (err: any) {
      console.error('Failed to parse Excel file:', err);
      setFileError('Failed to read spreadsheet file. Please verify file integrity.');
      setExcelLeads([]);
      setUploadedFileName(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleClearExcelFile = () => {
    setExcelLeads([]);
    setUploadedFileName(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert raw leads from either Excel or Text Paste into structured ParsedRows
  const rawLeadsToProcess = useMemo<RawImportLead[]>(() => {
    if (importMode === 'excel') {
      return excelLeads;
    }

    if (!inputText.trim()) return [];

    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line) => {
      const parts = line.split(/[,;\t]+/).map((p) => p.trim());
      let name = '';
      let phoneRaw = '';
      let company = '';
      let email = '';

      parts.forEach((p) => {
        if (!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p)) {
          email = p;
        }
      });

      if (parts.length >= 2) {
        const part0HasDigits = /\d{4,}/.test(parts[0]);
        const part1HasDigits = /\d{4,}/.test(parts[1]);

        if (part0HasDigits && !part1HasDigits) {
          phoneRaw = parts[0];
          name = parts[1];
          company = parts[2] && parts[2] !== email ? parts[2] : '';
        } else {
          name = parts[0];
          phoneRaw = parts[1];
          company = parts[2] && parts[2] !== email ? parts[2] : '';
        }
      } else if (parts.length === 1) {
        if (/\d{5,}/.test(parts[0])) {
          phoneRaw = parts[0];
          name = 'Prospect';
        } else {
          name = parts[0];
          phoneRaw = '';
        }
      }

      return {
        name,
        phoneRaw,
        company: company || undefined,
        email: email || undefined,
      };
    });
  }, [importMode, excelLeads, inputText]);

  // Live parser with in-batch & CRM duplicate detection + Smart Cleaner
  const parsedRows: ParsedRow[] = useMemo(() => {
    if (rawLeadsToProcess.length === 0) return [];

    const seenPhonesInBatch = new Set<string>();
    const seenEmailsInBatch = new Set<string>();

    return rawLeadsToProcess.map((item) => {
      const name = item.name.trim();
      const phoneRaw = item.phoneRaw.trim();
      const company = item.company?.trim() || '';
      const email = item.email?.trim() || '';

      const country = parsePhoneAndDetectCountry(phoneRaw);
      const sanitized = sanitizePhoneForWhatsApp(country.e164 || phoneRaw);
      const cleanEmail = email ? email.toLowerCase() : '';

      let isDuplicate = false;
      let duplicateReason = '';

      // 1. Check in-batch duplicate first
      if (sanitized && sanitized.length >= 6) {
        if (seenPhonesInBatch.has(sanitized)) {
          isDuplicate = true;
          duplicateReason = 'Repeated in this batch';
        }
      }
      if (!isDuplicate && cleanEmail && seenEmailsInBatch.has(cleanEmail)) {
        isDuplicate = true;
        duplicateReason = 'Email repeated in this batch';
      }

      // 2. Check against CRM database leads
      if (!isDuplicate && sanitized && sanitized.length >= 6) {
        const crmMatch = leads.find(
          (l) =>
            l.phoneSanitized === sanitized ||
            (l.phoneRaw && l.phoneRaw.replace(/\D/g, '') === sanitized)
        );
        if (crmMatch) {
          isDuplicate = true;
          duplicateReason = `Already in CRM (${crmMatch.name})`;
        }
      }

      if (!isDuplicate && cleanEmail) {
        const emailMatch = leads.find(
          (l) => l.email && l.email.trim().toLowerCase() === cleanEmail
        );
        if (emailMatch) {
          isDuplicate = true;
          duplicateReason = `Email already in CRM (${emailMatch.name})`;
        }
      }

      // Record in batch tracking if not duplicate
      if (sanitized) seenPhonesInBatch.add(sanitized);
      if (cleanEmail) seenEmailsInBatch.add(cleanEmail);

      // Apply smart cleaning if enabled
      const finalName = autoCleanCompany && name ? cleanContactName(name) : (name || 'Unnamed Lead');
      const finalCompany = autoCleanCompany && company ? cleanCompanyName(company) : company;
      const isValid = Boolean(finalName && phoneRaw && country.countryCode);

      return {
        raw: `${name}, ${phoneRaw}${company ? `, ${company}` : ''}`,
        name: finalName,
        phoneRaw,
        company: finalCompany,
        email: email || undefined,
        country,
        isValid,
        isDuplicate,
        duplicateReason,
      };
    });
  }, [rawLeadsToProcess, leads, autoCleanCompany]);

  const validFreshCount = parsedRows.filter((r) => r.isValid && !r.isDuplicate).length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const importableCount = skipDuplicates
    ? validFreshCount
    : parsedRows.filter((r) => r.isValid).length;

  const handleImport = () => {
    const rowsToImport = skipDuplicates
      ? parsedRows.filter((r) => r.isValid && !r.isDuplicate)
      : parsedRows.filter((r) => r.isValid);

    if (rowsToImport.length === 0) return;

    addBulkLeads(
      rowsToImport.map((r) => ({
        name: r.name,
        phoneRaw: r.phoneRaw,
        company: r.company || undefined,
        email: r.email || undefined,
        niche: batchNiche,
      })),
      batchNiche
    );

    // Reset and close
    setInputText('');
    setExcelLeads([]);
    setUploadedFileName(null);
    onClose();
  };

  const handleLoadSample = () => {
    setImportMode('paste');
    setInputText(SAMPLE_BULK_INPUT);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rapid Bulk Lead Importer"
      subtitle="Import leads from Excel (.xlsx, .xls, .csv) or paste text directly"
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

        {/* Smart Sanitizer Toggle (SEO & Suffix Auto-Cleaner) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl text-xs">
          <div className="flex items-start sm:items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-zinc-200">
              <strong className="text-emerald-300">Smart Name &amp; Company Cleaner:</strong> Auto-strips SEO junk like <em>&ldquo;- Best Web Design Agency | SEO&rdquo;</em>, <em>&ldquo;LLC&rdquo;</em>, &amp; titles so your outreach looks 100% human.
            </span>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold cursor-pointer select-none shrink-0 self-end sm:self-auto">
            <input
              type="checkbox"
              checked={autoCleanCompany}
              onChange={(e) => setAutoCleanCompany(e.target.checked)}
              className="rounded border-emerald-500/40 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <span>Auto-Clean ON</span>
          </label>
        </div>

        {/* Format Mode Tabs: Excel File vs Text Paste */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setImportMode('excel')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              importMode === 'excel'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Upload Excel / CSV (.xlsx, .xls, .csv)
          </button>
          <button
            type="button"
            onClick={() => setImportMode('paste')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              importMode === 'paste'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            Paste Text (Quick)
          </button>
        </div>

        {/* TAB 1: EXCEL / CSV DRAG & DROP UPLOAD */}
        {importMode === 'excel' && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!uploadedFileName ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/40'
                    : 'border-zinc-700 hover:border-emerald-500/60 bg-zinc-900/50 hover:bg-zinc-900/80'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                    <FileUp className="h-8 w-8 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100">
                      Click to choose or drag &amp; drop your Excel / CSV file
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Supports <strong className="text-zinc-200">.xlsx, .xls, and .csv</strong> from Google Maps Scraper, Apollo, Outscraper, etc.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-zinc-500">
                    <span className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">Auto-Detects Columns</span>
                    <span>•</span>
                    <span>WhatsApp / Phone</span>
                    <span>•</span>
                    <span>Name</span>
                    <span>•</span>
                    <span>Company</span>
                    <span>•</span>
                    <span>Email</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-zinc-900 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-100 truncate">
                      {uploadedFileName}
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      ✓ Successfully loaded {excelLeads.length} contact rows
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    type="button"
                    onClick={handleClearExcelFile}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove File"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {fileError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/20 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {isProcessingFile && (
              <div className="text-center py-2 text-xs text-emerald-400 animate-pulse">
                Parsing spreadsheet rows and detecting phone columns...
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL TEXTAREA PASTE */}
        {importMode === 'paste' && (
          <div className="space-y-2">
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
              placeholder={`Tanvir Ahmed, +880 1712-345678, Apex Tech\nSarah Jenkins, +1 (415) 555-2671, CloudScale\nOliver Smith, +44 7911 123456, Cold Inbound`}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 text-xs sm:text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        )}

        {/* Duplicate Warning Banner */}
        {duplicateCount > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/25 p-3 text-xs text-amber-200 animate-in fade-in">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-amber-300">
                  ⚠️ {duplicateCount} Duplicate Contact{duplicateCount === 1 ? '' : 's'} Detected
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded border-amber-500/40 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Auto-skip duplicates ({validFreshCount} fresh leads)</span>
                </label>
              </div>
              <p className="text-[11px] text-zinc-400">
                Contacts matching phone numbers or emails already in your CRM or repeated within this file are highlighted.
              </p>
            </div>
          </div>
        )}

        {/* Live Parse Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-zinc-200">
                Live Parse Preview ({importableCount} importable of {parsedRows.length})
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
                        {row.email && (
                          <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                            ({row.email})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-zinc-400 text-[11px]">
                        <span>{row.phoneRaw || 'Missing phone'}</span>
                        {row.isDuplicate && row.duplicateReason && (
                          <span className="text-[10px] text-amber-400 font-sans">
                            • {row.duplicateReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {row.country.isoCode ? (
                      <CountryBadge country={row.country} size="sm" showName={true} />
                    ) : (
                      <span className="text-[10px] text-zinc-500">No code</span>
                    )}
                    {row.isDuplicate ? (
                      <span
                        title={row.duplicateReason}
                        className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1"
                      >
                        <ShieldAlert className="h-3 w-3 shrink-0" />
                        {skipDuplicates ? 'Duplicate (Skipped)' : 'Duplicate'}
                      </span>
                    ) : row.isValid ? (
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
            {importableCount > 0
              ? `${importableCount} lead${importableCount === 1 ? '' : 's'} ready to batch insert ${
                  duplicateCount > 0 && skipDuplicates
                    ? `(${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} safely skipped)`
                    : ''
                }`
              : 'Select an Excel file or paste rows above'}
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
              disabled={importableCount === 0}
              onClick={handleImport}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              Batch Import {importableCount} Leads
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
