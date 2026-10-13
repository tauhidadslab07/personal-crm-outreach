'use client';

import React, { useState, useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { Lead, CadenceStageNumber, KillSwitchStatus } from '@/types/crm';
import { STAGE_TITLES } from '@/lib/date-utils';
import { CountryBadge } from '../common/CountryBadge';
import { PhoneBadge } from '../common/PhoneBadge';
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
  const deleteLead = useCRMStore((s) => s.deleteLead);
  const advanceLeadStage = useCRMStore((s) => s.advanceLeadStage);
  const setKillSwitch = useCRMStore((s) => s.setKillSwitch);
  const searchQuery = useCRMStore((s) => s.searchQuery);
  const niches = useCRMStore((s) => s.niches);
  const selectedNicheFilter = useCRMStore((s) => s.selectedNicheFilter);
  const setSelectedNicheFilter = useCRMStore((s) => s.setSelectedNicheFilter);

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleMessageSent = (lead: Lead) => {
    advanceLeadStage(lead.id);
    const nextLabel = lead.currentStage < 5 ? `Follow-up ${lead.currentStage + 1}` : 'Completed';
    setToastMessage(`✓ Message Sent! "${lead.name}" automatically moved to ${nextLabel}.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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

  // Filtered Leads
  const filteredLeads = useMemo(() => {
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

      if (filterStatus !== 'all' && lead.killSwitchStatus !== filterStatus) {
        return false;
      }

      if (filterCountry !== 'all' && lead.isoCode !== filterCountry) {
        return false;
      }

      if (selectedNicheFilter !== 'all' && lead.niche !== selectedNicheFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, filterStage, filterStatus, filterCountry, selectedNicheFilter]);

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
      <div className="flex flex-wrap items-center gap-2.5 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
        <Filter className="h-4 w-4 text-zinc-400 shrink-0 ml-1" />

        {/* Stage Filter */}
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
        >
          <option value="all">All Cadence Stages</option>
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
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
        >
          <option value="all">All Pipeline Statuses</option>
          <option value="active">Active Outreach Loop</option>
          <option value="booked_meeting">Booked Meeting</option>
          <option value="not_interested">Not Interested / Opt-Out</option>
          <option value="wrong_number">Wrong Number</option>
          <option value="completed">Completed Cadence</option>
        </select>

        {/* Country Filter */}
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
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
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-medium"
        >
          <option value="all">All Niches</option>
          {niches.map((n) => (
            <option key={n.id} value={n.name}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      {/* Render Mode: Table */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl backdrop-blur">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Lead & Company</th>
                <th className="px-4 py-3">Country & Flag</th>
                <th className="px-4 py-3">WhatsApp Click-to-Chat</th>
                <th className="px-4 py-3">Cadence Stage</th>
                <th className="px-4 py-3">Pipeline Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-zinc-100 text-sm">{lead.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {lead.company && (
                        <span className="text-zinc-400 text-xs">{lead.company}</span>
                      )}
                      {lead.niche && (
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400">
                          {lead.niche}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <CountryBadge country={lead} size="sm" showName={true} />
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
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Render Mode: Kanban by Cadence Stage */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {([0, 1, 2, 3, 4, 5] as CadenceStageNumber[]).map((stageNum) => {
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
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 shadow space-y-2 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-zinc-100 text-xs truncate max-w-[130px]">
                          {lead.name}
                        </span>
                        <span className="text-sm">{lead.flagEmoji}</span>
                      </div>
                      {lead.company && (
                        <p className="text-[11px] text-zinc-400 truncate">{lead.company}</p>
                      )}
                      {lead.niche && (
                        <div className="pt-0.5">
                          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400">
                            {lead.niche}
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

                      {lead.killSwitchStatus === 'active' && lead.currentStage < 5 && (
                        <button
                          type="button"
                          onClick={() => handleMessageSent(lead)}
                          title={`Click to mark message as sent and automatically advance lead to Follow-up ${lead.currentStage + 1}`}
                          className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1.5 px-2 transition-all active:scale-95 shadow-md shadow-emerald-950/40 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          <span>Message Sent → FU {lead.currentStage + 1}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
