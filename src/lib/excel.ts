/**
 * Intelligent Excel & CSV Parser for Nexus CRM
 * Parses .xlsx, .xls, and .csv files and auto-detects column headers for Phone, Name, Company, and Email.
 */
import * as XLSX from 'xlsx';

export interface RawImportLead {
  name: string;
  phoneRaw: string;
  company?: string;
  email?: string;
}

export function parseExcelWorkbook(fileBuffer: ArrayBuffer): RawImportLead[] {
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
  if (!rows || rows.length === 0) return [];

  // Helper to find matching column key case-insensitively
  const findKey = (row: Record<string, any>, candidates: string[]): string | undefined => {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const exact = keys.find((k) => k.trim().toLowerCase() === c.toLowerCase());
      if (exact && row[exact] !== undefined && String(row[exact]).trim() !== '') return exact;
      const sub = keys.find((k) => k.trim().toLowerCase().includes(c.toLowerCase()));
      if (sub && row[sub] !== undefined && String(row[sub]).trim() !== '') return sub;
    }
    return undefined;
  };

  const results: RawImportLead[] = [];

  for (const row of rows) {
    // 1. Phone key detection (Google Maps, Apollo, Outscraper, Instant Data Scraper, etc.)
    const phoneKey = findKey(row, [
      'whatsapp',
      'phone',
      'mobile',
      'telephone',
      'contact_number',
      'phone_number',
      'phone number',
      'business phone',
      'contact phone',
      'tel',
      'cell',
      'number',
    ]);

    // 2. Name key detection
    const nameKey = findKey(row, [
      'full_name',
      'name',
      'contact_name',
      'first_name',
      'lead_name',
      'owner',
      'founder',
      'person',
      'lead name',
      'contact name',
    ]);

    // 3. Company key detection
    const companyKey = findKey(row, [
      'company_name',
      'company',
      'business_name',
      'business',
      'organization',
      'agency',
      'firm',
      'studio',
      'business name',
      'company name',
      'title',
    ]);

    // 4. Email key detection
    const emailKey = findKey(row, [
      'email',
      'mail',
      'e-mail',
      'contact_email',
      'business_email',
      'email address',
    ]);

    let phoneVal = phoneKey ? String(row[phoneKey]).trim() : '';
    let nameVal = nameKey ? String(row[nameKey]).trim() : '';
    let companyVal = companyKey ? String(row[companyKey]).trim() : '';
    let emailVal = emailKey ? String(row[emailKey]).trim() : '';

    // Fallback: If phone wasn't detected by header, scan row values for digit patterns
    if (!phoneVal) {
      for (const [, v] of Object.entries(row)) {
        const str = String(v).trim();
        const cleanDigits = str.replace(/\D/g, '');
        if (cleanDigits.length >= 6 && cleanDigits.length <= 16 && !str.includes('@')) {
          phoneVal = str;
          break;
        }
      }
    }

    // Fallback: If email wasn't detected by header, scan row values for '@'
    if (!emailVal) {
      for (const [, v] of Object.entries(row)) {
        const str = String(v).trim();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
          emailVal = str;
          break;
        }
      }
    }

    // If still no name, use company or default
    if (!nameVal && companyVal) {
      nameVal = `${companyVal} Contact`;
    }

    if (phoneVal) {
      results.push({
        name: nameVal || 'Prospect',
        phoneRaw: phoneVal,
        company: companyVal || undefined,
        email: emailVal || undefined,
      });
    }
  }

  return results;
}
