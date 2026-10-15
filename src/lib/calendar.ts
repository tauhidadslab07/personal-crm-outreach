/**
 * Calendar Integration Utilities for Google Calendar URL & .ics file export
 */

export interface CalendarEventPayload {
  title: string;
  leadName: string;
  meetingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description?: string;
  location?: string;
}

export function buildGoogleCalendarUrl(event: CalendarEventPayload): string {
  const startClean = (event.startTime || '10:00').replace(':', '').padEnd(4, '0') + '00';
  const endClean = (event.endTime || '10:30').replace(':', '').padEnd(4, '0') + '00';
  const dateClean = (event.meetingDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');

  const startIso = `${dateClean}T${startClean}`;
  const endIso = `${dateClean}T${endClean}`;

  const text = encodeURIComponent(`Meeting: ${event.leadName} (${event.title || 'Outreach Sync'})`);
  const details = encodeURIComponent(
    event.description ||
      `Intelligent outreach meeting with ${event.leadName}. Scheduled via Nexus CRM.\nChannel: ${event.location || 'Google Meet / WhatsApp Video'}`
  );
  const location = encodeURIComponent(event.location || 'Google Meet / WhatsApp Call');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

export function downloadICSFile(event: CalendarEventPayload) {
  const startClean = (event.startTime || '10:00').replace(':', '').padEnd(4, '0') + '00';
  const endClean = (event.endTime || '10:30').replace(':', '').padEnd(4, '0') + '00';
  const dateClean = (event.meetingDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');

  const startIso = `${dateClean}T${startClean}`;
  const endIso = `${dateClean}T${endClean}`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nexus CRM//Intelligent Meeting Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:nexus-meeting-${Date.now()}@nexuscrm.io`,
    `DTSTAMP:${dateClean}T000000Z`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:Meeting with ${event.leadName}`,
    `DESCRIPTION:${(event.description || 'Outreach meeting with ' + event.leadName).replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || 'Google Meet / WhatsApp Video'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Meeting_${event.leadName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
