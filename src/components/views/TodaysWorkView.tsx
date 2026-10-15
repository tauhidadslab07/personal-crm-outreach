'use client';

import React, { useState, useEffect } from 'react';
import { useCRMStore } from '@/lib/store';
import { VelocityBar } from '../common/VelocityBar';
import { PhoneBadge } from '../common/PhoneBadge';
import { CountryBadge } from '../common/CountryBadge';
import { ProspectTimeBadge } from '../common/ProspectTimeBadge';
import { LeadWarmthBadge } from '../common/LeadWarmthBadge';
import { calculateLeadWarmth } from '@/lib/warmth';
import { ObjectionBusterModal } from '../modals/ObjectionBusterModal';
import { SnoozeModal } from '../modals/SnoozeModal';
import { SCRIPT_VARIANTS_MAP, interpolateTemplate, buildWhatsAppUrl } from '@/lib/whatsapp';
import { getTodayISO, isOverdue, getDaysDifferenceFromToday, formatTime12h, STAGE_TITLES } from '@/lib/date-utils';
import { Lead, CadenceStage, CadenceStageNumber, KillSwitchStatus } from '@/types/crm';
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
  CalendarPlus,
  Download,
  Volume2,
  Bell,
  FileEdit,
  ShieldAlert,
  Mic,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Smartphone,
} from 'lucide-react';
import { buildGoogleCalendarUrl, downloadICSFile } from '@/lib/calendar';

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
  const setLeadNote = useCRMStore((s) => s.setLeadNote);
  const resumeCadence = useCRMStore((s) => s.resumeCadence);
  const senderProfiles = useCRMStore((s) => s.senderProfiles);
  const activeSenderProfileId = useCRMStore((s) => s.activeSenderProfileId);
  const setActiveSenderProfile = useCRMStore((s) => s.setActiveSenderProfile);

  const [activeBucket, setActiveBucket] = useState<'all' | 'engaged' | CadenceStageNumber>('all');
  const [warmthFilter, setWarmthFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [editingNoteLeadId, setEditingNoteLeadId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [selectedObjectionLead, setSelectedObjectionLead] = useState<Lead | null>(null);
  const [snoozeTarget, setSnoozeTarget] = useState<{ lead: Lead; stage: CadenceStage } | null>(null);
  const [expandedVariantLeadId, setExpandedVariantLeadId] = useState<string | null>(null);
  const [selectedCustomScripts, setSelectedCustomScripts] = useState<Record<string, string>>({});
  const today = getTodayISO();

  const playOverdueChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio context blocked by browser
    }
  };

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

  // Automatically chime if overdue follow-ups are waiting
  useEffect(() => {
    if (overdueStages.length > 0) {
      const timer = setTimeout(() => {
        playOverdueChime();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [overdueStages.length]);

  // Bucketed & Warmth filtered stages:
  // Find all stages where lead is actively engaged (replied / cadence paused)
  const engagedStages = relevantStages.filter((s) => {
    const lead = activeLeadMap.get(s.leadId);
    if (!lead || lead.killSwitchStatus !== 'active') return false;
    return (
      lead.isCadencePaused ||
      s.viewStatus === 'replied' ||
      stages.some((st) => st.leadId === lead.id && st.viewStatus === 'replied')
    );
  });

  const baseStagesToFilter =
    activeBucket === 'engaged'
      ? engagedStages
      : stagesDueTodayOrOverdue.filter(
          (s) => activeBucket === 'all' || s.stageNumber === activeBucket
        );

  const filteredStages = baseStagesToFilter.filter((s) => {
    if (warmthFilter !== 'all') {
      const lead = activeLeadMap.get(s.leadId);
      if (!lead) return false;
      const warmth = calculateLeadWarmth(lead, stages);
      if (warmth.level !== warmthFilter) return false;
    }
    return true;
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
  const handleSendAndAdvance = (stage: CadenceStage, leadName: string, customMessage?: string) => {
    const messageToSend = customMessage || selectedCustomScripts[stage.leadId] || stage.templateScript;
    const { whatsappUrl } = sendAndAutoAdvance(stage.id, messageToSend);
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

      {/* Overdue Follow-up Audio Alert Banner */}
      {overdueStages.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 shadow-lg shadow-rose-950/20 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 animate-pulse" />
            <span className="text-xs font-bold">
              ⚠️ Attention: You have {overdueStages.length} overdue follow-up{overdueStages.length === 1 ? '' : 's'} requiring immediate outreach!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playOverdueChime();
                setToastMessage('🔔 Audio chime played.');
                setTimeout(() => setToastMessage(null), 2500);
              }}
              title="Play gentle chime alert"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/50 hover:bg-rose-900/70 px-3 py-1.5 text-xs font-bold text-rose-200 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Volume2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Chime Alert</span>
            </button>
          </div>
        </div>
      )}

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
                    title="Add to Google Calendar"
                    className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-2 text-xs font-semibold transition-all inline-flex items-center justify-center cursor-pointer"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-emerald-400" />
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
                    title="Download .ics Calendar File"
                    className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-2 text-xs font-semibold transition-all inline-flex items-center justify-center cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                  </button>
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

        {/* Multi-WhatsApp Sender Profile & Account Safety Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              Active WhatsApp Line:
            </span>
            <select
              value={activeSenderProfileId}
              onChange={(e) => {
                setActiveSenderProfile(e.target.value);
                const selected = senderProfiles.find((p) => p.id === e.target.value);
                if (selected) {
                  setToastMessage(`📱 Switched sender to: ${selected.name} (${selected.phone})`);
                  setTimeout(() => setToastMessage(null), 3000);
                }
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
            >
              {senderProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} • {p.phone} {p.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="text-[11px] text-zinc-400 hidden sm:flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Anti-Spam Safety: Switch lines across outbound batches</span>
          </div>
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

            {/* Engaged / Replied Bucket */}
            <button
              onClick={() => setActiveBucket('engaged')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeBucket === 'engaged'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40 ring-1 ring-teal-400/40'
                  : 'bg-zinc-900 text-teal-400 hover:text-teal-300 hover:bg-zinc-800 border border-teal-500/20'
              }`}
              title="Prospects who replied / in active 1-on-1 conversations (Cadence auto-paused)"
            >
              <span>💬 Engaged</span>
              {engagedStages.length > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    activeBucket === 'engaged' ? 'bg-white/20 text-white' : 'bg-teal-950 text-teal-300 border border-teal-500/30'
                  }`}
                >
                  {engagedStages.length}
                </span>
              )}
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

        {/* Warmth Priority Quick Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            Priority:
          </span>
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'hot', label: '🔥 Hot Priority', activeColor: 'bg-rose-500 text-white' },
            { id: 'warm', label: '⚡ Warm Touchpoints', activeColor: 'bg-cyan-500 text-white' },
            { id: 'cold', label: '❄️ Cold Outreach', activeColor: 'bg-zinc-700 text-zinc-100' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setWarmthFilter(item.id as any)}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                warmthFilter === item.id
                  ? `${item.activeColor || 'bg-amber-500 text-zinc-950'} shadow-md`
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {item.label}
            </button>
          ))}
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
              const isEngaged = Boolean(
                lead?.isCadencePaused ||
                stage.viewStatus === 'replied' ||
                stages.some((st) => st.leadId === lead?.id && st.viewStatus === 'replied')
              );

              return (
                <div
                  key={stage.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 shadow-xl transition-all ${
                    isEngaged
                      ? 'border-teal-500/60 bg-gradient-to-br from-teal-950/30 via-zinc-900/90 to-zinc-950 shadow-teal-950/30 ring-1 ring-teal-500/40'
                      : isLate
                      ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-zinc-900/90 to-zinc-900 shadow-rose-950/20'
                      : 'border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  {/* Top Bar: Lead details & badges */}
                  <div className="space-y-3">
                    {/* Client Engaged & Auto-Cadence Paused Highlight Banner */}
                    {isEngaged && (
                      <div className="rounded-xl border border-teal-500/40 bg-teal-950/40 p-2.5 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
                            </span>
                            <span className="text-xs font-bold text-teal-300">
                              💬 Client Engaged & Talking!
                            </span>
                          </div>
                          <span className="rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 border border-teal-500/30">
                            Cadence Auto-Snoozed (+7d)
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-snug">
                          Automated follow-up cadence is auto-paused so you can chat 1-on-1 freely without sending canned scripts.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-teal-500/20">
                          <button
                            type="button"
                            onClick={() => onScheduleMeetingForLead(lead.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Book Meeting</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              resumeCadence(lead.id);
                              setToastMessage(`✓ Automated cadence resumed for "${lead.name}".`);
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 text-xs font-semibold transition-all cursor-pointer"
                            title="Resume automated follow-ups if client went cold"
                          >
                            <span>▶️ Resume Cadence</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-zinc-100 text-base truncate">
                            {lead.name}
                          </h4>
                          <CountryBadge country={lead} size="sm" showName={true} />
                          <ProspectTimeBadge isoCode={lead.isoCode} showDetails />
                        </div>
                        {lead.company && (
                          <p className="text-xs text-zinc-400 font-medium truncate">
                            {lead.company}
                          </p>
                        )}
                      </div>

                      {/* Stage, Warmth & Overdue indicator */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <LeadWarmthBadge lead={lead} stages={stages} />
                          <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-700/60 uppercase">
                            {STAGE_TITLES[stage.stageNumber]}
                          </span>
                        </div>
                        {isLate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/40 animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            Overdue ({lateDays}d late)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone & Tools row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <PhoneBadge
                        phone={lead.phoneRaw}
                        sanitizedPhone={lead.phoneSanitized}
                        flagEmoji={lead.flagEmoji}
                        isoCode={lead.isoCode}
                        prefilledText={selectedCustomScripts[lead.id] || stage.templateScript}
                      />
                      <div className="flex items-center gap-1.5">
                        {lead.niche && (
                          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                            {lead.niche}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedObjectionLead(lead)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 transition-all cursor-pointer shadow-sm"
                          title="Instant objection responses & 30-sec voice note scripts"
                        >
                          <ShieldAlert className="h-3 w-3 text-amber-400" />
                          <span>Objections</span>
                          <span className="text-[9px] text-cyan-400 font-bold">• 🎙️ Voice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSnoozeTarget({ lead, stage })}
                          className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 transition-all cursor-pointer shadow-sm"
                          title="Snooze / Reschedule this follow-up stage"
                        >
                          <Clock className="h-3 w-3 text-purple-400" />
                          <span>Snooze</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Prospect Note & Timeline */}
                    <div className="pt-2 border-t border-zinc-800/60">
                      {editingNoteLeadId === lead.id ? (
                        <div className="space-y-1.5 animate-in fade-in">
                          <textarea
                            value={tempNoteText}
                            onChange={(e) => setTempNoteText(e.target.value)}
                            placeholder="E.g., Client requested call back after 5pm, asked for case study..."
                            rows={2}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingNoteLeadId(null)}
                              className="rounded-lg px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setLeadNote(lead.id, tempNoteText);
                                setEditingNoteLeadId(null);
                                setToastMessage(`✓ Note saved for "${lead.name}".`);
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white transition-all shadow cursor-pointer"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNoteLeadId(lead.id);
                            setTempNoteText(lead.notes || '');
                          }}
                          className="group flex items-center justify-between gap-2 p-1.5 rounded-xl bg-zinc-950/40 hover:bg-zinc-800/40 border border-zinc-800/40 hover:border-zinc-700/60 cursor-pointer transition-all"
                          title="Click to edit prospect note"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileEdit className="h-3 w-3 text-emerald-400 shrink-0" />
                            <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 truncate">
                              {lead.notes ? lead.notes : 'Add quick prospect note...'}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 group-hover:text-emerald-400 font-semibold shrink-0">
                            {lead.notes ? 'Edit' : '+ Note'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dynamic WhatsApp Script Variant Selector & Live Preview */}
                    <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedVariantLeadId(
                              expandedVariantLeadId === lead.id ? null : lead.id
                            )
                          }
                          className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>
                            {expandedVariantLeadId === lead.id
                              ? 'Hide Message Script'
                              : 'Script Variant (A/B/C)'}
                          </span>
                          {expandedVariantLeadId === lead.id ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const text =
                              selectedCustomScripts[lead.id] || stage.templateScript;
                            navigator.clipboard.writeText(text);
                            setToastMessage(`✓ Message script copied for "${lead.name}".`);
                            setTimeout(() => setToastMessage(null), 2500);
                          }}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="h-2.5 w-2.5" />
                          <span>Copy Script</span>
                        </button>
                      </div>

                      {expandedVariantLeadId === lead.id && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 space-y-2 animate-in fade-in">
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">
                              Angle:
                            </span>
                            {(SCRIPT_VARIANTS_MAP[stage.stageNumber] || []).map((variant, idx) => {
                              const personalized = interpolateTemplate(variant.content, {
                                name: lead.name,
                                company: lead.company,
                              });
                              const isSelected =
                                (selectedCustomScripts[lead.id] || stage.templateScript) ===
                                personalized;

                              return (
                                <button
                                  key={variant.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomScripts((prev) => ({
                                      ...prev,
                                      [lead.id]: personalized,
                                    }));
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-teal-600 text-white shadow-sm'
                                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                  }`}
                                  title={variant.label}
                                >
                                  {`Var ${String.fromCharCode(65 + idx)}: ${variant.label.split(':')[1]?.trim() || variant.label}`}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60 italic">
                            &ldquo;
                            {selectedCustomScripts[lead.id] || stage.templateScript}
                            &rdquo;
                          </p>
                        </div>
                      )}
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
                                  `💬 Client Replied! "${lead.name}" cadence auto-paused & snoozed (+7d) to protect 1-on-1 chat.`
                                );
                                setTimeout(() => setToastMessage(null), 4000);
                              }}
                              className={`px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer text-center flex items-center justify-center ${
                                targetStage.viewStatus === 'replied'
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40'
                                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500 hover:text-emerald-300'
                              }`}
                              title="Client responded / knocked back — Cadence auto-pauses & snoozes +7d"
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

                    {/* Actions: Message Sent & WhatsApp Launch or Engaged 1-on-1 Mode */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {isEngaged ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanUrl = buildWhatsAppUrl(lead.phoneSanitized, '');
                              window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                            }}
                            title="Open WhatsApp chat for manual 1-on-1 messaging without canned script"
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/20 hover:bg-teal-500/30 text-xs font-bold text-teal-300 px-3 py-2.5 transition-all cursor-pointer whitespace-nowrap"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-teal-400" />
                            <span>1-on-1 Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onScheduleMeetingForLead(lead.id)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            <Calendar className="h-3.5 w-3.5 text-white" />
                            <span>Book Meeting</span>
                          </button>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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

      {/* Instant Objection Playbook & Voice Note Scripts Modal */}
      <ObjectionBusterModal
        isOpen={Boolean(selectedObjectionLead)}
        onClose={() => setSelectedObjectionLead(null)}
        lead={selectedObjectionLead}
      />

      {/* Follow-up Snooze & Reschedule Modal */}
      <SnoozeModal
        isOpen={Boolean(snoozeTarget)}
        onClose={() => setSnoozeTarget(null)}
        lead={snoozeTarget?.lead}
        stage={snoozeTarget?.stage}
        onSnoozed={(leadName, date) => {
          setToastMessage(`✓ Follow-up for "${leadName}" snoozed to ${date}.`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />
    </div>
  );
};
