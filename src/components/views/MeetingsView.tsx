'use client';

import React, { useState } from 'react';
import { useCRMStore } from '@/lib/store';
import { Meeting } from '@/types/crm';
import { formatTime12h, getFriendlyDateLabel, getTodayISO } from '@/lib/date-utils';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Trophy,
  ExternalLink,
  CalendarPlus,
  Download,
} from 'lucide-react';
import { buildGoogleCalendarUrl, downloadICSFile } from '@/lib/calendar';

interface MeetingsViewProps {
  onOpenNewMeeting: () => void;
  onOpenOutcome: (meeting: Meeting) => void;
  onEditMeeting: (meeting: Meeting) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  onOpenNewMeeting,
  onOpenOutcome,
  onEditMeeting,
}) => {
  const meetings = useCRMStore((s) => s.meetings);
  const deleteMeeting = useCRMStore((s) => s.deleteMeeting);
  const today = getTodayISO();

  // Sort meetings chronologically
  const sortedMeetings = [...meetings].sort((a, b) => {
    const dateComp = a.meetingDate.localeCompare(b.meetingDate);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            Intelligent Meeting Scheduler ({meetings.length})
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automated 60-minute buffer protection against schedule collisions and fatigue
          </p>
        </div>

        <button
          onClick={onOpenNewMeeting}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-cyan-500 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </button>
      </div>

      {/* Safety Policy Callout */}
      <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4">
        <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
        <div className="text-xs text-zinc-300">
          <strong className="text-cyan-300">1-Hour Buffer Engine Active:</strong> The scheduler
          scans calendar density to enforce at least 60 minutes between calls for recap notes and prep.
        </div>
      </div>

      {/* Meeting Cards List */}
      {sortedMeetings.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
          <Calendar className="h-8 w-8 text-zinc-500 mx-auto" />
          <h4 className="font-bold text-zinc-200">No Meetings Scheduled</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Book meetings directly from your outreach follow-up cards or use the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMeetings.map((meeting, idx) => {
            const isTodayMeeting = meeting.meetingDate === today;
            const friendly = getFriendlyDateLabel(meeting.meetingDate);

            return (
              <div
                key={meeting.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                  isTodayMeeting
                    ? 'border-cyan-500/40 bg-cyan-950/20 shadow-lg shadow-cyan-950/20'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                {/* Left: Time & Lead Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-800/80 p-2.5 w-16 text-center shrink-0 border border-zinc-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {friendly.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-100 mt-0.5">
                      {meeting.meetingDate.slice(5)}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">{meeting.leadFlagEmoji || '🌐'}</span>
                      <h4 className="font-bold text-zinc-100 text-sm truncate">
                        {meeting.leadName}
                      </h4>
                      {meeting.dealValue ? (
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ${meeting.dealValue.toLocaleString()}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>
                        {formatTime12h(meeting.startTime)} - {formatTime12h(meeting.endTime)}
                      </span>
                      {meeting.leadPhone && (
                        <span className="text-zinc-500">• {meeting.leadPhone}</span>
                      )}
                    </div>

                    {meeting.locationNotes && (
                      <p className="text-xs text-zinc-400 italic">{meeting.locationNotes}</p>
                    )}
                  </div>
                </div>

                {/* Right: Outcome badge & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 mt-4 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-zinc-800">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      meeting.outcome === 'closed_won'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : meeting.outcome === 'lost'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : meeting.outcome === 'followup_needed'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {meeting.outcome.replace('_', ' ')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 p-2 transition-colors"
                        title="Open Video Call"
                      >
                        <Video className="h-4 w-4" />
                      </a>
                    )}
                    <a
                      href={buildGoogleCalendarUrl({
                        title: 'Outreach Strategy Call',
                        leadName: meeting.leadName,
                        meetingDate: meeting.meetingDate,
                        startTime: meeting.startTime,
                        endTime: meeting.endTime,
                        location: meeting.meetingLink || meeting.locationNotes,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 p-2 transition-colors cursor-pointer"
                      title="Sync to Google Calendar"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        downloadICSFile({
                          title: 'Outreach Strategy Call',
                          leadName: meeting.leadName,
                          meetingDate: meeting.meetingDate,
                          startTime: meeting.startTime,
                          endTime: meeting.endTime,
                          location: meeting.meetingLink || meeting.locationNotes,
                        })
                      }
                      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 transition-colors cursor-pointer"
                      title="Download .ics Calendar File"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onOpenOutcome(meeting)}
                      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                      Outcome
                    </button>
                    <button
                      onClick={() => deleteMeeting(meeting.id)}
                      className="rounded-xl text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 p-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
