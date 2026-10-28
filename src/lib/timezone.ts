/**
 * Timezone and Best-Time-To-Send Intelligence for Nexus CRM
 * Maps ISO codes and dial codes to representative UTC timezone offsets
 */

export interface TimezoneInfo {
  formattedTime: string; // e.g. "2:45 PM"
  hour24: number;
  timeOfDay: 'golden_window' | 'working_hours' | 'evening' | 'night' | 'early_morning';
  badgeLabel: string;
  badgeEmoji: string;
  badgeColor: 'emerald' | 'amber' | 'rose' | 'cyan';
  statusText: string;
}

// Approximate representative UTC offsets (in hours) for major countries
const COUNTRY_UTC_OFFSETS: Record<string, number> = {
  // North America
  US: -5, // Default EST (US spans -5 to -8)
  CA: -5, // Canada EST
  MX: -6,

  // Europe & UK
  GB: 0,  // UK GMT/BST
  UK: 0,
  IE: 0,
  DE: 1,  // Germany CET
  FR: 1,  // France
  NL: 1,  // Netherlands
  ES: 1,  // Spain
  IT: 1,  // Italy
  SE: 1,  // Sweden
  CH: 1,  // Switzerland
  PL: 1,  // Poland
  RO: 2,  // Romania
  UA: 2,  // Ukraine
  GR: 2,  // Greece

  // Middle East
  AE: 4,  // UAE (Dubai)
  SA: 3,  // Saudi Arabia
  QA: 3,  // Qatar
  KW: 3,  // Kuwait
  TR: 3,  // Turkey
  IL: 2,  // Israel

  // South Asia
  BD: 6,  // Bangladesh
  IN: 5.5,// India
  PK: 5,  // Pakistan
  LK: 5.5,// Sri Lanka
  NP: 5.75,// Nepal

  // Southeast & East Asia
  SG: 8,  // Singapore
  MY: 8,  // Malaysia
  ID: 7,  // Indonesia (Jakarta)
  TH: 7,  // Thailand
  VN: 7,  // Vietnam
  PH: 8,  // Philippines
  HK: 8,  // Hong Kong
  CN: 8,  // China
  JP: 9,  // Japan
  KR: 9,  // South Korea

  // Oceania
  AU: 10, // Australia (Sydney AEST)
  NZ: 12, // New Zealand

  // Latin America
  BR: -3, // Brazil (Brasilia)
  AR: -3, // Argentina
  CO: -5, // Colombia
  CL: -4, // Chile

  // Africa
  ZA: 2,  // South Africa
  NG: 1,  // Nigeria
  EG: 2,  // Egypt
  KE: 3,  // Kenya
};

/**
 * Calculates current local time and working-hours status for a country ISO code
 */
export function getProspectLocalTime(isoCode?: string): TimezoneInfo {
  const code = (isoCode || 'US').toUpperCase();
  const offsetHours = COUNTRY_UTC_OFFSETS[code] ?? -5; // Default to US EST if unknown

  const now = new Date();
  // Get current UTC time in milliseconds
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  // Compute target country time
  const targetDate = new Date(utcMs + offsetHours * 3600000);

  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();

  // 12-hour format string
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const minutePad = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedTime = `${hour12}:${minutePad} ${ampm}`;

  const totalMinutes = hours * 60 + minutes;

  // 1. Golden Outreach Window (10:30 AM - 1:00 PM, minutes 630 to 780): Peak open and reply rate!
  if (totalMinutes >= 630 && totalMinutes <= 780) {
    return {
      formattedTime,
      hour24: hours,
      timeOfDay: 'golden_window',
      badgeLabel: '🔥 Golden Window (10:30 AM - 1 PM)',
      badgeEmoji: '🔥',
      badgeColor: 'emerald',
      statusText: 'Golden Window! Highest response & open rate (10:30 AM - 1:00 PM local time).',
    };
  }

  // 2. Standard working hours (9 AM - 6 PM is prime outreach window)
  if (hours >= 9 && hours < 18) {
    return {
      formattedTime,
      hour24: hours,
      timeOfDay: 'working_hours',
      badgeLabel: 'Prime Time (Working Hours)',
      badgeEmoji: '🟢',
      badgeColor: 'emerald',
      statusText: 'Best time to send! High likelihood of instant reply.',
    };
  }

  if (hours >= 18 && hours < 21) {
    return {
      formattedTime,
      hour24: hours,
      timeOfDay: 'evening',
      badgeLabel: 'Evening / Relaxed',
      badgeEmoji: '🟡',
      badgeColor: 'amber',
      statusText: 'After work hours. Friendly, casual messages work best.',
    };
  }

  if (hours >= 7 && hours < 9) {
    return {
      formattedTime,
      hour24: hours,
      timeOfDay: 'early_morning',
      badgeLabel: 'Early Morning',
      badgeEmoji: '🌅',
      badgeColor: 'cyan',
      statusText: 'Early morning start. Good for getting to the top of inbox.',
    };
  }

  // Otherwise night / off hours (21:00 to 07:00)
  return {
    formattedTime,
    hour24: hours,
    timeOfDay: 'night',
    badgeLabel: 'Night Time (Off-Hours)',
    badgeEmoji: '🌙',
    badgeColor: 'rose',
    statusText: 'Late night / sleeping. Recommend scheduling or sending later.',
  };
}
