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
  Globe,
  ExternalLink,
  Building2,
  Code,
} from 'lucide-react';
import { CountryBadge } from '../common/CountryBadge';
import { cleanCompanyName, cleanContactName } from '@/lib/cleaner';
import { parseExcelWorkbook, RawImportLead } from '@/lib/excel';
import { classifyLeadNiche, ClassifiedNiche } from '@/lib/classifier';

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
  website?: string;
  niche: ClassifiedNiche;
  country: ReturnType<typeof parsePhoneAndDetectCountry>;
  isValid: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
}

const SAMPLE_BULK_INPUT = `Tanvir Ahmed (Web Dev), +880 1712-345678, Apex Tech Solutions - Best Web Design Agency in Dubai | SEO, https://apextechsolutions.com
Sarah Jenkins, +1 (415) 555-2671, CloudScale AI LLC (San Francisco), cloudscaleai.com
Oliver Smith (Freelance Web Developer), +44 20 7946 0958, Oliver Smith Portfolio, https://oliversmith.dev
Zayed Al-Mansoor, +971 50 123 4567, Gulf Oasis Web Studio (Dubai, UAE), gulfoasis.ae
Maximilian Weber, +49 151 23456789, Berlin SaaS Hub GmbH - Top App Builders, https://berlinsaashub.de
Elena Rostova (Frontend Engineer), +1 (647) 555-0199, Independent Freelancer, https://elenacodes.dev
Marcus Tan, +65 9123 4567, LionCity Tech Solutions Pte Ltd, lioncitytech.com
Liam O'Connor (Fullstack Dev), +61 412 345 678, Sydney Media Group, https://sydneymediagroup.com.au`;

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

  // Niche assignment mode: 'auto' (smart detect per lead) or specific niche
  const [batchNiche, setBatchNiche] = useState<string>('auto');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [autoCleanCompany, setAutoCleanCompany] = useState(true);

  // Preview filtering (All, Agency only, Developer only, Has Website)
  const [previewFilter, setPreviewFilter] = useState<'all' | 'agency' | 'developer' | 'website'>('all');

  // Manual row overrides for niche
  const [rowNicheOverrides, setRowNicheOverrides] = useState<Record<number, ClassifiedNiche>>({});

  // File Upload Handler (.xlsx, .xls, .csv)
  const handleFileProcess = async (file: File) => {
    setFileError(null);
    setIsProcessingFile(true);
    setRowNicheOverrides({});

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
    setRowNicheOverrides({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert raw leads from either Excel or Text Paste into structured RawImportLead[]
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
      let website = '';

      // Check each part for email and website
      const remainingParts: string[] = [];
      parts.forEach((p) => {
        if (!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p)) {
          email = p;
        } else if (
          !website &&
          (/^https?:\/\//i.test(p) ||
            /^www\./i.test(p) ||
            /^[a-zA-Z0-9-]+\.(com|net|org|io|dev|agency|co|app|ae|qa|uk|us|de|ca|tech|ai|design|me)(\/.*)?$/i.test(p))
        ) {
          website = p.startsWith('http') ? p : `https://${p}`;
        } else {
          remainingParts.push(p);
        }
      });

      if (remainingParts.length >= 2) {
        const part0HasDigits = /\d{4,}/.test(remainingParts[0]);
        const part1HasDigits = /\d{4,}/.test(remainingParts[1]);

        if (part0HasDigits && !part1HasDigits) {
          phoneRaw = remainingParts[0];
          name = remainingParts[1];
          company = remainingParts[2] || '';
        } else {
          name = remainingParts[0];
          phoneRaw = remainingParts[1];
          company = remainingParts[2] || '';
        }
      } else if (remainingParts.length === 1) {
        if (/\d{5,}/.test(remainingParts[0])) {
          phoneRaw = remainingParts[0];
          name = 'Prospect';
        } else {
          name = remainingParts[0];
          phoneRaw = '';
        }
      }

      const detectedNiche = classifyLeadNiche({
        name,
        company,
        website,
        email,
        raw: line,
      });

      return {
        name,
        phoneRaw,
        company: company || undefined,
        email: email || undefined,
        website: website || undefined,
        detectedNiche,
      };
    });
  }, [importMode, excelLeads, inputText]);

  // Live parser with in-batch & CRM duplicate detection + Smart Cleaner + Niche Assignment
  const parsedRows: ParsedRow[] = useMemo(() => {
    if (rawLeadsToProcess.length === 0) return [];

    const seenPhonesInBatch = new Set<string>();
    const seenEmailsInBatch = new Set<string>();

    return rawLeadsToProcess.map((item, idx) => {
      const name = item.name.trim();
      const phoneRaw = item.phoneRaw.trim();
      const company = item.company?.trim() || '';
      const email = item.email?.trim() || '';
      const website = item.website?.trim() || '';

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

      // Niche resolution: manual override > explicit batch niche > auto-detected niche
      const computedNiche: ClassifiedNiche =
        rowNicheOverrides[idx] ||
        (batchNiche === 'auto'
          ? item.detectedNiche ||
            classifyLeadNiche({ name: finalName, company: finalCompany, website, email })
          : (batchNiche as ClassifiedNiche));

      return {
        raw: `${name}, ${phoneRaw}${company ? `, ${company}` : ''}`,
        name: finalName,
        phoneRaw,
        company: finalCompany,
        email: email || undefined,
        website: website || undefined,
        niche: computedNiche,
        country,
        isValid,
        isDuplicate,
        duplicateReason,
      };
    });
  }, [rawLeadsToProcess, leads, autoCleanCompany, batchNiche, rowNicheOverrides]);

  // Counts
  const validFreshCount = parsedRows.filter((r) => r.isValid && !r.isDuplicate).length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const agencyCount = parsedRows.filter((r) => r.niche === 'Website Development Agency').length;
  const devCount = parsedRows.filter((r) => r.niche === 'Website Developer').length;
  const websiteCount = parsedRows.filter((r) => Boolean(r.website)).length;

  const importableCount = skipDuplicates
    ? validFreshCount
    : parsedRows.filter((r) => r.isValid).length;

  // Filtered rows for the preview table
  const displayedPreviewRows = useMemo(() => {
    return parsedRows.filter((r) => {
      if (previewFilter === 'agency') return r.niche === 'Website Development Agency';
      if (previewFilter === 'developer') return r.niche === 'Website Developer';
      if (previewFilter === 'website') return Boolean(r.website);
      return true;
    });
  }, [parsedRows, previewFilter]);

  // Toggle niche for a specific row in the preview table
  const toggleRowNiche = (index: number) => {
    const current = parsedRows[index]?.niche;
    const next: ClassifiedNiche =
      current === 'Website Development Agency' ? 'Website Developer' : 'Website Development Agency';

    setRowNicheOverrides((prev) => ({
      ...prev,
      [index]: next,
    }));
  };

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
        website: r.website || undefined,
        niche: r.niche,
      })),
      batchNiche === 'auto' ? undefined : batchNiche
    );

    // Reset and close
    setInputText('');
    setExcelLeads([]);
    setUploadedFileName(null);
    setRowNicheOverrides({});
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
      subtitle="Upload Excel (.xlsx, .xls, .csv) or paste leads with automatic Agency vs Developer classification"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Niche Mode Selector: Auto-Classify or Fixed Batch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Niche Classification Strategy:
            </label>
            <p className="text-[11px] text-zinc-400">
              Categorize into &ldquo;Website Development Agency&rdquo; vs &ldquo;Website Developer&rdquo;
            </p>
          </div>
          <select
            value={batchNiche}
            onChange={(e) => {
              setBatchNiche(e.target.value);
              setRowNicheOverrides({});
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none font-bold"
          >
            <option value="auto">⚡ Smart Auto-Classify (Agency vs Developer)</option>
            <option value="Website Development Agency">🏢 Website Development Agency Only</option>
            <option value="Website Developer">💻 Website Developer Only</option>
            {niches
              .filter(
                (n) =>
                  n.name !== 'Website Development Agency' && n.name !== 'Website Developer'
              )
              .map((n) => (
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
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-zinc-400">
                    <span className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 font-mono text-zinc-300">Auto-Detects Columns</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">WhatsApp / Phone</span>
                    <span>•</span>
                    <span>Name</span>
                    <span>•</span>
                    <span>Company</span>
                    <span>•</span>
                    <span className="text-cyan-400 font-medium">🌐 Website URL</span>
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
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 flex-wrap">
                      <span>✓ Loaded {excelLeads.length} rows</span>
                      <span>•</span>
                      <span className="text-cyan-300">🏢 {agencyCount} Agencies</span>
                      <span>•</span>
                      <span className="text-emerald-300">💻 {devCount} Developers</span>
                      {websiteCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-blue-300">🌐 {websiteCount} Websites</span>
                        </>
                      )}
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
                Parsing spreadsheet rows, classifying niches &amp; detecting websites...
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL TEXTAREA PASTE */}
        {importMode === 'paste' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Paste Leads (One per line: Name, Phone, Company, Website)
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline-offset-2 hover:underline transition-all"
              >
                Load Sample 8-Lead Batch (Mixed)
              </button>
            </div>

            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tanvir Ahmed, +880 1712-345678, Apex Tech Solutions, https://apextech.com\nSarah Jenkins, +1 (415) 555-2671, CloudScale AI, cloudscaleai.com\nOliver Smith (Freelance Web Dev), +44 7911 123456, oliversmith.dev`}
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
                Contacts matching phone numbers or emails already in your CRM or repeated within this batch are highlighted.
              </p>
            </div>
          </div>
        )}

        {/* Live Parse Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2.5">
            {/* Preview Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-zinc-200">
                Live Parse Preview ({importableCount} importable of {parsedRows.length})
              </span>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    previewFilter === 'all'
                      ? 'bg-zinc-200 text-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All ({parsedRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('agency')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    previewFilter === 'agency'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/40'
                  }`}
                >
                  <Building2 className="h-3 w-3" />
                  Agencies ({agencyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('developer')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    previewFilter === 'developer'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'
                  }`}
                >
                  <Code className="h-3 w-3" />
                  Developers ({devCount})
                </button>
                {websiteCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('website')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      previewFilter === 'website'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-950/40 text-blue-300 border border-blue-500/30 hover:bg-blue-900/40'
                    }`}
                  >
                    <Globe className="h-3 w-3" />
                    With Website ({websiteCount})
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-2 divide-y divide-zinc-800/60">
              {displayedPreviewRows.map((row, idx) => {
                const originalIndex = parsedRows.indexOf(row);
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-2 text-xs hover:bg-zinc-900/60 rounded-lg transition-colors gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono text-zinc-500 w-5 pt-0.5">
                        #{originalIndex + 1}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-100 truncate max-w-[150px]">
                            {row.name}
                          </span>
                          {row.company && (
                            <span className="text-[11px] text-zinc-400 truncate max-w-[130px]">
                              • {row.company}
                            </span>
                          )}
                          {row.email && (
                            <span className="text-[10px] text-zinc-500 truncate max-w-[130px]">
                              ({row.email})
                            </span>
                          )}
                        </div>

                        {/* Phone & Website URL Row */}
                        <div className="flex items-center gap-2.5 font-mono text-zinc-400 text-[11px] flex-wrap">
                          <span>{row.phoneRaw || 'Missing phone'}</span>
                          {row.website && (
                            <a
                              href={row.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-sans text-cyan-400 hover:text-cyan-300 hover:underline max-w-[180px] truncate"
                              title={row.website}
                            >
                              <Globe className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {row.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                              </span>
                              <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
                            </a>
                          )}
                          {row.isDuplicate && row.duplicateReason && (
                            <span className="text-[10px] text-amber-400 font-sans">
                              • {row.duplicateReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Badges: Niche classification & Validity */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Interactive Niche Badge (Click to toggle Agency vs Developer) */}
                      <button
                        type="button"
                        onClick={() => toggleRowNiche(originalIndex)}
                        title="Click to toggle between Website Development Agency and Website Developer"
                        className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                          row.niche === 'Website Development Agency'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        }`}
                      >
                        {row.niche === 'Website Development Agency' ? (
                          <>
                            <Building2 className="h-3 w-3 text-cyan-400" />
                            <span>Agency</span>
                          </>
                        ) : (
                          <>
                            <Code className="h-3 w-3 text-emerald-400" />
                            <span>Developer</span>
                          </>
                        )}
                      </button>

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
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
          <div className="space-y-0.5">
            <span className="text-xs text-zinc-300 font-semibold block">
              {importableCount > 0
                ? `${importableCount} lead${importableCount === 1 ? '' : 's'} ready (${agencyCount} Agencies, ${devCount} Developers)`
                : 'Select an Excel file or paste rows above'}
            </span>
            <span className="text-[11px] text-zinc-500 block">
              📥 All leads enter your Leads Pool. You can pick and queue them into Today&apos;s Work anytime.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
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
              Import {importableCount} Leads into Pool
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
