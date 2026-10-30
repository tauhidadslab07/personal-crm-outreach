/**
 * Domain extraction and formatting utilities for Nexus CRM
 */

export function extractDomain(input?: string): string {
  if (!input) return '';
  let str = input.trim().toLowerCase();
  
  // Ignore null, undefined, or empty markers
  if (str === 'null' || str === 'undefined' || str === 'n/a' || str === 'none') {
    return '';
  }

  // Filter out Google Search, Google Maps, and Google Ad redirect links
  if (
    str.includes('google.com/maps') ||
    str.includes('maps.google.') ||
    str.includes('google.com/aclk') ||
    str.includes('google.com/search') ||
    str.includes('google.com/url')
  ) {
    return '';
  }

  // Strip protocol
  str = str.replace(/^https?:\/\//i, '');
  // Strip www
  str = str.replace(/^www\./i, '');
  // Strip path, query params, hash
  str = str.split('/')[0].split('?')[0].split('#')[0];
  // Strip port or trailing punctuation
  str = str.replace(/[:].*$/, '').trim();

  // If host ends with google.com or is too short
  if (str === 'google.com' || str.endsWith('.google.com') || !str.includes('.')) {
    return '';
  }

  return str;
}

export function getEffectiveDomain(
  website?: string,
  email?: string
): { domain: string; source: 'website' | 'email' | 'none' } {
  if (website && website.trim()) {
    const d = extractDomain(website);
    if (d && d.includes('.')) {
      return { domain: d, source: 'website' };
    }
  }

  if (email && email.includes('@')) {
    const rawDomain = email.split('@')[1]?.toLowerCase().trim();
    const commonFreeMail = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'mail.com',
      'aol.com',
      'proton.me',
      'protonmail.com',
      'zoho.com',
    ];
    if (rawDomain && rawDomain.includes('.') && !commonFreeMail.includes(rawDomain)) {
      return { domain: rawDomain, source: 'email' };
    }
  }

  return { domain: '', source: 'none' };
}

export function formatUrlForVisiting(domainOrUrl: string): string {
  if (!domainOrUrl) return '';
  const trimmed = domainOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
