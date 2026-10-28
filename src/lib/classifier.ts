/**
 * Intelligent Niche Classifier for Nexus CRM
 * Distinguishes between "Website Development Agency" (B2B Agencies/Studios) and "Website Developer" (Individual Freelancers/Developers)
 */

export type ClassifiedNiche = 'Website Development Agency' | 'Website Developer';

export function classifyLeadNiche(params: {
  name?: string;
  company?: string;
  website?: string;
  email?: string;
  raw?: string;
}): ClassifiedNiche {
  const companyStr = (params.company || '').trim();
  const nameStr = (params.name || '').trim();
  const websiteStr = (params.website || '').trim();
  const rawStr = (params.raw || '').trim();

  const textToScan = `${companyStr} ${rawStr} ${websiteStr} ${nameStr}`.toLowerCase();

  // 1. Strong agency keywords: words that specifically indicate an agency, firm, studio, or corporate entity
  const agencyKeywords = [
    /\bagency\b/i,
    /\bagencies\b/i,
    /\bstudio\b/i,
    /\bstudios\b/i,
    /\bdigital\b/i,
    /\bmedia\b/i,
    /\bsolutions\b/i,
    /\btechnologies\b/i,
    /\btechnology\b/i,
    /\btech\b/i,
    /\binteractive\b/i,
    /\bcreative\b/i,
    /\bcreatives\b/i,
    /\bconsulting\b/i,
    /\bconsultancy\b/i,
    /\bfirm\b/i,
    /\blabs?\b/i,
    /\bgroup\b/i,
    /\bassociates\b/i,
    /\bpartners\b/i,
    /\bventures\b/i,
    /\benterprises\b/i,
    /\bnetwork\b/i,
    /\bllc\b/i,
    /\bltd\b/i,
    /\binc\b/i,
    /\bcorp\b/i,
    /\bcorporation\b/i,
    /\bpvt\b/i,
    /\bgmbh\b/i,
    /\bcompany\b/i,
    /\bco\.\b/i,
    /\bteam\b/i,
    /\bdevelopers\b/i, // Plural e.g. "Apex Web Developers"
    /\bbuilders\b/i,
    /\bservices\b/i,
    /\bdesigners\b/i, // Plural
  ];

  // 2. Strong individual developer keywords
  const developerKeywords = [
    /\bfreelance\b/i,
    /\bfreelancer\b/i,
    /\bweb developer\b/i,
    /\bfrontend\b/i,
    /\bfront-end\b/i,
    /\bbackend\b/i,
    /\bback-end\b/i,
    /\bfullstack\b/i,
    /\bfull-stack\b/i,
    /\bprogrammer\b/i,
    /\bsoftware engineer\b/i,
    /\bcoder\b/i,
    /\bportfolio\b/i,
  ];

  // Explicit check: freelance web developer -> Developer
  if (/\bfreelance\b/i.test(textToScan) || /\bfreelancer\b/i.test(textToScan)) {
    return 'Website Developer';
  }

  const hasAgencyMatch = agencyKeywords.some((pattern) => pattern.test(textToScan));
  const hasDevMatch = developerKeywords.some((pattern) => pattern.test(textToScan));

  // If agency keywords match
  if (hasAgencyMatch) {
    return 'Website Development Agency';
  }

  // If individual developer match
  if (hasDevMatch) {
    return 'Website Developer';
  }

  // If company name exists and has at least 2 words or doesn't resemble a personal person's name
  if (companyStr && companyStr.length > 3) {
    const compLower = companyStr.toLowerCase();
    const persLower = nameStr.toLowerCase();

    // If company is different from person name, it's typically an agency / business entity
    if (!persLower || (!compLower.includes(persLower) && !persLower.includes(compLower))) {
      return 'Website Development Agency';
    }
  }

  // Default fallback
  return 'Website Developer';
}
