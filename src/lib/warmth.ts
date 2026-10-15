import { Lead, CadenceStage } from '@/types/crm';

export type LeadWarmthLevel = 'hot' | 'warm' | 'cold';

export interface LeadWarmthInfo {
  level: LeadWarmthLevel;
  label: string;
  emoji: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

/**
 * Calculates dynamic warmth scoring for a lead based on cadence engagement
 */
export function calculateLeadWarmth(lead: Lead, stages: CadenceStage[] = []): LeadWarmthInfo {
  const leadStages = stages.filter((s) => s.leadId === lead.id);

  // Check if lead booked meeting or is converted
  if (lead.killSwitchStatus === 'booked_meeting') {
    return {
      level: 'hot',
      label: 'Hot Lead',
      emoji: '🔥',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/30',
      dotClass: 'bg-rose-400 animate-pulse',
      description: 'Strategy session booked! High conversion priority.',
    };
  }

  // Check if any stage has replied
  const hasReplied = leadStages.some((s) => s.viewStatus === 'replied') || lead.responseStatus === 'interested';
  if (hasReplied) {
    return {
      level: 'hot',
      label: 'Hot Lead',
      emoji: '🔥',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/30',
      dotClass: 'bg-amber-400 animate-pulse',
      description: 'Active conversation / Knock received! Push for booked meeting.',
    };
  }

  // Check if any stage has been seen
  const hasSeen = leadStages.some((s) => s.viewStatus === 'seen');
  const isMidCadence = lead.currentStage >= 2;

  if (hasSeen || isMidCadence) {
    return {
      level: 'warm',
      label: 'Warm Lead',
      emoji: '⚡',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-950/30',
      dotClass: 'bg-cyan-400',
      description: 'Prospect has viewed outreach or received multiple touches.',
    };
  }

  // Default to cold for fresh / unviewed leads
  return {
    level: 'cold',
    label: 'Cold Lead',
    emoji: '❄️',
    badgeClass: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
    dotClass: 'bg-zinc-500',
    description: 'Fresh prospect or initial unread touchpoint.',
  };
}
