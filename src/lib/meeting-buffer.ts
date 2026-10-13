import { Meeting } from '@/types/crm';

export type BufferConflict = {
  isConflict: boolean;
  isDirectOverlap: boolean;
  conflictingMeeting?: Meeting;
  message: string;
  suggestedSlot?: {
    startTime: string;
    endTime: string;
  };
};

/**
 * Converts HH:mm to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from midnight to HH:mm string
 */
export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Intelligent Meeting Scheduler with 1-Hour Buffer Detection:
 * Scans for existing meetings within 60 minutes before and 60 minutes after selected time slot.
 */
export function checkMeetingBufferConflict(
  targetDate: string,
  startTime: string,
  endTime: string,
  existingMeetings: Meeting[],
  excludeMeetingId?: string
): BufferConflict {
  const newStartMin = timeToMinutes(startTime);
  const newEndMin = timeToMinutes(endTime);
  const duration = Math.max(15, newEndMin - newStartMin);

  // Buffer window: 60 minutes before start, 60 minutes after end
  const bufferStartMin = newStartMin - 60;
  const bufferEndMin = newEndMin + 60;

  // Filter meetings on same date, excluding the one being edited if applicable
  const sameDayMeetings = existingMeetings.filter(
    (m) => m.meetingDate === targetDate && m.id !== excludeMeetingId && m.outcome !== 'lost'
  );

  for (const m of sameDayMeetings) {
    const existStart = timeToMinutes(m.startTime);
    const existEnd = timeToMinutes(m.endTime);

    // Direct overlap check: [newStart, newEnd] overlaps [existStart, existEnd]
    const directOverlap = newStartMin < existEnd && newEndMin > existStart;

    // Buffer check: exists within 60 minutes before or after
    const bufferOverlap = existEnd > bufferStartMin && existStart < bufferEndMin;

    if (directOverlap || bufferOverlap) {
      // Calculate nearest conflict-free slot after this meeting (+60 min buffer)
      const suggestedStartMin = existEnd + 60;
      const suggestedEndMin = suggestedStartMin + duration;

      let suggestedSlot: { startTime: string; endTime: string } | undefined;
      if (suggestedEndMin <= 23 * 60 + 59) {
        suggestedSlot = {
          startTime: minutesToTime(suggestedStartMin),
          endTime: minutesToTime(suggestedEndMin),
        };
      } else {
        // Try before meeting (-60 min buffer)
        const suggestedBeforeEnd = existStart - 60;
        const suggestedBeforeStart = suggestedBeforeEnd - duration;
        if (suggestedBeforeStart >= 8 * 60) { // at least 8:00 AM
          suggestedSlot = {
            startTime: minutesToTime(suggestedBeforeStart),
            endTime: minutesToTime(suggestedBeforeEnd),
          };
        }
      }

      if (directOverlap) {
        return {
          isConflict: true,
          isDirectOverlap: true,
          conflictingMeeting: m,
          message: `Direct schedule collision with "${m.leadName}" (${m.startTime} - ${m.endTime}).`,
          suggestedSlot,
        };
      }

      // Proximity buffer warning
      const minutesApart = newStartMin >= existEnd ? newStartMin - existEnd : existStart - newEndMin;
      return {
        isConflict: true,
        isDirectOverlap: false,
        conflictingMeeting: m,
        message: `Only ${minutesApart} minutes buffer with "${m.leadName}" (${m.startTime} - ${m.endTime}). Standard policy requires at least 60 minutes buffer between meetings.`,
        suggestedSlot,
      };
    }
  }

  return {
    isConflict: false,
    isDirectOverlap: false,
    message: 'Slot is clear and has full 60-minute buffer protection.',
  };
}
