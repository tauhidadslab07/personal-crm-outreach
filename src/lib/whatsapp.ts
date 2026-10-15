import { sanitizePhoneForWhatsApp } from './phone';
import { CadenceStageNumber, CadenceTemplate, Lead, ScriptVariant } from '@/types/crm';

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

export const SCRIPT_VARIANTS_MAP: Record<CadenceStageNumber, ScriptVariant[]> = {
  0: [
    {
      id: 'stg-0-var-a',
      label: 'Variant A: Direct Value Pitch',
      content: "Hey {name}, hope you're having a productive week! I came across your work at {company}. We help high-ticket businesses streamline their client acquisition and follow-up loops. Would you be open to a 10-minute chat this Thursday to see what we could drive for your pipeline?",
    },
    {
      id: 'stg-0-var-b',
      label: 'Variant B: Case Study & Numbers',
      content: "Hi {name}, saw what you're building at {company}. We recently helped a team in your niche increase their booked calls by 42% in 3 weeks through a multi-touch cadence. Would you be curious to see the 2-minute teardown breakdown?",
    },
    {
      id: 'stg-0-var-c',
      label: 'Variant C: Casual Short Question',
      content: "Hey {name}, quick question: are you currently looking to ramp up qualified outreach and booked calls for {company} this month?",
    },
  ],
  1: [
    {
      id: 'stg-1-var-a',
      label: 'Variant A: Gentle Bump (Value Recap)',
      content: "Hi {name}, following up on my previous note! Wanted to make sure it didn't get buried under your WhatsApp chats. Are you currently taking on new clients this quarter?",
    },
    {
      id: 'stg-1-var-b',
      label: 'Variant B: 1-Liner Check-in',
      content: "Hey {name}, floating this back to the top of your inbox. Did you get a chance to review my note regarding {company}?",
    },
    {
      id: 'stg-1-var-c',
      label: 'Variant C: Resource Offer',
      content: "Hi {name}, put together a 1-page cheatsheet on 5-stage follow-up cadence benchmarks. Happy to drop the PDF here if you'd like to take a look!",
    },
  ],
  2: [
    {
      id: 'stg-2-var-a',
      label: 'Variant A: Social Proof & Results',
      content: "Hey {name}, quick question: how are you currently handling cold outreach and follow-ups? We just helped a partner double their booked meetings in 14 days using this exact system. Happy to share a quick 2-minute video breakdown if you're curious!",
    },
    {
      id: 'stg-2-var-b',
      label: 'Variant B: Common Bottleneck',
      content: "Hi {name}, most founders we speak with tell us that 70% of potential deals drop off after the 1st follow-up. Are you seeing similar retention drop-offs with your inbound leads at {company}?",
    },
    {
      id: 'stg-2-var-c',
      label: 'Variant C: Direct Question',
      content: "Hey {name}, are qualified client calls a bottleneck for your team right now, or is capacity completely maxed out?",
    },
  ],
  3: [
    {
      id: 'stg-3-var-a',
      label: 'Variant A: Low-Friction Resource Offer',
      content: "Hi {name}, dropping by with a quick resource. We put together a zero-friction Outreach Playbook specifically for high-growth operators. Can I send the direct link over?",
    },
    {
      id: 'stg-3-var-b',
      label: 'Variant B: Complimentary Audit',
      content: "Hey {name}, I'd be happy to take 5 minutes to audit your current outreach scripts and share 3 quick tweaks that could lift your response rate. Free of charge, no pitch. Open to that?",
    },
    {
      id: 'stg-3-var-c',
      label: 'Variant C: Quick Case Study',
      content: "Hi {name}, thought you might find this relevant: here's how one of our clients booked 18 high-ticket discovery calls in 10 days using WhatsApp cadences. Want me to send the breakdown?",
    },
  ],
  4: [
    {
      id: 'stg-4-var-a',
      label: 'Variant A: Timing & Priority Check',
      content: "Hey {name}, I know you're super busy running operations! If this isn't top of mind right now, totally understand. Would circling back next month make more sense for your schedule?",
    },
    {
      id: 'stg-4-var-b',
      label: 'Variant B: Quick Question on Priorities',
      content: "Hi {name}, is scaling your outbound client pipeline a priority for this quarter, or are you focused on other areas for now?",
    },
    {
      id: 'stg-4-var-c',
      label: 'Variant C: Soft Reconnect',
      content: "Hey {name}, just wanted to respect your time. Should I follow up in a few weeks, or should I take a pause for now?",
    },
  ],
  5: [
    {
      id: 'stg-5-var-a',
      label: 'Variant A: Permission to Close (Breakup)',
      content: "Hi {name}, I don't want to bug you if this isn't relevant to your current priorities. I'll close out your file for now, but feel free to ping me whenever you're looking to optimize your pipeline. Wishing you continued growth!",
    },
    {
      id: 'stg-5-var-b',
      label: 'Variant B: Final Sign-off',
      content: "Hey {name}, assuming this isn't the right time for us to connect! I'll leave the ball in your court. Reach out anytime if you want to optimize your outreach systems. Wishing you and {company} all the best!",
    },
    {
      id: 'stg-5-var-c',
      label: 'Variant C: Clean Loop Closer',
      content: "Hi {name}, closing the loop here so I don't clutter your WhatsApp. If you ever need help with conversion workflows down the line, my door is always open. Cheers!",
    },
  ],
};

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

/**
 * 30-Day Win-Back Re-Engagement Templates for Lost / Ghosted Leads
 */
export const WIN_BACK_TEMPLATES: ScriptVariant[] = [
  {
    id: 'winback-case-study',
    label: 'Angle 1: New Case Study Win',
    content: "Hey {name}, was thinking about {company}. We recently rolled out a new client acquisition campaign in your niche that drove 18 booked meetings in 10 days. Put together a 2-minute breakdown — would you be open to checking it out?",
  },
  {
    id: 'winback-growth-audit',
    label: 'Angle 2: Free 3-Point Teardown',
    content: "Hi {name}, hope things are going great at {company}! I put together a quick 3-point outreach audit for your team — zero pitch, just actionable ideas you can test internally. Mind if I drop the link here?",
  },
  {
    id: 'winback-crm-cleanup',
    label: 'Angle 3: Casual CRM Check-in',
    content: "Hey {name}, cleaning up my CRM and saw we connected a while back. Are you still actively heading growth and new client hunting at {company}?",
  },
];
