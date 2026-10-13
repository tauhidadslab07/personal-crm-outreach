import { Lead } from '@/types/crm';
import { STAGE_TITLES } from './date-utils';

export function exportLeadsToCSV(leads: Lead[]) {
  if (!leads || leads.length === 0) return;

  const headers = [
    'Name',
    'Phone',
    'Country',
    'ISO',
    'Company',
    'Email',
    'Niche',
    'Current Stage',
    'Pipeline Status',
    'Response Status',
    'Notes',
    'Created Date',
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((lead) => [
    escapeCSV(lead.name),
    escapeCSV(lead.phoneRaw),
    escapeCSV(lead.countryName),
    escapeCSV(lead.isoCode),
    escapeCSV(lead.company || ''),
    escapeCSV(lead.email || ''),
    escapeCSV(lead.niche || 'General'),
    escapeCSV(STAGE_TITLES[lead.currentStage] || `Stage ${lead.currentStage}`),
    escapeCSV(lead.killSwitchStatus),
    escapeCSV(lead.responseStatus || 'none'),
    escapeCSV(lead.notes || ''),
    escapeCSV(lead.createdAt),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `leads-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
