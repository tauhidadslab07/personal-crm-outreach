'use client';

import React, { useState, useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { Niche, Lead } from '@/types/crm';
import { getTodayISO, isOverdue } from '@/lib/date-utils';
import {
  Layers,
  Plus,
  Search,
  Users,
  Zap,
  Calendar,
  ArrowRight,
  TrendingUp,
  Target,
  Trash2,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface NichesViewProps {
  onOpenNewNiche: () => void;
  onOpenNewLeadWithNiche: (nicheName: string) => void;
}

const COLOR_CLASSES: Record<string, { badge: string; border: string; bgGlow: string }> = {
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    border: 'hover:border-emerald-500/40',
    bgGlow: 'from-emerald-500/10 to-transparent',
  },
  cyan: {
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    border: 'hover:border-cyan-500/40',
    bgGlow: 'from-cyan-500/10 to-transparent',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    border: 'hover:border-amber-500/40',
    bgGlow: 'from-amber-500/10 to-transparent',
  },
  purple: {
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    border: 'hover:border-purple-500/40',
    bgGlow: 'from-purple-500/10 to-transparent',
  },
  rose: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    border: 'hover:border-rose-500/40',
    bgGlow: 'from-rose-500/10 to-transparent',
  },
  blue: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    border: 'hover:border-blue-500/40',
    bgGlow: 'from-blue-500/10 to-transparent',
  },
  orange: {
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    border: 'hover:border-orange-500/40',
    bgGlow: 'from-orange-500/10 to-transparent',
  },
};

export const NichesView: React.FC<NichesViewProps> = ({
  onOpenNewNiche,
  onOpenNewLeadWithNiche,
}) => {
  const niches = useCRMStore((s) => s.niches);
  const leads = useCRMStore((s) => s.leads);
  const stages = useCRMStore((s) => s.stages);
  const meetings = useCRMStore((s) => s.meetings);
  const projects = useCRMStore((s) => s.projects);
  const deleteNiche = useCRMStore((s) => s.deleteNiche);
  const setActiveTab = useCRMStore((s) => s.setActiveTab);
  const setSelectedNicheFilter = useCRMStore((s) => s.setSelectedNicheFilter);

  const [nicheSearch, setNicheSearch] = useState('');
  const today = getTodayISO();

  // Calculate statistics per Niche
  const nicheStats = useMemo(() => {
    const stats: Record<
      string,
      {
        totalLeads: number;
        dueToday: number;
        bookedMeetings: number;
        totalValue: number;
        closedWonValue: number;
        interestedCount: number;
      }
    > = {};

    niches.forEach((n) => {
      stats[n.name] = {
        totalLeads: 0,
        dueToday: 0,
        bookedMeetings: 0,
        totalValue: 0,
        closedWonValue: 0,
        interestedCount: 0,
      };
    });

    leads.forEach((lead) => {
      const nicheName = lead.niche || 'General';
      if (!stats[nicheName]) {
        stats[nicheName] = {
          totalLeads: 0,
          dueToday: 0,
          bookedMeetings: 0,
          totalValue: 0,
          closedWonValue: 0,
          interestedCount: 0,
        };
      }

      stats[nicheName].totalLeads += 1;
      stats[nicheName].totalValue += lead.value || 0;

      if (lead.responseStatus === 'interested') {
        stats[nicheName].interestedCount += 1;
      }

      if (lead.killSwitchStatus === 'booked_meeting') {
        stats[nicheName].bookedMeetings += 1;
      }
    });

    // Count pending stages due today for this lead's niche
    stages.forEach((stg) => {
      if (!stg.isSent && (stg.scheduledDate === today || isOverdue(stg.scheduledDate))) {
        const lead = leads.find((l) => l.id === stg.leadId);
        if (lead && lead.killSwitchStatus === 'active') {
          const nicheName = lead.niche || 'General';
          if (stats[nicheName]) {
            stats[nicheName].dueToday += 1;
          }
        }
      }
    });

    // Closed won values from meetings
    meetings.forEach((m) => {
      if (m.outcome === 'closed_won' && m.dealValue) {
        const lead = leads.find((l) => l.id === m.leadId);
        if (lead) {
          const nicheName = lead.niche || 'General';
          if (stats[nicheName]) {
            stats[nicheName].closedWonValue += m.dealValue;
          }
        }
      }
    });

    return stats;
  }, [niches, leads, stages, meetings, today]);

  // Filter niches by search
  const filteredNiches = useMemo(() => {
    if (!nicheSearch.trim()) return niches;
    const q = nicheSearch.toLowerCase();
    return niches.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.targetAudience?.toLowerCase().includes(q)
    );
  }, [niches, nicheSearch]);

  const handleFilterPipeline = (nicheName: string) => {
    setSelectedNicheFilter(nicheName);
    setActiveTab('leads');
  };

  const handleFilterTodaysWork = (nicheName: string) => {
    setSelectedNicheFilter(nicheName);
    setActiveTab('today');
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDeleteNiche = (niche: Niche) => {
    deleteNiche(niche.id);
    setToastMessage(`✓ Niche "${niche.name}" deleted and permanently saved.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Floating Real-time Success Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-400" />
            <span>Niche Hunting Command & Directory ({niches.length})</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Segment leads by industry, track response velocity, and run targeted outreach campaigns
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search niches..."
              value={nicheSearch}
              onChange={(e) => setNicheSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            onClick={onOpenNewNiche}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Create Niche</span>
          </button>
        </div>
      </div>

      {/* Niches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNiches.map((niche) => {
          const stats = nicheStats[niche.name] || {
            totalLeads: 0,
            dueToday: 0,
            bookedMeetings: 0,
            totalValue: 0,
            closedWonValue: 0,
            interestedCount: 0,
          };

          const colorCfg = COLOR_CLASSES[niche.color || 'emerald'] || COLOR_CLASSES.emerald;

          return (
            <div
              key={niche.id}
              className={`group relative flex flex-col justify-between rounded-3xl border border-zinc-800/90 bg-zinc-900/70 p-5 backdrop-blur-md shadow-lg transition-all hover:scale-[1.01] ${colorCfg.border}`}
            >
              <div>
                {/* Header: Niche Name & Badge */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${colorCfg.badge.split(' ')[0]}`} />
                      <h3 className="text-base font-bold text-zinc-100 tracking-tight group-hover:text-white transition-colors">
                        {niche.name}
                      </h3>
                    </div>
                    {niche.targetAudience && (
                      <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                        <Target className="h-3 w-3 text-zinc-500" />
                        <span>ICP: {niche.targetAudience}</span>
                      </div>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase shrink-0 ${colorCfg.badge}`}
                  >
                    {stats.totalLeads} {stats.totalLeads === 1 ? 'Lead' : 'Leads'}
                  </span>
                </div>

                {/* Description */}
                {niche.description && (
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                    {niche.description}
                  </p>
                )}

                {/* Key Metrics Mini Dashboard */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-800/80 mb-4 bg-zinc-950/40 rounded-2xl px-3">
                  {/* Outreach Due */}
                  <div className="text-center">
                    <span className="text-[10px] font-medium text-zinc-500 block">Due Today</span>
                    <span
                      className={`text-sm font-black ${
                        stats.dueToday > 0 ? 'text-amber-400' : 'text-zinc-400'
                      }`}
                    >
                      {stats.dueToday}
                    </span>
                  </div>

                  {/* Interested / Meetings */}
                  <div className="text-center border-x border-zinc-800">
                    <span className="text-[10px] font-medium text-zinc-500 block">Meetings</span>
                    <span
                      className={`text-sm font-black ${
                        stats.bookedMeetings > 0 ? 'text-cyan-400' : 'text-zinc-400'
                      }`}
                    >
                      {stats.bookedMeetings}
                    </span>
                  </div>

                  {/* Interested */}
                  <div className="text-center">
                    <span className="text-[10px] font-medium text-zinc-500 block">Interested</span>
                    <span
                      className={`text-sm font-black ${
                        stats.interestedCount > 0 ? 'text-emerald-400' : 'text-zinc-400'
                      }`}
                    >
                      {stats.interestedCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick-Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  {/* Today's Outreach */}
                  <button
                    onClick={() => handleFilterTodaysWork(niche.name)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-800/90 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Outreach</span>
                  </button>

                  {/* Filter Pipeline */}
                  <button
                    onClick={() => handleFilterPipeline(niche.name)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-800/90 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Pipeline</span>
                  </button>
                </div>

                {/* Add lead to this niche */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onOpenNewLeadWithNiche(niche.name)}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Lead to this Niche</span>
                  </button>

                  <button
                    onClick={() => handleDeleteNiche(niche)}
                    title={`Delete niche "${niche.name}"`}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
