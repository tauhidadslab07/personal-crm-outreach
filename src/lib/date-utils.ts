import { CadenceStageNumber } from '@/types/crm';

/**
 * Cadence interval days after sending current stage:
 * Stage 0 (Initial) -> Next is FU 1 in +2 days
 * Stage 1 (FU 1)    -> Next is FU 2 in +3 days
 * Stage 2 (FU 2)    -> Next is FU 3 in +4 days
 * Stage 3 (FU 3)    -> Next is FU 4 in +5 days
 * Stage 4 (FU 4)    -> Next is FU 5 (Breakup) in +7 days
 */
export const CADENCE_INTERVAL_DAYS: Record<CadenceStageNumber, number> = {
  0: 2, // FU1 in 2 days
  1: 3, // FU2 in 3 days
  2: 4, // FU3 in 4 days
  3: 5, // FU4 in 5 days
  4: 7, // FU5 in 7 days
  5: 0, // Terminal
};

export const STAGE_TITLES: Record<CadenceStageNumber, string> = {
  0: 'Initial Outreach',
  1: 'Follow-up 1',
  2: 'Follow-up 2',
  3: 'Follow-up 3',
  4: 'Follow-up 4',
  5: 'Follow-up 5 (Breakup)',
};

const STABLE_DEFAULT_DATE = '2026-10-13';

/**
 * Format Date as YYYY-MM-DD in local time
 */
export function formatDateISO(date?: Date): string {
  if (!date) {
    if (typeof window === 'undefined') {
      return STABLE_DEFAULT_DATE;
    }
    date = new Date();
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get Today's date string YYYY-MM-DD
 */
export function getTodayISO(): string {
  if (typeof window === 'undefined') {
    return STABLE_DEFAULT_DATE;
  }
  return formatDateISO(new Date());
}

/**
 * Add days to a given YYYY-MM-DD string or Date
 */
export function addDays(baseDate: string | Date, days: number): string {
  const date = typeof baseDate === 'string' ? new Date(baseDate + 'T00:00:00') : new Date(baseDate);
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}

/**
 * Calculates days difference: (targetDate - today)
 * If negative, it is overdue by Math.abs(diff) days.
 */
export function getDaysDifferenceFromToday(dateString: string): number {
  const todayStr = getTodayISO();
  const target = new Date(dateString + 'T00:00:00').getTime();
  const today = new Date(todayStr + 'T00:00:00').getTime();
  const diffTime = target - today;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is strictly before today
 */
export function isOverdue(dateString: string): boolean {
  return getDaysDifferenceFromToday(dateString) < 0;
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  return getDaysDifferenceFromToday(dateString) === 0;
}

/**
 * Human friendly date label:
 * "Overdue (3 days late)", "Today", "Tomorrow", "In 4 days"
 */
export function getFriendlyDateLabel(dateString: string): { label: string; isOverdue: boolean; daysDiff: number } {
  const diff = getDaysDifferenceFromToday(dateString);
  if (diff < 0) {
    const daysLate = Math.abs(diff);
    return {
      label: `Overdue (${daysLate} ${daysLate === 1 ? 'day' : 'days'} late)`,
      isOverdue: true,
      daysDiff: diff,
    };
  }
  if (diff === 0) {
    return { label: 'Today', isOverdue: false, daysDiff: 0 };
  }
  if (diff === 1) {
    return { label: 'Tomorrow', isOverdue: false, daysDiff: 1 };
  }
  return { label: `In ${diff} days`, isOverdue: false, daysDiff: diff };
}

/**
 * Format time e.g. "14:30" to "2:30 PM"
 */
export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Calculate how many days ago a date string was. Returns 0 if today or future.
 */
export function getDaysAgo(dateString?: string): number {
  if (!dateString) return 0;
  const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const diff = getDaysDifferenceFromToday(dateOnly);
  return diff < 0 ? Math.abs(diff) : 0;
}
