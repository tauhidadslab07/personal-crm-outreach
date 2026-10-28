/**
 * Nexus CRM Full Database Backup & Restore Utility
 * Safely exports and restores JSON snapshots of all CRM state
 */

export interface BackupData {
  system: string;
  version: string;
  exportedAt: string;
  data: {
    leads: any[];
    stages: any[];
    meetings: any[];
    projects: any[];
    tasks: any[];
    niches: any[];
    templates: any[];
    dailyGoal?: number;
    streakDays?: number;
  };
}

/**
 * Generates and downloads a JSON backup file directly in the browser
 */
export function downloadDatabaseBackup(state: {
  leads: any[];
  stages: any[];
  meetings: any[];
  projects: any[];
  tasks: any[];
  niches: any[];
  templates: any[];
  dailyGoal?: number;
  streakDays?: number;
}) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const backup: BackupData = {
    system: 'Nexus CRM - WhatsApp Outreach Cadence Engine',
    version: '2.0.0',
    exportedAt: now.toISOString(),
    data: {
      leads: state.leads || [],
      stages: state.stages || [],
      meetings: state.meetings || [],
      projects: state.projects || [],
      tasks: state.tasks || [],
      niches: state.niches || [],
      templates: state.templates || [],
      dailyGoal: state.dailyGoal || 20,
      streakDays: state.streakDays || 4,
    },
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `nexus-crm-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Store last backup date in localStorage for automated weekly reminders
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('nexus_crm_last_backup_date', now.toISOString());
    } catch {}
  }
}

/**
 * Returns the ISO date of the last successful JSON backup, or null
 */
export function getLastBackupDate(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('nexus_crm_last_backup_date');
  } catch {
    return null;
  }
}

/**
 * Returns true if no backup has been taken in the last 7 days or if today is Friday
 */
export function isWeeklyBackupDue(): boolean {
  if (typeof window === 'undefined') return false;
  const last = getLastBackupDate();
  if (!last) return true; // Never backed up

  const lastDate = new Date(last).getTime();
  const now = new Date().getTime();
  const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);

  // Due if more than 7 days have passed, or if it is Friday (day 5) and not backed up today
  const isFriday = new Date().getDay() === 5;
  if (diffDays >= 7) return true;
  if (isFriday && diffDays >= 1) return true;

  return false;
}

/**
 * Validates a parsed backup object
 */
export function validateBackupData(parsed: any): { isValid: boolean; error?: string } {
  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, error: 'Invalid file format. Must be a valid JSON object.' };
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    return { isValid: false, error: 'Backup data root is missing or corrupted.' };
  }

  if (!Array.isArray(parsed.data.leads)) {
    return { isValid: false, error: 'Missing "leads" array in backup file.' };
  }

  return { isValid: true };
}
