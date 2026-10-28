/**
 * Smart Name & Company Sanitizer for Nexus CRM
 * Cleans SEO-stuffed company names and titles commonly scraped from Google Maps, LinkedIn, and Directories.
 *
 * Example:
 * "Digital Pulse - Best Web Design Agency in Dubai | SEO & Branding" -> "Digital Pulse"
 * "Apex Web Studio LLC - Top Rated Shopify Experts (UK)" -> "Apex Web Studio"
 * "Sarwar Khan (Web Developer & Freelancer)" -> "Sarwar Khan"
 */

export function cleanCompanyName(raw?: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // 1. Cut off at common promotional delimiters (" - ", " | ", " – ", " — ", " : ", " • ")
  const delimiterMatch = cleaned.split(/\s+[-|–—:•]\s+/);
  if (delimiterMatch.length > 1 && delimiterMatch[0].trim().length >= 2) {
    cleaned = delimiterMatch[0].trim();
  }

  // 2. Strip trailing legal & company suffixes (e.g. LLC, Ltd, Pvt Ltd, Inc, FZ-LLC, DMCC)
  cleaned = cleaned.replace(/,\s*(LLC|L\.L\.C\.|Inc\.?|Ltd\.?|Pvt\.?\s*Ltd\.?|Corporation|Corp\.?|FZ-LLC|DMCC|FZE|GmbH|B\.V\.)\b/gi, '');
  cleaned = cleaned.replace(/\s+\b(LLC|L\.L\.C\.|Inc\.?|Ltd\.?|Pvt\.?\s*Ltd\.?|FZ-LLC|DMCC|FZE|GmbH|B\.V\.)\b$/gi, '');

  // 3. Strip common trailing parenthetical noise like "(Dubai)", "(UAE)", "(Best Agency)", "(Shopify Experts)"
  cleaned = cleaned.replace(/\s*\([^)]*(Dubai|UAE|Qatar|Agency|Developer|SEO|Design|Services|Experts|Company|London|UK|USA)[^)]*\)/gi, '');

  // 4. Strip leftover trailing hyphens, pipes, or commas
  cleaned = cleaned.replace(/[-|–—,:•]+$/, '').trim();

  // 5. Collapse duplicate whitespace
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned || raw.trim();
}

export function cleanContactName(raw?: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // 1. Strip parenthetical roles/titles like "Sarwar Khan (Web Developer)" -> "Sarwar Khan"
  cleaned = cleaned.replace(/\s*\([^)]+\)/g, '').trim();

  // 2. Strip formal prefixes like "Mr. ", "Ms. ", "Dr. "
  cleaned = cleaned.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '');

  // 3. Cut off at " - " if role is appended
  const parts = cleaned.split(/\s+[-|–—:•]\s+/);
  if (parts.length > 1 && parts[0].trim().length >= 2) {
    cleaned = parts[0].trim();
  }

  // 4. Collapse duplicate whitespace
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned || raw.trim();
}
