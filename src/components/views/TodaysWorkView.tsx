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
  ChevronDown,
  ChevronUp,
  Video,
  Clock,
  Sparkles,
  ShieldBan,
  CheckSquare,
  Square,
  Plus,
  Flame,
  ArrowRight,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';
import { SCRIPT_VARIANTS_MAP, interpolateTemplate } from '@/lib/whatsapp';
import { LeadResponseStatus } from '@/types/crm';

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
  const searchQuery = useCRMStore((s) => s.searchQuery);
  const sendAndAutoAdvance = useCRMStore((s) => s.sendAndAutoAdvance);
  const setKillSwitch = useCRMStore((s) => s.setKillSwitch);
  const setResponseStatus = useCRMStore((s) => s.setResponseStatus);
  const setLeadNote = useCRMStore((s) => s.setLeadNote);
  const toggleTask = useCRMStore((s) => s.toggleTask);

  const [activeBucket, setActiveBucket] = useState<'all' | CadenceStageNumber>('all');
  const [expandedScriptStageId, setExpandedScriptStageId] = useState<string | null>(null);
  const [editedScripts, setEditedScripts] = useState<Record<string, string>>({});
  const [copiedStageId, setCopiedStageId] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const handleCopyScript = (stageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStageId(stageId);
    setTimeout(() => {
      setCopiedStageId(null);
    }, 2000);
  };

  const handleVariantSelect = (stageId: string, lead: any, variantContent: string, variantId: string) => {
    const interpolated = interpolateTemplate(variantContent, {
      name: lead.name,
      company: lead.company,
    });
    setEditedScripts((prev) => ({ ...prev, [stageId]: interpolated }));
    setSelectedVariants((prev) => ({ ...prev, [stageId]: variantId }));
  };

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

  // Handle "Send on WhatsApp & Complete Stage"
  const handleSendAndAdvance = (stage: CadenceStage) => {
    const customText = editedScripts[stage.id];
    const { whatsappUrl } = sendAndAutoAdvance(stage.id, customText);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
              Action Queues Due Today
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
                  <span>{stgNum === 0 ? 'Fresh' : stgNum === 5 ? 'FU 5 (Breakup)' : `FU ${stgNum}`}</span>
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
              const isScriptExpanded = expandedScriptStageId === stage.id;
              const currentScriptText = editedScripts[stage.id] ?? stage.templateScript;

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

                    {/* Phone & Source row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <PhoneBadge
                        phone={lead.phoneRaw}
                        sanitizedPhone={lead.phoneSanitized}
                        flagEmoji={lead.flagEmoji}
                        isoCode={lead.isoCode}
                        prefilledText={currentScriptText}
                      />
                      <span className="rounded-md bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-400">
                        Source: {lead.source}
                      </span>
                    </div>

                    {/* Script Preview, Variant Switcher & Quick Edit */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          Pre-filled WhatsApp Script
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Script Variant Selector */}
                          <select
                            value={selectedVariants[stage.id] || ''}
                            onChange={(e) => {
                              const variant = SCRIPT_VARIANTS_MAP[stage.stageNumber]?.find(
                                (x) => x.id === e.target.value
                              );
                              if (variant) {
                                handleVariantSelect(stage.id, lead, variant.content, variant.id);
                              }
                            }}
                            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300 focus:border-emerald-500 focus:outline-none cursor-pointer"
                          >
                            <option value="">Script Variant (A/B/C)...</option>
                            {SCRIPT_VARIANTS_MAP[stage.stageNumber]?.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label}
                              </option>
                            ))}
                          </select>

                          {/* Quick 1-Click Copy Script */}
                          <button
                            type="button"
                            onClick={() => handleCopyScript(stage.id, currentScriptText)}
                            className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-200 transition-colors"
                            title="Copy message to clipboard"
                          >
                            {copiedStageId === stage.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-zinc-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedScriptStageId(isScriptExpanded ? null : stage.id)
                            }
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-0.5 ml-1"
                          >
                            {isScriptExpanded ? (
                              <>
                                Collapse <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                Tweak <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {isScriptExpanded ? (
                        <textarea
                          rows={4}
                          value={currentScriptText}
                          onChange={(e) =>
                            setEditedScripts({ ...editedScripts, [stage.id]: e.target.value })
                          }
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs text-zinc-300 line-clamp-2 italic leading-relaxed">
                          &ldquo;{currentScriptText}&rdquo;
                        </p>
                      )}

                      {/* Quick Response Status Tagging */}
                      <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t border-zinc-800/80">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                          Client Reply:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setResponseStatus(lead.id, 'interested')}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                              lead.responseStatus === 'interested'
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-emerald-300'
                            }`}
                          >
                            💬 Interested
                          </button>
                          <button
                            type="button"
                            onClick={() => setResponseStatus(lead.id, 'later')}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                              lead.responseStatus === 'later'
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/40'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-300'
                            }`}
                          >
                            ⏳ Follow Later
                          </button>
                          <button
                            type="button"
                            onClick={() => setResponseStatus(lead.id, 'not_interested')}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                              lead.responseStatus === 'not_interested'
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-rose-300'
                            }`}
                          >
                            ❌ Not Interested
                          </button>
                        </div>
                      </div>

                      {/* Quick Lead Note field */}
                      <div className="pt-1">
                        <input
                          type="text"
                          placeholder="Quick lead note (e.g. Sent voice note, prefers afternoon call)..."
                          defaultValue={lead.notes || ''}
                          onBlur={(e) => setLeadNote(lead.id, e.target.value)}
                          className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions: Send & Auto-Advance + Kill-Switch dropdown */}
                  <div className="pt-4 mt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                    {/* Kill Switch Selector */}
                    <div className="flex items-center gap-1 text-xs">
                      <select
                        onChange={(e) =>
                          handleKillSwitchChange(lead.id, e.target.value as KillSwitchStatus)
                        }
                        defaultValue=""
                        className="rounded-lg border border-zinc-800 bg-zinc-900/90 px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 focus:border-zinc-700 focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Pipeline Action...
                        </option>
                        <option value="booked_meeting">📅 Booked Meeting</option>
                        <option value="not_interested">🚫 Not Interested / Opt-Out</option>
                        <option value="wrong_number">⚠️ Wrong / Invalid Number</option>
                      </select>
                    </div>

                    {/* Primary Unified "Send & Auto-Advance" Button */}
                    <button
                      onClick={() => handleSendAndAdvance(stage)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/60 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-900/80 transition-all active:scale-95 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send on WhatsApp & Complete Stage</span>
                    </button>
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
