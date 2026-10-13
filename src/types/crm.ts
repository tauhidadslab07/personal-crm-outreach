export type CountryInfo = {
  isoCode: string; // e.g. "US", "BD", "GB"
  countryCode: string; // e.g. "+1", "+880", "+44"
  countryName: string; // e.g. "United States", "Bangladesh"
  flagEmoji: string; // e.g. "🇺🇸", "🇧🇩"
  isValid: boolean;
  formattedInternational: string;
  e164: string;
};

export type CadenceStageNumber = 0 | 1 | 2 | 3 | 4 | 5;

export type StageViewStatus = 'unchecked' | 'seen' | 'replied';

export type CadenceStage = {
  id: string;
  leadId: string;
  stageNumber: CadenceStageNumber; // 0 = Initial Outreach, 1 = FU 1, 2 = FU 2, 3 = FU 3, 4 = FU 4, 5 = FU 5 (Breakup)
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  sentDate?: string; // YYYY-MM-DDTHH:mm:ss
  isSent: boolean;
  viewStatus: StageViewStatus;
  templateScript: string;
  notes?: string;
};

export type KillSwitchStatus = 'active' | 'booked_meeting' | 'not_interested' | 'wrong_number' | 'completed';

export type LeadSource = 'LinkedIn' | 'Cold Inbound' | 'Referral' | 'Website' | 'Twitter/X' | 'Upwork' | 'Conference' | 'Other';

export type LeadResponseStatus = 'none' | 'interested' | 'later' | 'not_interested';

export type Lead = {
  id: string;
  name: string;
  phoneRaw: string;
  phoneSanitized: string; // e.g. "8801712345678"
  isoCode: string; // "BD"
  countryCode: string; // "+880"
  countryName: string; // "Bangladesh"
  flagEmoji: string; // "🇧🇩"
  company?: string;
  email?: string;
  source: LeadSource;
  currentStage: CadenceStageNumber;
  killSwitchStatus: KillSwitchStatus;
  killSwitchReason?: string;
  responseStatus?: LeadResponseStatus;
  notes?: string;
  value?: number; // Potential deal size in USD
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ScriptVariant = {
  id: string;
  label: string; // e.g. "Direct Value", "Case Study", "Quick Question"
  content: string;
};

export type MeetingOutcome = 'pending' | 'closed_won' | 'followup_needed' | 'lost';

export type Meeting = {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadIsoCode?: string;
  leadFlagEmoji?: string;
  meetingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  meetingLink?: string;
  locationNotes?: string;
  outcome: MeetingOutcome;
  dealValue?: number;
  rescheduleNotes?: string;
  createdAt: string;
};

export type ProjectStatus = 'in_progress' | 'delivered' | 'revision' | 'completed';

export type Project = {
  id: string;
  leadId?: string;
  clientName: string;
  projectName: string;
  acquisitionDate: string; // YYYY-MM-DD
  deliveryDeadline: string; // YYYY-MM-DD
  totalOrderValue: number;
  paidAmount: number;
  remainingBalance: number;
  status: ProjectStatus;
  notes?: string;
  createdAt: string;
};

export type TaskPriority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  isCompleted: boolean;
  leadId?: string;
  clientName?: string;
  createdAt: string;
};

export type CadenceTemplate = {
  id: string;
  stageNumber: CadenceStageNumber;
  name: string;
  content: string; // Supports {name}, {company}, {service}, {my_name}
};

export type AnalyticsTimeRange = '7d' | '15d' | '30d' | 'all';
