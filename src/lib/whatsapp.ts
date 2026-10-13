import { sanitizePhoneForWhatsApp } from './phone';
import { CadenceStageNumber, CadenceTemplate, Lead } from '@/types/crm';

export const DEFAULT_CADENCE_TEMPLATES: CadenceTemplate[] = [
  {
    id: 'stage-0-initial',
    stageNumber: 0,
    name: 'Initial Value Pitch',
    content: "Hey {name}, hope you're having a productive week! I came across your profile and noticed the work you're doing at {company}. We help founders and high-ticket service providers build high-converting client hunting & automated WhatsApp pipeline engines. Would you be open to a quick 10-minute intro call this week?",
  },
  {
    id: 'stage-1-fu1',
    stageNumber: 1,
    name: 'Gentle Bump (Value Recap)',
    content: "Hi {name}, following up on my note from a couple of days ago! Wanted to make sure it didn't get buried under your WhatsApp chats. Are you currently looking to ramp up your qualified client pipeline this quarter?",
  },
  {
    id: 'stage-2-fu2',
    stageNumber: 2,
    name: 'Social Proof & Results',
    content: "Hey {name}, quick question: how are you currently managing your client hunting and follow-ups? We just helped a partner double their booked meetings in 14 days using this exact cadence. Happy to share a quick 2-minute video breakdown if you're curious!",
  },
  {
    id: 'stage-3-fu3',
    stageNumber: 3,
    name: 'Low-Friction Resource Offer',
    content: "Hi {name}, dropping by with a quick resource. We put together a zero-friction Outreach Playbook specifically for high-growth operators. Can I send the direct link over?",
  },
  {
    id: 'stage-4-fu4',
    stageNumber: 4,
    name: 'Timing & Priority Check',
    content: "Hey {name}, I know you're busy running things! If this isn't top of mind right now, totally understand. Would circling back next month make more sense for your schedule?",
  },
  {
    id: 'stage-5-fu5',
    stageNumber: 5,
    name: 'Permission to Close Loop (Breakup)',
    content: "Hi {name}, I don't want to bug you if this isn't relevant to your current priorities. I'll close out your file for now, but feel free to ping me whenever you're looking to optimize your pipeline. Wishing you continued growth!",
  },
];

/**
 * Interpolates variables into template script
 */
export function interpolateTemplate(
  template: string,
  variables: {
    name?: string;
    company?: string;
    service?: string;
    my_name?: string;
  }
): string {
  let result = template;
  const name = variables.name?.trim() || 'there';
  const company = variables.company?.trim() || 'your team';
  const service = variables.service?.trim() || 'our CRM & outreach engine';
  const myName = variables.my_name?.trim() || 'Alex';

  result = result.replace(/\{name\}/gi, name);
  result = result.replace(/\{company\}/gi, company);
  result = result.replace(/\{service\}/gi, service);
  result = result.replace(/\{my_name\}/gi, myName);

  return result;
}

/**
 * Builds Universal WhatsApp API Link:
 * https://api.whatsapp.com/send?phone=${sanitizedPhone}&text=${encodeURIComponent(text)}
 * Works on Mobile (launches native WhatsApp app) and Desktop (redirects to WhatsApp Web/Desktop)
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const sanitized = sanitizePhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${sanitized}&text=${encodedText}`;
}

/**
 * Get prefilled message for a lead and stage
 */
export function getPrefilledMessageForStage(
  lead: Lead,
  stageNumber: CadenceStageNumber,
  customTemplates?: CadenceTemplate[]
): string {
  const templates = customTemplates || DEFAULT_CADENCE_TEMPLATES;
  const match = templates.find((t) => t.stageNumber === stageNumber);
  const templateStr = match ? match.content : DEFAULT_CADENCE_TEMPLATES[stageNumber]?.content || 'Hello {name}!';
  
  return interpolateTemplate(templateStr, {
    name: lead.name,
    company: lead.company,
  });
}
