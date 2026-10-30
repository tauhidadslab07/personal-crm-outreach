import { Lead, CadenceStage, Meeting, Project, Task, CadenceTemplate, Niche, SenderProfile } from '@/types/crm';
import { DEFAULT_CADENCE_TEMPLATES } from './whatsapp';
import { DEFAULT_BD_LEADS, DEFAULT_BD_STAGES } from './bd-leads-data';

export const DEFAULT_SENDER_PROFILES: SenderProfile[] = [
  {
    id: 'sender-primary',
    name: 'Primary Line (Main Agency)',
    phone: '+1 (415) 555-0199',
    isDefault: true,
  },
  {
    id: 'sender-hunter-2',
    name: 'Secondary SIM (Hunter 2)',
    phone: '+44 7911 123456',
    isDefault: false,
  },
  {
    id: 'sender-backup',
    name: 'Backup Warm Line',
    phone: '+971 50 987 6543',
    isDefault: false,
  },
];

export const DEFAULT_NICHES: Niche[] = [
  {
    id: 'niche-website-developer',
    name: 'Website Developer',
    description: 'Freelance & professional web developers, frontend engineers, fullstack programmers',
    color: 'emerald',
    icon: 'Code',
    targetAudience: 'Freelance Developers, Frontend Engineers, Fullstack Web Devs',
  },
  {
    id: 'niche-web-dev-agency',
    name: 'Website Development Agency',
    description: 'Web development studios, digital agency owners, boutique web design & build firms',
    color: 'cyan',
    icon: 'Building2',
    targetAudience: 'Agency Owners, Technical Directors, Managing Partners',
  },
];

export function getInitialSeedData(): {
  leads: Lead[];
  stages: CadenceStage[];
  meetings: Meeting[];
  projects: Project[];
  tasks: Task[];
  templates: CadenceTemplate[];
  niches: Niche[];
  senderProfiles: SenderProfile[];
} {
  return {
    leads: DEFAULT_BD_LEADS,
    stages: DEFAULT_BD_STAGES,
    meetings: [],
    projects: [],
    tasks: [],
    templates: DEFAULT_CADENCE_TEMPLATES,
    niches: DEFAULT_NICHES,
    senderProfiles: DEFAULT_SENDER_PROFILES,
  };
}
