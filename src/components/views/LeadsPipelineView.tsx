'use client';

import React, { useState, useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { Lead, CadenceStageNumber, KillSwitchStatus, StageViewStatus } from '@/types/crm';
import { STAGE_TITLES, getTodayISO, addDays, getDaysAgo } from '@/lib/date-utils';
import { CountryBadge } from '../common/CountryBadge';
import { PhoneBadge } from '../common/PhoneBadge';
import { ProspectTimeBadge } from '../common/ProspectTimeBadge';
import { LeadWarmthBadge } from '../common/LeadWarmthBadge';
import { calculateLeadWarmth } from '@/lib/warmth';
import { ObjectionBusterModal } from '../modals/ObjectionBusterModal';
import { SnoozeModal } from '../modals/SnoozeModal';
import { CadenceStage } from '@/types/crm';
import {
  Users,
  Search,
  Calendar,
  Trash2,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  ExternalLink,
  Download,
  CheckCircle2,
  FileEdit,
  ShieldAlert,
  Flame,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { exportLeadsToCSV } from '@/lib/csv-export';

interface LeadsPipelineViewProps {
  onScheduleMeeting: (leadId: string) => void;
  onOpenNewLead: () => void;
}

export const LeadsPipelineView: React.FC<LeadsPipelineViewProps> = ({
  onScheduleMeeting,
  onOpenNewLead,
}) => {
  const leads = useCRMStore((s) => s.leads);
  const stages = useCRMStore((s) => s.stages);
  const setStageViewStatus = useCRMStore((s) => s.setStageViewStatus);
  const deleteLead = useCRMStore((s) => s.deleteLead);
  const advanceLeadStage = useCRMStore((s) => s.advanceLeadStage);
  const setKillSwitch = useCRMStore((s) => s.setKillSwitch);
  const reviveLead = useCRMStore((s) => s.reviveLead);
  const searchQuery = useCRMStore((s) => s.searchQuery);
  const niches = useCRMStore((s) => s.niches);
  const selectedNicheFilter = useCRMStore((s) => s.selectedNicheFilter);
  const setSelectedNicheFilter = useCRMStore((s) => s.setSelectedNicheFilter);
  const setLeadNote = useCRMStore((s) => s.setLeadNote);

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterWarmth, setFilterWarmth] = useState<string>('all');
  const [mobileKanbanStage, setMobileKanbanStage] = useState<number | 'all'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingNoteLeadId, setEditingNoteLeadId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [selectedObjectionLead, setSelectedObjectionLead] = useState<Lead | null>(null);
  const [snoozeTarget, setSnoozeTarget] = useState<{ lead: Lead; stage: CadenceStage } | null>(null);

  const handleMessageSent = (lead: Lead) => {
    advanceLeadStage(lead.id);
    const nextLabel = lead.currentStage < 5 ? `Follow-up ${lead.currentStage + 1}` : 'Completed';
    setToastMessage(`✓ Message Sent! "${lead.name}" automatically moved to ${nextLabel}.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRevive = (lead: Lead) => {
    const { whatsappUrl } = reviveLead(lead.id);
    setToastMessage(`✓ "${lead.name}" revived into active pipeline Stage 0!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Extract unique countries
  const countries = useMemo(() => {
    const map = new Map<string, { iso: string; name: string; flag: string }>();
    leads.forEach((l) => {
      if (l.isoCode) {
        map.set(l.isoCode, { iso: l.isoCode, name: l.countryName, flag: l.flagEmoji });
      }
    });
    return Array.from(map.values());
  }, [leads]);

  // Filtered Leads with Date Range Support
  const filteredLeads = useMemo(() => {
    const today = getTodayISO();
    return leads.filter((lead) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchPhone = lead.phoneRaw.includes(q);
        const matchCompany = lead.company?.toLowerCase().includes(q);
        const matchCountry = lead.countryName.toLowerCase().includes(q);
        const matchNiche = lead.niche?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCompany && !matchCountry && !matchNiche) return false;
      }

      if (filterStage !== 'all' && lead.currentStage !== parseInt(filterStage, 10)) {
        return false;
      }

      if (filterStatus === 'revivable') {
        const daysInactive = getDaysAgo(lead.updatedAt || lead.createdAt);
        const isDormant = lead.killSwitchStatus === 'completed' || lead.killSwitchStatus === 'not_interested';
        if (!isDormant || daysInactive < 25) return false;
      } else if (filterStatus !== 'all' && lead.killSwitchStatus !== filterStatus) {
        return false;
      }

      if (filterCountry !== 'all' && lead.isoCode !== filterCountry) {
        return false;
      }

      if (selectedNicheFilter !== 'all' && lead.niche !== selectedNicheFilter) {
        return false;
      }

      // Date registered filter
      if (filterDate !== 'all') {
        const createdDate = (lead.createdAt || lead.updatedAt || '').split('T')[0];
        if (filterDate === 'today' && createdDate !== today) return false;
        if (filterDate === 'yesterday' && createdDate !== addDays(today, -1)) return false;
        if (filterDate === '7d' && createdDate < addDays(today, -7)) return false;
        if (filterDate === '15d' && createdDate < addDays(today, -15)) return false;
        if (filterDate === '30d' && createdDate < addDays(today, -30)) return false;
      }

      // Warmth Priority filter
      if (filterWarmth !== 'all') {
        const warmth = calculateLeadWarmth(lead, stages);
        if (warmth.level !== filterWarmth) return false;
      }

      return true;
    });
  }, [leads, stages, searchQuery, filterStage, filterStatus, filterCountry, selectedNicheFilter, filterDate, filterWarmth]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Floating Real-time Success Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Lead Hunting & Pipeline Directory ({filteredLeads.length})
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Auto-country detection, universal WhatsApp click-to-chat, and cadence status
          </p>
        </div>

        {/* View mode toggle & Add */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => exportLeadsToCSV(filteredLeads)}
            title="Export filtered leads to CSV"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenNewLead}
            className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-95"
          >
            + Add Target Lead
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-zinc-900/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/80">
        <Filter className="h-4 w-4 text-zinc-400 shrink-0 ml-1 hidden xs:block" />

        {/* Stage Filter */}
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="flex-1 min-w-[130px] sm:flex-initial rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
        >
          <option value="all">All Stages</option>
          <option value="0">Stage 0: Initial Outreach</option>
          <option value="1">Stage 1: Follow-up 1</option>
          <option value="2">Stage 2: Follow-up 2</option>
          <option value="3">Stage 3: Follow-up 3</option>
          <option value="4">Stage 4: Follow-up 4</option>
          <option value="5">Stage 5: Follow-up 5 (Breakup)</option>
        </select>

        {/* Status / Kill Switch Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 min-w-[130px] sm:flex-initial rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Outreach Loop</option>
          <option value="booked_meeting">Booked Meeting</option>
          <option value="not_interested">Not Interested / Opt-Out</option>
          <option value="wrong_number">Wrong Number</option>
          <option value="completed">Completed Cadence</option>
          <option value="revivable">♻️ Dormant / Revivable (25d+)</option>
        </select>

        {/* Country Filter */}
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="flex-1 min-w-[120px] sm:flex-initial rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
        >
          <option value="all">All Countries</option>
          {countries.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.name} ({c.iso})
            </option>
          ))}
        </select>

        {/* Niche Filter */}
        <select
          value={selectedNicheFilter}
          onChange={(e) => setSelectedNicheFilter(e.target.value)}
          className="flex-1 min-w-[120px] sm:flex-initial rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-medium"
        >
          <option value="all">All Niches</option>
          {niches.map((n) => (
            <option key={n.id} value={n.name}>
              {n.name}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="flex-1 min-w-[130px] sm:flex-initial rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-medium"
        >
          <option value="all">📅 All Dates</option>
          <option value="today">📅 Registered Today</option>
          <option value="yesterday">📅 Yesterday</option>
          <option value="7d">📅 Last 7 Days</option>
          <option value="15d">📅 Last 15 Days</option>
          <option value="30d">📅 Last 30 Days</option>
        </select>

        {/* Warmth Priority Filter */}
        <select
          value={filterWarmth}
          onChange={(e) => setFilterWarmth(e.target.value)}
          className="flex-1 min-w-[125px] sm:flex-initial rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-bold"
        >
          <option value="all">🔥 All Warmth</option>
          <option value="hot">🔥 Hot Leads</option>
          <option value="warm">⚡ Warm Leads</option>
          <option value="cold">❄️ Cold Leads</option>
        </select>
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Users className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-zinc-200 text-base">Pipeline is Clean & Ready!</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            No leads currently in your pipeline. Click &ldquo;+ Add Target Lead&rdquo; or use &ldquo;Bulk Import&rdquo; to add prospects for your target niches.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenNewLead}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer"
            >
              <Users className="h-3.5 w-3.5" />
              <span>+ Add First Target Lead</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="space-y-3">
          {/* Mobile Card List (sm:hidden) */}
          <div className="sm:hidden space-y-3">
            {filteredLeads.map((lead) => {
              const prevStageNum = lead.currentStage > 0 ? lead.currentStage - 1 : 0;
              const targetStage =
                lead.currentStage > 0
                  ? stages.find((s) => s.leadId === lead.id && s.stageNumber === prevStageNum) ||
                    stages.find((s) => s.leadId === lead.id && s.stageNumber === lead.currentStage)
                  : stages.find((s) => s.leadId === lead.id && s.stageNumber === 0);

              const isDormant =
                (lead.killSwitchStatus === 'completed' || lead.killSwitchStatus === 'not_interested') &&
                getDaysAgo(lead.updatedAt || lead.createdAt) >= 25;

              return (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl space-y-3 backdrop-blur"
                >
                  {/* Card Header: Lead Name, Country, Time, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-zinc-100 text-sm truncate">
                          {lead.name}
                        </h4>
                        <CountryBadge country={lead} size="sm" showName={false} />
                        <ProspectTimeBadge isoCode={lead.isoCode} />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-zinc-400">
                        {lead.company && <span className="font-medium text-zinc-300">{lead.company}</span>}
                        {lead.niche && (
                          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            {lead.niche}
                          </span>
                        )}
                        <LeadWarmthBadge lead={lead} stages={stages} />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          lead.killSwitchStatus === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : lead.killSwitchStatus === 'booked_meeting'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : lead.killSwitchStatus === 'not_interested'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {lead.killSwitchStatus.replace('_', ' ')}
                      </span>
                      {isDormant && (
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                          ⏳ {getDaysAgo(lead.updatedAt || lead.createdAt)}d Dormant
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phone & Stage Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                    <PhoneBadge
                      phone={lead.phoneRaw}
                      sanitizedPhone={lead.phoneSanitized}
                      flagEmoji={lead.flagEmoji}
                      isoCode={lead.isoCode}
                      prefilledText={targetStage?.templateScript || 'Hello!'}
                    />

                    <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-[10px] font-bold text-zinc-300 border border-zinc-700/60">
                      {STAGE_TITLES[lead.currentStage]}
                    </span>
                  </div>

                  {/* Notes if available */}
                  {lead.notes && (
                    <p className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/60 italic flex items-center gap-1.5">
                      <FileEdit className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="line-clamp-2">{lead.notes}</span>
                    </p>
                  )}

                  {/* Engagement Status Pill Row */}
                  {targetStage && (
                    <div className="grid grid-cols-4 gap-1 pt-2 border-t border-zinc-800/60">
                      {(['unseen', 'seen', 'replied', 'rejected'] as StageViewStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setStageViewStatus(targetStage.id, st);
                            setToastMessage(`✓ ${lead.name} marked as ${st.toUpperCase()}.`);
                            setTimeout(() => setToastMessage(null), 2500);
                          }}
                          className={`py-1.5 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            targetStage.viewStatus === st
                              ? st === 'replied'
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : st === 'seen'
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                : st === 'rejected'
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-zinc-800 border-zinc-600 text-zinc-200'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {st === 'unseen' ? '⏳ Unseen' : st === 'seen' ? '👁️ Seen' : st === 'replied' ? '💬 Reply' : '❌ Reject'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedObjectionLead(lead)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300 transition-all cursor-pointer shadow-sm"
                        title="Instant Objections"
                      >
                        <ShieldAlert className="h-3 w-3 text-amber-400" />
                        <span>Objection</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const stage = stages.find((s) => s.leadId === lead.id && s.stageNumber === lead.currentStage);
                          if (stage) setSnoozeTarget({ lead, stage });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 text-[10px] font-bold text-purple-300 transition-all cursor-pointer shadow-sm"
                        title="Snooze"
                      >
                        <Clock className="h-3 w-3 text-purple-400" />
                        <span>Snooze</span>
                      </button>
                      {isDormant && (
                        <button
                          type="button"
                          onClick={() => handleRevive(lead)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300 transition-all cursor-pointer shadow-sm"
                          title="Revive Dormant Lead"
                        >
                          <RotateCcw className="h-3 w-3 text-amber-400" />
                          <span>Revive</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onScheduleMeeting(lead.id)}
                        title="Schedule Meeting"
                        className="rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 p-2 transition-colors cursor-pointer"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        title="Delete Lead"
                        className="rounded-lg text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 p-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl backdrop-blur">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="border-b border-zinc-800 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Lead & Company</th>
                  <th className="px-4 py-3">Country & Flag</th>
                  <th className="px-4 py-3">WhatsApp Click-to-Chat</th>
                  <th className="px-4 py-3">Cadence Stage</th>
                  <th className="px-4 py-3">Message Status</th>
                  <th className="px-4 py-3">Pipeline Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredLeads.map((lead) => {
                const prevStageNum = lead.currentStage > 0 ? (lead.currentStage - 1) : 0;
                const targetStage =
                  lead.currentStage > 0
                    ? stages.find((s) => s.leadId === lead.id && s.stageNumber === prevStageNum) ||
                      stages.find((s) => s.leadId === lead.id && s.stageNumber === lead.currentStage)
                    : stages.find((s) => s.leadId === lead.id && s.stageNumber === 0);

                return (
                  <tr key={lead.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-zinc-100 text-sm">{lead.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {lead.company && (
                          <span className="text-zinc-400 text-xs">{lead.company}</span>
                        )}
                        {lead.niche && (
                          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400">
                            {lead.niche}
                          </span>
                        )}
                        {lead.createdAt && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            📅 {lead.createdAt.split('T')[0]}
                          </span>
                        )}
                      </div>
                      {lead.notes && (
                        <p className="text-[11px] text-zinc-400 italic line-clamp-1 mt-1 flex items-center gap-1">
                          <FileEdit className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>{lead.notes}</span>
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1.5">
                        <CountryBadge country={lead} size="sm" showName={true} />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ProspectTimeBadge isoCode={lead.isoCode} />
                          <LeadWarmthBadge lead={lead} stages={stages} />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <PhoneBadge
                        phone={lead.phoneRaw}
                        sanitizedPhone={lead.phoneSanitized}
                        flagEmoji={lead.flagEmoji}
                        isoCode={lead.isoCode}
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-200 border border-zinc-700/60 whitespace-nowrap">
                          {STAGE_TITLES[lead.currentStage]}
                        </span>
                        {lead.killSwitchStatus === 'active' && lead.currentStage < 5 && (
                          <button
                            type="button"
                            onClick={() => handleMessageSent(lead)}
                            title={`Click to mark message as sent and automatically advance lead to Follow-up ${lead.currentStage + 1}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-950/40 whitespace-nowrap cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            <span>Message Sent → FU {lead.currentStage + 1}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {targetStage ? (
                        <div className="flex flex-col gap-1">
                          <select
                            value={targetStage.viewStatus || 'unseen'}
                            onChange={(e) => {
                              const newStatus = e.target.value as StageViewStatus;
                              setStageViewStatus(targetStage.id, newStatus);
                              const stageLabel = STAGE_TITLES[targetStage.stageNumber];
                              setToastMessage(
                                newStatus === 'replied'
                                  ? `💬 Client Replied! "${lead.name}" cadence auto-paused & snoozed (+7d).`
                                  : `✓ "${lead.name}"'s ${stageLabel} marked as "${newStatus.toUpperCase()}".`
                              );
                              setTimeout(() => setToastMessage(null), 3500);
                            }}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-all cursor-pointer ${
                              targetStage.viewStatus === 'replied'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : targetStage.viewStatus === 'seen'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : targetStage.viewStatus === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            <option value="unseen">⏳ Unseen</option>
                            <option value="seen">👁️ Seen</option>
                            <option value="replied">💬 Replied</option>
                            <option value="rejected">❌ Rejected</option>
                          </select>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                              {lead.currentStage > 0
                                ? `Last Msg (${STAGE_TITLES[targetStage.stageNumber]})`
                                : 'Initial Outreach'}
                            </span>
                            {lead.isCadencePaused && (
                              <span className="inline-flex items-center text-[9px] text-teal-300 font-bold bg-teal-500/15 border border-teal-500/30 px-1.5 py-0.2 rounded">
                                💬 Paused
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            lead.killSwitchStatus === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : lead.killSwitchStatus === 'booked_meeting'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : lead.killSwitchStatus === 'not_interested'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {lead.killSwitchStatus.replace('_', ' ')}
                        </span>
                        {((lead.killSwitchStatus === 'completed' || lead.killSwitchStatus === 'not_interested') && getDaysAgo(lead.updatedAt || lead.createdAt) >= 25) && (
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                            ⏳ {getDaysAgo(lead.updatedAt || lead.createdAt)}d Dormant
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {((lead.killSwitchStatus === 'completed' || lead.killSwitchStatus === 'not_interested') && getDaysAgo(lead.updatedAt || lead.createdAt) >= 25) && (
                          <button
                            type="button"
                            onClick={() => handleRevive(lead)}
                            title="Revive Dormant Lead (30-Day Win-Back Engine)"
                            className="rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 p-1.5 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedObjectionLead(lead)}
                          title="Instant Objection Responses & Voice Note Scripts"
                          className="rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 p-1.5 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const stage = stages.find((s) => s.leadId === lead.id && s.stageNumber === lead.currentStage);
                            if (stage) setSnoozeTarget({ lead, stage });
                          }}
                          title="Snooze / Reschedule Follow-up"
                          className="rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 p-1.5 transition-colors cursor-pointer"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onScheduleMeeting(lead.id)}
                          title="Schedule Intelligent Meeting"
                          className="rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 p-1.5 transition-colors"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          title="Delete Lead"
                          className="rounded-lg text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 p-1.5 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
        /* Render Mode: Kanban by Cadence Stage */
        <div className="space-y-3">
          {/* Mobile Stage Switcher Pills */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setMobileKanbanStage('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
                mobileKanbanStage === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
              }`}
            >
              All Columns
            </button>
            {([0, 1, 2, 3, 4, 5] as CadenceStageNumber[]).map((num) => (
              <button
                key={num}
                onClick={() => setMobileKanbanStage(num)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
                  mobileKanbanStage === num
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                }`}
              >
                {num === 0 ? 'Initial' : num === 5 ? 'Breakup' : `FU ${num}`}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
            {([0, 1, 2, 3, 4, 5] as CadenceStageNumber[]).map((stageNum) => {
              if (mobileKanbanStage !== 'all' && stageNum !== mobileKanbanStage) {
                return null;
              }
              const stageLeads = filteredLeads.filter((l) => l.currentStage === stageNum);
              return (
                <div
                  key={stageNum}
                  className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 min-w-[220px]"
                >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-200">
                    {stageNum === 0 ? 'Initial' : stageNum === 5 ? 'Breakup' : `FU ${stageNum}`}
                  </h4>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.2 text-[10px] font-bold text-zinc-400">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                  {stageLeads.map((lead) => {
                    const prevStageNum = lead.currentStage > 0 ? (lead.currentStage - 1) : 0;
                    const targetStage =
                      lead.currentStage > 0
                        ? stages.find(
                            (s) => s.leadId === lead.id && s.stageNumber === prevStageNum
                          ) ||
                          stages.find(
                            (s) => s.leadId === lead.id && s.stageNumber === lead.currentStage
                          )
                        : stages.find((s) => s.leadId === lead.id && s.stageNumber === 0);

                    return (
                      <div
                        key={lead.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 shadow space-y-2 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-zinc-100 text-xs truncate max-w-[120px]">
                            {lead.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <LeadWarmthBadge lead={lead} stages={stages} showText={false} />
                            <span className="text-sm">{lead.flagEmoji}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          {lead.company && (
                            <p className="text-[11px] text-zinc-400 truncate max-w-[110px]">{lead.company}</p>
                          )}
                          <ProspectTimeBadge isoCode={lead.isoCode} className="text-[9px] py-0 px-1" />
                        </div>
                        {lead.niche && (
                          <div className="pt-0.5 flex items-center justify-between gap-1 flex-wrap">
                            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400">
                              {lead.niche}
                            </span>
                            {lead.createdAt && (
                              <span className="text-[9px] text-zinc-500 font-mono">
                                📅 {lead.createdAt.split('T')[0]}
                              </span>
                            )}
                          </div>
                        )}
                        {!lead.niche && lead.createdAt && (
                          <div className="pt-0.5">
                            <span className="text-[9px] text-zinc-500 font-mono">
                              📅 {lead.createdAt.split('T')[0]}
                            </span>
                          </div>
                        )}
                        <PhoneBadge
                          phone={lead.phoneRaw}
                          sanitizedPhone={lead.phoneSanitized}
                          flagEmoji={lead.flagEmoji}
                          isoCode={lead.isoCode}
                          className="text-[10px] py-0.5 px-1.5"
                        />

                        {/* Quick Note Editor */}
                        <div className="pt-1.5 border-t border-zinc-800/60">
                          {editingNoteLeadId === lead.id ? (
                            <div className="space-y-1.5 animate-in fade-in">
                              <textarea
                                value={tempNoteText}
                                onChange={(e) => setTempNoteText(e.target.value)}
                                placeholder="Add note..."
                                rows={2}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans"
                              />
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteLeadId(null)}
                                  className="rounded px-1.5 py-0.5 text-[9px] text-zinc-400 hover:text-zinc-200"
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
                                  className="rounded bg-emerald-600 hover:bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white transition-all shadow cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingNoteLeadId(lead.id);
                                setTempNoteText(lead.notes || '');
                              }}
                              className="group flex items-center justify-between gap-1 p-1 rounded-lg bg-zinc-950/40 hover:bg-zinc-800/40 border border-zinc-800/40 hover:border-zinc-700/60 cursor-pointer transition-all"
                              title="Click to edit prospect note"
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <FileEdit className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 truncate">
                                  {lead.notes ? lead.notes : 'Add note...'}
                                </span>
                              </div>
                              <span className="text-[9px] text-zinc-500 group-hover:text-emerald-400 font-semibold shrink-0">
                                {lead.notes ? 'Edit' : '+'}
                              </span>
                            </div>
                          )}
                        </div>

                        {targetStage && (
                          <div className="pt-1.5 border-t border-zinc-800/60 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] text-zinc-400 font-semibold truncate">
                                {lead.currentStage > 0
                                  ? `Last (${STAGE_TITLES[targetStage.stageNumber]}):`
                                  : 'Status:'}
                              </span>
                              <select
                                value={targetStage.viewStatus || 'unseen'}
                                onChange={(e) => {
                                  const newStatus = e.target.value as StageViewStatus;
                                  setStageViewStatus(targetStage.id, newStatus);
                                  const stageLabel = STAGE_TITLES[targetStage.stageNumber];
                                  setToastMessage(
                                    newStatus === 'replied'
                                      ? `💬 Client Replied! "${lead.name}" cadence auto-paused & snoozed (+7d).`
                                      : `✓ "${lead.name}"'s ${stageLabel} marked as "${newStatus.toUpperCase()}".`
                                  );
                                  setTimeout(() => setToastMessage(null), 3500);
                                }}
                                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                                  targetStage.viewStatus === 'replied'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : targetStage.viewStatus === 'seen'
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                    : targetStage.viewStatus === 'rejected'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                }`}
                              >
                                <option value="unseen">⏳ Unseen</option>
                                <option value="seen">👁️ Seen</option>
                                <option value="replied">💬 Replied</option>
                                <option value="rejected">❌ Rejected</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {lead.isCadencePaused ? (
                          <div className="w-full mt-2 p-1.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-300 text-[10px] font-bold text-center flex items-center justify-center gap-1">
                            <span>💬 Client Engaged (Cadence Paused)</span>
                          </div>
                        ) : (
                          lead.killSwitchStatus === 'active' && lead.currentStage < 5 && (
                            <button
                              type="button"
                              onClick={() => handleMessageSent(lead)}
                              title={`Click to mark message as sent and automatically advance lead to Follow-up ${lead.currentStage + 1}`}
                              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1.5 px-2 transition-all active:scale-95 shadow-md shadow-emerald-950/40 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              <span>Message Sent → FU {lead.currentStage + 1}</span>
                            </button>
                          )
                        )}

                        {((lead.killSwitchStatus === 'completed' || lead.killSwitchStatus === 'not_interested') && getDaysAgo(lead.updatedAt || lead.createdAt) >= 25) && (
                          <button
                            type="button"
                            onClick={() => handleRevive(lead)}
                            title="Revive Dormant Lead (30-Day Win-Back Engine)"
                            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white text-[11px] font-bold py-1.5 px-2 transition-all active:scale-95 shadow-md shadow-amber-950/40 cursor-pointer ring-1 ring-amber-400/30"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-white" />
                            <span>♻️ Revive (Win-Back)</span>
                          </button>
                        )}

                        {/* Card Footer: Objections, Snooze & Delete */}
                        <div className="pt-2 flex items-center justify-between gap-1 border-t border-zinc-800/60 mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedObjectionLead(lead)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 transition-all cursor-pointer shadow-sm"
                              title="Instant objection responses & 30-sec voice note scripts"
                            >
                              <ShieldAlert className="h-2.5 w-2.5 text-amber-400" />
                              <span>Objection</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const stage = stages.find((s) => s.leadId === lead.id && s.stageNumber === lead.currentStage);
                                if (stage) setSnoozeTarget({ lead, stage });
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 transition-all cursor-pointer shadow-sm"
                              title="Snooze / Reschedule Follow-up"
                            >
                              <Clock className="h-2.5 w-2.5 text-purple-400" />
                              <span>Snooze</span>
                            </button>
                            {((lead.killSwitchStatus === 'completed' || lead.killSwitchStatus === 'not_interested') && getDaysAgo(lead.updatedAt || lead.createdAt) >= 25) && (
                              <button
                                type="button"
                                onClick={() => handleRevive(lead)}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 transition-all cursor-pointer shadow-sm"
                                title="Revive Dormant Lead (30-Day Win-Back Engine)"
                              >
                                <RotateCcw className="h-2.5 w-2.5 text-amber-400" />
                                <span>Revive</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteLead(lead.id)}
                            title="Delete Lead"
                            className="text-zinc-600 hover:text-rose-400 p-1 transition-colors cursor-pointer rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

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
