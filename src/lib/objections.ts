/**
 * High-Converting Objection Buster Playbook & Voice Note Scripts
 * Built for high-velocity agency sales outreach on WhatsApp
 */

export interface ObjectionItem {
  id: string;
  category: string;
  label: string;
  tag: string;
  summary: string;
  script: string;
}

export interface VoiceNoteScript {
  id: string;
  stageLabel: string;
  title: string;
  duration: string;
  script: string;
  tip: string;
}

export const OBJECTION_PLAYBOOK: ObjectionItem[] = [
  {
    id: 'price-high',
    category: 'Budget',
    label: 'Price is too high / Out of budget',
    tag: '💰 Price',
    summary: 'Shifts focus to ROI, risk-reversal, or performance milestones.',
    script:
      "I completely understand budget constraints, {name}! That's why we structure our client engagements on a milestone & performance-driven model — meaning you don't risk capital upfront without seeing clear pipeline results. What budget range were you hoping to keep this within so I can tailor an option for {company}?",
  },
  {
    id: 'send-portfolio',
    category: 'Credibility',
    label: 'Send portfolio / case studies first',
    tag: '📁 Portfolio',
    summary: 'Provides targeted proof while protecting calendar invite.',
    script:
      "Absolutely, {name}! Here are 2 recent case studies where we helped brands in your niche generate 3x more qualified sales meetings in under 30 days: [Insert Link/Deck]. Would you be free for a 10-minute walkthrough this Thursday afternoon so I can show how this applies to {company}?",
  },
  {
    id: 'not-interested',
    category: 'Timing',
    label: 'Not interested right now',
    tag: '⏳ Timing',
    summary: 'Courteous down-sell to permission to keep in touch.',
    script:
      "Totally fair, {name}, no worries at all! Out of curiosity, is it because you already have enough inbound deal-flow right now, or is outbound simply not a priority for this quarter? Either way, happy to circle back down the road!",
  },
  {
    id: 'too-busy',
    category: 'Bandwidth',
    label: 'Too busy / Contact me next month',
    tag: '👔 Busy',
    summary: 'Low-friction friction reducer and calendar placeholder.',
    script:
      "Understood, {name}! I know how busy running {company} can get. I won't take up your time right now. What day next week or early next month works best for a quick 5-minute hello on WhatsApp?",
  },
  {
    id: 'already-working',
    category: 'Competition',
    label: 'Already working with an agency / in-house team',
    tag: '🤝 Competitor',
    summary: 'Position as a complementary high-velocity multiplier.',
    script:
      "That's great to hear, {name} — having an established team in place is huge! Many of our current partners also have in-house reps; they bring our WhatsApp cadence engine in as a multiplier for cold unreached leads. Would you be open to an audit of your current cadence drop-offs to see if we can plug any revenue leaks?",
  },
  {
    id: 'how-found-number',
    category: 'Privacy',
    label: 'How did you get my WhatsApp number?',
    tag: '❓ Source',
    summary: 'Transparent, professional, and compliant explanation.',
    script:
      "Great question, {name}! I found your contact directly through your public business profile / LinkedIn page while researching top companies in your niche. I loved what you're doing with {company} and wanted to reach out personally rather than letting an email get buried in your spam folder. Hope you didn't mind!",
  },
];

export const VOICE_NOTE_SCRIPTS: VoiceNoteScript[] = [
  {
    id: 'vn-stage-1',
    stageLabel: 'Follow-up 1 or 2',
    title: 'Friendly Casual Audio Intro',
    duration: '25-30 sec',
    tip: 'Keep tone upbeat, friendly, natural. Do not sound robotic.',
    script:
      "“Hey {name}, just shooting you a quick 20-second voice note instead of dropping another wall of text in your WhatsApp! Saw what you're building over at {company} and really liked your positioning. I sent a quick note earlier about our client pipeline engine. Wanted to check if you got a second to see it, or if you're completely heads-down right now?”",
  },
  {
    id: 'vn-stage-3',
    stageLabel: 'Follow-up 3 (Proof & Value)',
    title: 'Results Breakdown & Teardown',
    duration: '35 sec',
    tip: 'Mention a concrete metric or result that triggers curiosity.',
    script:
      "“Hey {name}, hope your week is off to a great start! Quick audio note: we just finished a campaign for a client in your niche that pulled in 14 high-ticket booked calls in their first 10 days on WhatsApp. I put together a 2-minute breakdown showing the exact script flow. Can I drop that video link here for you to check out when you get a breather?”",
  },
  {
    id: 'vn-stage-4',
    stageLabel: 'Follow-up 4 (Zero-Pressure Invite)',
    title: 'Low-Friction 10-Minute Coffee Chat',
    duration: '20 sec',
    tip: 'Express zero pressure and respect for their time.',
    script:
      "“Hi {name}, Alex here again. I know your schedule is crazy packed. Zero sales pitch at all — would you be open to grabbing a 10-minute virtual coffee sometime this week or next? Even if we never work together, I'd love to share some insights on what's currently working in outbound for your market.”",
  },
  {
    id: 'vn-stage-5',
    stageLabel: 'Follow-up 5 (Breakup / Clean Sign-off)',
    title: 'The Clean Loop Closer Voice Note',
    duration: '25 sec',
    tip: 'Sounds mature and professional. Often triggers an instant apology & reply!',
    script:
      "“Hey {name}, closing the loop on my side! I definitely don't want to become that annoying person cluttering your WhatsApp. I'll take a step back for now, but if you ever want to streamline your pipeline or ramp up client acquisition down the road, my door is always open. Wishing you and {company} huge success!”",
  },
];
