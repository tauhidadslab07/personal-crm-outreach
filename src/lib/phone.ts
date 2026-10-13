import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';
import { CountryInfo } from '@/types/crm';

// Convert ISO 3166-1 alpha-2 code to Flag Emoji (e.g. "US" -> 🇺🇸)
export function getFlagEmoji(isoCode: string): string {
  if (!isoCode || isoCode.length !== 2) return '🌐';
  const codePoints = isoCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Get localized full country name
const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

export function getCountryName(isoCode: string): string {
  if (!isoCode) return 'Unknown Country';
  try {
    return regionNames ? regionNames.of(isoCode.toUpperCase()) || isoCode : isoCode;
  } catch {
    return isoCode;
  }
}

/**
 * Universal WhatsApp Sanitizer:
 * Strips all non-digit characters (+, spaces, dashes, brackets, etc.)
 * Leaves standard international format: e.g. "8801712345678" or "14155552671"
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  // Remove everything except numbers
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly;
}

/**
 * Real-time Phone Parser & Country Detector
 * Uses libphonenumber-js to extract ISO country, calling code, full name, flag, and validity
 */
export function parsePhoneAndDetectCountry(input: string, defaultCountry?: CountryCode): CountryInfo {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      isoCode: '',
      countryCode: '',
      countryName: '',
      flagEmoji: '🌐',
      isValid: false,
      formattedInternational: '',
      e164: '',
    };
  }

  // Ensure prefix '+' if input starts with digits and resembles international format
  let numberToParse = trimmed;
  if (!numberToParse.startsWith('+')) {
    // If user typed e.g. "88017..." or "1415..." or "447...", test adding '+'
    numberToParse = `+${numberToParse}`;
  }

  let parsed = parsePhoneNumberFromString(numberToParse, defaultCountry);

  // If failed with +, try without + if defaultCountry provided
  if (!parsed && defaultCountry) {
    parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  }

  if (parsed && parsed.country) {
    const iso = parsed.country;
    const callingCode = `+${parsed.countryCallingCode}`;
    const flag = getFlagEmoji(iso);
    const name = getCountryName(iso);
    const isValid = parsed.isValid();
    const formatted = parsed.formatInternational();
    const e164 = parsed.format('E.164');

    return {
      isoCode: iso,
      countryCode: callingCode,
      countryName: name,
      flagEmoji: flag,
      isValid,
      formattedInternational: formatted,
      e164,
    };
  }

  // Fallback heuristic for partial numbers
  // Check common prefixes to give instant visual feedback before full number is completed
  const rawDigits = trimmed.replace(/\D/g, '');
  const prefixHints: Record<string, { iso: string; code: string }> = {
    '880': { iso: 'BD', code: '+880' },
    '44': { iso: 'GB', code: '+44' },
    '971': { iso: 'AE', code: '+971' },
    '49': { iso: 'DE', code: '+49' },
    '61': { iso: 'AU', code: '+61' },
    '91': { iso: 'IN', code: '+91' },
    '1': { iso: 'US', code: '+1' },
    '81': { iso: 'JP', code: '+81' },
    '33': { iso: 'FR', code: '+33' },
    '65': { iso: 'SG', code: '+65' },
    '966': { iso: 'SA', code: '+966' },
    '34': { iso: 'ES', code: '+34' },
    '39': { iso: 'IT', code: '+39' },
    '31': { iso: 'NL', code: '+31' },
  };

  for (const prefix of Object.keys(prefixHints).sort((a, b) => b.length - a.length)) {
    if (rawDigits.startsWith(prefix)) {
      const hint = prefixHints[prefix];
      return {
        isoCode: hint.iso,
        countryCode: hint.code,
        countryName: getCountryName(hint.iso),
        flagEmoji: getFlagEmoji(hint.iso),
        isValid: false, // Incomplete
        formattedInternational: trimmed,
        e164: `+${rawDigits}`,
      };
    }
  }

  return {
    isoCode: '',
    countryCode: '',
    countryName: 'Unrecognized',
    flagEmoji: '🌐',
    isValid: false,
    formattedInternational: trimmed,
    e164: trimmed,
  };
}
