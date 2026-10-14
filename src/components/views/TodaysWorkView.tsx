'use client';

import React, { useState } from 'react';
import { useCRMStore } from '@/lib/store';
import { VelocityBar } from '../common/VelocityBar';
import { PhoneBadge } from '../common/PhoneBadge';
import { CountryBadge } from '../common/CountryBadge';
import { getTodayISO, isOverdue, getDaysDifferenceFromToday, formatTime12h, STAGE_TITLES } from '@/lib/date-utils';
import { CadenceStage, CadenceStageNumber, KillSwitchStatus } from '@/types/crm';
import {
  Send,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Video,
  Clock,
  ShieldBan,
  CheckSquare,
  Square,
  Plus,
  Flame,
  ArrowRight,
  MessageCircle,
  Layers,
} from 'lucide-react';

interface TodaysWorkViewProps {
  onScheduleMeetingForLead: (leadId: string) => void;
  onOpenMeetingOutcome: (meeting: any) => void;
  onOpenNewTask: () => void;
}

export const TodaysWorkView: React.FC<TodaysWorkViewProps> = ({
  onScheduleMeetingForLead,
  onOpenMeetingOutcome,
  onOpenNewTask,
}) => {
  const leads = useCRMStore((s) => s.leads);
  const stages = useCRMStore((s) => s.stages);
  const meetings = useCRMStore((s) => s.meetings);
  const tasks = useCRMStore((s) => s.tasks);
  const projects = useCRMStore((s) => s.projects);
  const niches = useCRMStore((s) => s.niches);
  const selectedNicheFilter = useCRMStore((s) => s.selectedNicheFilter);
  const setSelectedNicheFilter = useCRMStore((s) => s.setSelectedNicheFilter);
  const searchQuery = useCRMStore((s) => s.searchQuery);
  const sendAndAutoAdvance = useCRMStore((s) => s.sendAndAutoAdvance);
  const markSentAndAdvance = useCRMStore((s) => s.markSentAndAdvance);
  const setStageViewStatus = useCRMStore((s) => s.setStageViewStatus);
  const setKillSwitch = useCRMStore((s) => s.setKillSwitch);
  const toggleTask = useCRMStore((s) => s.toggleTask);

  const [activeBucket, setActiveBucket] = useState<'all' | CadenceStageNumber>('all');
  const today = getTodayISO();

  // Find all stages that are scheduled for today OR overdue, and NOT sent, for active leads
  const activeLeadMap = new Map(leads.map((l) => [l.id, l]));

  const relevantStages = stages.filter((stg) => {
    const lead = activeLeadMap.get(stg.leadId);
    if (!lead || lead.killSwitchStatus !== 'active') return false;

    // Filter by search query if any
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phoneRaw.includes(q);
      const matchCompany = lead.company?.toLowerCase().includes(q);
      const matchCountry = lead.countryName.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCompany && !matchCountry) return false;
    }

    // Filter by Niche if selected
    if (selectedNicheFilter !== 'all' && lead.niche !== selectedNicheFilter) {
      return false;
    }

    return true;
  });

  // Calculate velocity progress for today:
  // Total due today or completed today
  const stagesDueTodayOrOverdue = relevantStages.filter(
    (s) => !s.isSent && (s.scheduledDate === today || isOverdue(s.scheduledDate))
  );

  const stagesSentToday = stages.filter(
    (s) => s.isSent && s.sentDate && s.sentDate.startsWith(today)
  );

  const totalTodayGoal = stagesDueTodayOrOverdue.length + stagesSentToday.length;
  const completedTodayCount = stagesSentToday.length;

  const overdueStages = stagesDueTodayOrOverdue.filter((s) => isOverdue(s.scheduledDate));

  // Bucketed stages
  const filteredStages = stagesDueTodayOrOverdue.filter((s) => {
    if (activeBucket === 'all') return true;
    return s.stageNumber === activeBucket;
  });

  // Today's meetings
  const todayMeetings = meetings.filter((m) => m.meetingDate === today);

  // Today's tasks
  const todayTasks = tasks.filter((t) => t.dueDate === today);

  // Today's project deadlines
  const todayProjectDeadlines = projects.filter((p) => p.deliveryDeadline === today);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle "Direct Message Sent" (moves lead to next follow-up stage without opening WhatsApp popup)
  const handleDirectMessageSent = (stage: CadenceStage, leadName: string) => {
    markSentAndAdvance(stage.id);
    const nextLabel =
      stage.stageNumber < 5 ? `Follow-up ${stage.stageNumber + 1}` : 'Completed';
    setToastMessage(`✓ Message Sent! "${leadName}" automatically moved to ${nextLabel}.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle "Send on WhatsApp & Complete Stage"
  const handleSendAndAdvance = (stage: CadenceStage, leadName: string) => {
    const { whatsappUrl } = sendAndAutoAdvance(stage.id, stage.templateScript);
    const nextLabel =
      stage.stageNumber < 5 ? `Follow-up ${stage.stageNumber + 1}` : 'Completed';
    setToastMessage(`✓ Message Sent on WhatsApp! "${leadName}" moved to ${nextLabel}.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    // Launch universal WhatsApp link in new window/tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle Kill-Switch
  const handleKillSwitchChange = (leadId: string, status: KillSwitchStatus) => {
    if (status === 'booked_meeting') {
      onScheduleMeetingForLead(leadId);
    } else {
      setKillSwitch(leadId, status);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Daily Velocity Progress Tracker */}
      <VelocityBar
        completed={completedTodayCount}
        total={totalTodayGoal}
        overdueCount={overdueStages.length}
      />

      {/* Floating Real-time Success Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Today's Meetings Quick Strip */}
      {todayMeetings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              Today&apos;s Scheduled Meetings ({todayMeetings.length})
            </h3>
            <span className="text-xs text-zinc-400">Strict 60-min buffer protected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg backdrop-blur space-y-3 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">{meeting.leadFlagEmoji || '🌐'}</span>
                      <h4 className="font-bold text-zinc-100 text-sm">{meeting.leadName}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {formatTime12h(meeting.startTime)} - {formatTime12h(meeting.endTime)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      meeting.outcome === 'closed_won'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : meeting.outcome === 'lost'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {meeting.outcome.replace('_', ' ')}
                  </span>
                </div>

                {meeting.locationNotes && (
                  <p className="text-xs text-zinc-400 line-clamp-1">{meeting.locationNotes}</p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                  {meeting.meetingLink && (
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 py-1.5 text-xs font-semibold transition-all"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join Call
                    </a>
                  )}
                  <button
                    onClick={() => onOpenMeetingOutcome(meeting)}
                    className="flex-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 text-xs font-semibold transition-all"
                  >
                    Log Outcome
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Action Buckets / Tabs */}
      <section className="space-y-4">
        {/* Niche Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-zinc-900/50 p-2.5 rounded-2xl border border-zinc-800/80">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 ml-1">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            Niche:
          </span>
          <button
            onClick={() => setSelectedNicheFilter('all')}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold shrink-0 transition-all ${
              selectedNicheFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'border border-zinc-700/60 bg-zinc-800/80 text-zinc-300 hover:text-white'
            }`}
          >
            All Niches
          </button>
          {niches.map((n) => {
            const isSelected = selectedNicheFilter === n.name;
            return (
              <button
                key={n.id}
                onClick={() => setSelectedNicheFilter(n.name)}
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-zinc-700/60 bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {n.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              Action Queues Due Today
              {selectedNicheFilter !== 'all' && (
                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Niche: {selectedNicheFilter}
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              Zero-friction click-to-chat with automatic follow-up stage advancement
            </p>
          </div>

          {/* Bucket filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveBucket('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                activeBucket === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              All Due ({stagesDueTodayOrOverdue.length})
            </button>
            {([0, 1, 2, 3, 4, 5] as CadenceStageNumber[]).map((stgNum) => {
              const count = stagesDueTodayOrOverdue.filter((s) => s.stageNumber === stgNum).length;
              return (
                <button
                  key={stgNum}
                  onClick={() => setActiveBucket(stgNum)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeBucket === stgNum
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span>{stgNum === 0 ? 'Initial Outreach' : stgNum === 5 ? 'Follow-up 5 (Breakup)' : `Follow-up ${stgNum}`}</span>
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        activeBucket === stgNum ? 'bg-white/20 text-white' : 'bg-zinc-800 text-emerald-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lead Cards List */}
        {filteredStages.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-zinc-200 text-base">Queue Cleared!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No pending messages in this bucket. Add more leads or check back tomorrow for auto-scheduled follow-ups!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStages.map((stage) => {
              const lead = activeLeadMap.get(stage.leadId)!;
              const isLate = isOverdue(stage.scheduledDate);
              const lateDays = Math.abs(getDaysDifferenceFromToday(stage.scheduledDate));

              return (
                <div
                  key={stage.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 shadow-xl transition-all ${
                    isLate
                      ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-zinc-900/90 to-zinc-900 shadow-rose-950/20'
                      : 'border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  {/* Top Bar: Lead details & badges */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-zinc-100 text-base truncate">
                            {lead.name}
                          </h4>
                          <CountryBadge country={lead} size="sm" showName={true} />
                        </div>
                        {lead.company && (
                          <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                            {lead.company}
                          </p>
                        )}
                      </div>

                      {/* Stage & Overdue indicator */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-700/60 uppercase">
                          {STAGE_TITLES[stage.stageNumber]}
                        </span>
                        {isLate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/40 animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            Overdue ({lateDays}d late)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone & Niche row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <PhoneBadge
                        phone={lead.phoneRaw}
                        sanitizedPhone={lead.phoneSanitized}
                        flagEmoji={lead.flagEmoji}
                        isoCode={lead.isoCode}
                        prefilledText={stage.templateScript}
                      />
                      <div className="flex items-center gap-1.5">
                        {lead.niche && (
                          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                            {lead.niche}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Engagement Status Switcher */}
                    {(() => {
                      const prevStageNum = stage.stageNumber > 0 ? stage.stageNumber - 1 : 0;
                      const targetStage =
                        stage.stageNumber > 0
                          ? stages.find(
                              (s) => s.leadId === stage.leadId && s.stageNumber === prevStageNum
                            ) || stage
                          : stage;

                      return (
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 border-t border-zinc-800/80">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                              {stage.stageNumber > 0 ? 'Last Message Outcome:' : 'Message Status:'}
                            </span>
                            {stage.stageNumber > 0 && (
                              <span className="text-[10px] text-zinc-500 font-medium">
                                Updates: {STAGE_TITLES[targetStage.stageNumber]}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 xs:grid-cols-4 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
                            {/* Unseen / Sent */}
                            <button
                              type="button"
                              onClick={() => {
                                setStageViewStatus(targetStage.id, 'unseen');
                                setToastMessage(
                                  `✓ ${lead.name}'s ${STAGE_TITLES[targetStage.stageNumber]} marked as UNSEEN.`
                                );
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className={`px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer text-center flex items-center justify-center ${
                                targetStage.viewStatus === 'unseen' ||
                                targetStage.viewStatus === 'unchecked'
                                  ? 'bg-zinc-800 border-zinc-600 text-zinc-200 ring-1 ring-zinc-500/30'
                                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'
                              }`}
                              title="Message sent but not opened / unseen"
                            >
                              ⏳ Unseen
                            </button>

                            {/* Seen */}
                            <button
                              type="button"
                              onClick={() => {
                                setStageViewStatus(targetStage.id, 'seen');
                                setToastMessage(
                                  `✓ ${lead.name}'s ${STAGE_TITLES[targetStage.stageNumber]} marked as SEEN.`
                                );
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className={`px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer text-center flex items-center justify-center ${
                                targetStage.viewStatus === 'seen'
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-500/40'
                                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500 hover:text-cyan-300'
                              }`}
                              title="Message read / double blue tick"
                            >
                              👁️ Seen
                            </button>

                            {/* Replied / Knock */}
                            <button
                              type="button"
                              onClick={() => {
                                setStageViewStatus(targetStage.id, 'replied');
                                setToastMessage(
                                  `✓ ${lead.name}'s ${STAGE_TITLES[targetStage.stageNumber]} marked as REPLIED.`
                                );
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className={`px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer text-center flex items-center justify-center ${
                                targetStage.viewStatus === 'replied'
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40'
                                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500 hover:text-emerald-300'
                              }`}
                              title="Client responded / knocked back"
                            >
                              💬 Replied
                            </button>

                            {/* Rejected */}
                            <button
                              type="button"
                              onClick={() => {
                                setStageViewStatus(targetStage.id, 'rejected');
                                setToastMessage(
                                  `✓ ${lead.name}'s ${STAGE_TITLES[targetStage.stageNumber]} marked as REJECTED.`
                                );
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className={`px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer text-center flex items-center justify-center ${
                                targetStage.viewStatus === 'rejected'
                                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40'
                                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500 hover:text-rose-300'
                              }`}
                              title="Client declined / rejected"
                            >
                              ❌ Rejected
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom Actions: Send & Auto-Advance + Kill-Switch dropdown */}
                  <div className="pt-3 mt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Kill Switch Selector */}
                    <div className="w-full sm:w-auto">
                      <select
                        onChange={(e) =>
                          handleKillSwitchChange(lead.id, e.target.value as KillSwitchStatus)
                        }
                        defaultValue=""
                        className="w-full sm:w-auto rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 focus:border-zinc-700 focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Pipeline Action...
                        </option>
                        <option value="booked_meeting">📅 Booked Meeting</option>
                        <option value="not_interested">🚫 Not Interested / Opt-Out</option>
                        <option value="wrong_number">⚠️ Wrong / Invalid Number</option>
                      </select>
                    </div>

                    {/* Actions: Message Sent & WhatsApp Launch */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Secondary WhatsApp Launch Button */}
                      <button
                        type="button"
                        onClick={() => handleSendAndAdvance(stage, lead.name)}
                        title="Open WhatsApp chat with prefilled template"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white px-3 py-2.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <Send className="h-3.5 w-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Primary "Message Sent" Auto-Advance Button */}
                      <button
                        type="button"
                        onClick={() => handleDirectMessageSent(stage, lead.name)}
                        title={`Click to mark message as sent and automatically advance lead to ${
                          stage.stageNumber < 5 ? `Follow-up ${stage.stageNumber + 1}` : 'Completed'
                        }`}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 sm:px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/60 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-900/80 transition-all active:scale-95 cursor-pointer ring-1 ring-emerald-400/30 whitespace-nowrap"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-100 shrink-0" />
                        <span>
                          {stage.stageNumber < 5
                            ? `Sent → FU ${stage.stageNumber + 1}`
                            : 'Sent & Complete'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Bottom Grid: Today's Tasks & Project Deadlines */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
        {/* Daily Tasks Checklist */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-400" />
              Today&apos;s Operational Tasks ({todayTasks.length})
            </h3>
            <button
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New Task
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3">No tasks due today.</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    task.isCompleted
                      ? 'border-zinc-800/60 bg-zinc-900/30 opacity-60'
                      : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {task.isCompleted ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-500 shrink-0" />
                    )}
                    <span
                      className={`text-xs text-zinc-200 truncate ${
                        task.isCompleted ? 'line-through text-zinc-500' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.2 text-[9px] font-bold uppercase ${
                      task.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-400'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Delivery Deadlines */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              Project Deadlines Due Today
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              {todayProjectDeadlines.length} due
            </span>
          </div>

          {todayProjectDeadlines.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3">No delivery deadlines scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todayProjectDeadlines.map((proj) => (
                <div
                  key={proj.id}
                  className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/15 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-100">{proj.projectName}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ${proj.totalOrderValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Client: {proj.clientName}</span>
                    <span className="capitalize text-emerald-400 font-semibold">{proj.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
