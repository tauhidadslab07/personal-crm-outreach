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

export type StageViewStatus = 'unseen' | 'seen' | 'replied' | 'rejected' | 'unchecked';

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
  website?: string;
  source: LeadSource;
  niche?: string;
  currentStage: CadenceStageNumber;
  killSwitchStatus: KillSwitchStatus;
  killSwitchReason?: string;
  responseStatus?: LeadResponseStatus;
  isCadencePaused?: boolean;
  cadencePauseReason?: string;
  isQueuedForToday?: boolean;
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

export type AnalyticsTimeRange = 'today' | 'yesterday' | '7d' | '15d' | '30d' | 'all' | 'custom';

export type Niche = {
  id: string;
  name: string;
  description?: string;
  color?: string; // Accent color theme e.g. "emerald", "cyan", "amber", "purple"
  icon?: string;
  targetAudience?: string;
};

export type UserRole = 'admin' | 'hunter' | 'closer' | 'member';

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Admin-assigned password
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
};

export type CRMTab = 'today' | 'leads' | 'niches' | 'meetings' | 'projects' | 'analytics' | 'users';

export type SenderProfile = {
  id: string;
  name: string; // e.g. "Primary WhatsApp (Alex)", "UK Line (Hunter 2)"
  phone: string; // e.g. "+1 (555) 019-2831"
  isDefault?: boolean;
};
