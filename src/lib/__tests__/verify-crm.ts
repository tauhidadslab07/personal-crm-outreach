import { parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from '../phone';
import { buildWhatsAppUrl, interpolateTemplate } from '../whatsapp';
import { CADENCE_INTERVAL_DAYS, addDays, getDaysDifferenceFromToday, isOverdue } from '../date-utils';
import { checkMeetingBufferConflict, timeToMinutes, minutesToTime } from '../meeting-buffer';
import { Meeting } from '@/types/crm';

console.log('--- TEST 1: Phone Parsing & Country Detection ---');
const testNumbers = [
  { raw: '+880 1712-345678', expectedIso: 'BD' },
  { raw: '+1 (415) 555-2671', expectedIso: 'US' },
  { raw: '+44 20 7946 0958', expectedIso: 'GB' },
  { raw: '+971 50 123 4567', expectedIso: 'AE' },
  { raw: '+49 151 23456789', expectedIso: 'DE' },
  { raw: '+61 412 345 678', expectedIso: 'AU' },
];

for (const item of testNumbers) {
  const result = parsePhoneAndDetectCountry(item.raw);
  const sanitized = sanitizePhoneForWhatsApp(result.e164 || item.raw);
  console.log(`[PASS] ${item.raw} -> ${result.flagEmoji} ${result.countryName} (${result.isoCode}) | Sanitized: ${sanitized} | Valid: ${result.isValid}`);
  if (result.isoCode !== item.expectedIso) {
    throw new Error(`Expected ISO ${item.expectedIso} but got ${result.isoCode}`);
  }
}

console.log('\n--- TEST 2: Universal WhatsApp URL & Template Interpolation ---');
const testUrl = buildWhatsAppUrl('8801712345678', 'Hey Tanvir, checking in!');
console.log(`WhatsApp URL: ${testUrl}`);
if (!testUrl.startsWith('https://api.whatsapp.com/send?phone=8801712345678&text=')) {
  throw new Error('Invalid WhatsApp URL generated');
}

const interpolated = interpolateTemplate('Hello {name} at {company}!', { name: 'Sarah', company: 'CloudScale' });
console.log(`Interpolated: "${interpolated}"`);
if (interpolated !== 'Hello Sarah at CloudScale!') {
  throw new Error('Interpolation mismatch');
}

console.log('\n--- TEST 3: Cadence Intervals ---');
console.log('Stage 0 -> +', CADENCE_INTERVAL_DAYS[0], 'days (FU 1)');
console.log('Stage 1 -> +', CADENCE_INTERVAL_DAYS[1], 'days (FU 2)');
console.log('Stage 2 -> +', CADENCE_INTERVAL_DAYS[2], 'days (FU 3)');
console.log('Stage 3 -> +', CADENCE_INTERVAL_DAYS[3], 'days (FU 4)');
console.log('Stage 4 -> +', CADENCE_INTERVAL_DAYS[4], 'days (FU 5)');
if (
  CADENCE_INTERVAL_DAYS[0] !== 2 ||
  CADENCE_INTERVAL_DAYS[1] !== 3 ||
  CADENCE_INTERVAL_DAYS[2] !== 4 ||
  CADENCE_INTERVAL_DAYS[3] !== 5 ||
  CADENCE_INTERVAL_DAYS[4] !== 7
) {
  throw new Error('Cadence intervals do not match specification');
}

console.log('\n--- TEST 4: Intelligent Meeting 60-Minute Buffer Engine ---');
const existingMeetings: Meeting[] = [
  {
    id: 'meet-1',
    leadId: 'lead-1',
    leadName: 'Elena Rostova',
    leadPhone: '+16475550199',
    meetingDate: '2026-10-13',
    startTime: '14:00',
    endTime: '14:45',
    outcome: 'pending',
    createdAt: '2026-10-13',
  },
];

// Test direct overlap: 14:15 - 15:00
const directCollision = checkMeetingBufferConflict('2026-10-13', '14:15', '15:00', existingMeetings);
console.log('Direct Collision Result:', directCollision.isConflict, '| Direct:', directCollision.isDirectOverlap, '| Msg:', directCollision.message);
if (!directCollision.isDirectOverlap) throw new Error('Failed to detect direct overlap');

// Test proximity violation: 15:00 - 15:30 (Only 15 mins after 14:45, needs 60 mins!)
const proximityViolation = checkMeetingBufferConflict('2026-10-13', '15:00', '15:30', existingMeetings);
console.log('Proximity Violation Result:', proximityViolation.isConflict, '| Msg:', proximityViolation.message, '| Suggested slot:', proximityViolation.suggestedSlot);
if (!proximityViolation.isConflict || proximityViolation.isDirectOverlap) {
  throw new Error('Failed to detect 60-min buffer proximity violation');
}
if (proximityViolation.suggestedSlot?.startTime !== '15:45') {
  throw new Error(`Expected suggested slot 15:45 but got ${proximityViolation.suggestedSlot?.startTime}`);
}

// Test clear slot: 16:00 - 16:30 (More than 60 mins after 14:45)
const clearSlot = checkMeetingBufferConflict('2026-10-13', '16:00', '16:30', existingMeetings);
console.log('Clear Slot Result:', clearSlot.isConflict, '| Msg:', clearSlot.message);
if (clearSlot.isConflict) throw new Error('Slot should be clear');

console.log('\n ALL CRM LOGIC UNIT TESTS PASSED!');
