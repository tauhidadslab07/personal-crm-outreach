'use client';

import React, { useState, useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { AnalyticsTimeRange } from '@/types/crm';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Globe,
  PieChart as PieIcon,
  DollarSign,
  Award,
  Layers,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const leads = useCRMStore((s) => s.leads);
  const stages = useCRMStore((s) => s.stages);
  const meetings = useCRMStore((s) => s.meetings);
  const projects = useCRMStore((s) => s.projects);

  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');

  // Niche attribution
  const nicheData = useMemo(() => {
    const map = new Map<string, { niche: string; count: number; totalValue: number }>();
    leads.forEach((l) => {
      const n = l.niche || 'General';
      const existing = map.get(n) || { niche: n, count: 0, totalValue: 0 };
      existing.count += 1;
      existing.totalValue += l.value || 0;
      map.set(n, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [leads]);

  // Funnel calculations
  const funnelData = useMemo(() => {
    const totalLeads = leads.length;
    const initialSent = stages.filter((s) => s.stageNumber === 0 && s.isSent).length;
    const fu1Sent = stages.filter((s) => s.stageNumber === 1 && s.isSent).length;
    const fu2Sent = stages.filter((s) => s.stageNumber === 2 && s.isSent).length;
    const fu3Sent = stages.filter((s) => s.stageNumber === 3 && s.isSent).length;
    const fu4Sent = stages.filter((s) => s.stageNumber === 4 && s.isSent).length;
    const fu5Sent = stages.filter((s) => s.stageNumber === 5 && s.isSent).length;
    const totalMeetings = meetings.length;
    const closedWon = meetings.filter((m) => m.outcome === 'closed_won').length;

    return [
      { step: 'Total Leads', count: totalLeads, fill: '#64748B' },
      { step: 'Initial Sent', count: initialSent, fill: '#0EA5E9' },
      { step: 'Follow-up 1', count: fu1Sent, fill: '#0284C7' },
      { step: 'Follow-up 2', count: fu2Sent, fill: '#2563EB' },
      { step: 'Follow-up 3', count: fu3Sent, fill: '#4F46E5' },
      { step: 'Follow-up 4', count: fu4Sent, fill: '#7C3AED' },
      { step: 'FU 5 (Breakup)', count: fu5Sent, fill: '#9333EA' },
      { step: 'Meetings Booked', count: totalMeetings, fill: '#14B8A6' },
      { step: 'Closed Won Deals', count: closedWon, fill: '#10B981' },
    ];
  }, [leads, stages, meetings]);

  // Stage-by-Stage Drop-off Analysis
  const dropOffAnalysis = useMemo(() => {
    const steps = funnelData;
    const results = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const from = steps[i];
      const to = steps[i + 1];
      const dropOffCount = Math.max(0, from.count - to.count);
      const conversionRate = from.count > 0 ? Math.round((to.count / from.count) * 100) : 0;
      const dropOffRate = 100 - conversionRate;

      results.push({
        transition: `${from.step} → ${to.step}`,
        fromCount: from.count,
        toCount: to.count,
        conversionRate,
        dropOffRate,
      });
    }
    return results;
  }, [funnelData]);

  // Country Attribution
  const countryData = useMemo(() => {
    const map = new Map<string, { country: string; flag: string; count: number; totalValue: number }>();
    leads.forEach((l) => {
      const existing = map.get(l.isoCode) || {
        country: l.countryName,
        flag: l.flagEmoji,
        count: 0,
        totalValue: 0,
      };
      existing.count += 1;
      existing.totalValue += l.value || 0;
      map.set(l.isoCode, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [leads]);

  // Lead Source Attribution
  const sourceData = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      map.set(l.source, (map.get(l.source) || 0) + 1);
    });
    const colors = ['#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];
    return Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      fill: colors[idx % colors.length],
    }));
  }, [leads]);

  // Financial aggregates
  const financials = useMemo(() => {
    const totalPipelineValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
    const realizedCash = projects.reduce((sum, p) => sum + p.paidAmount, 0);
    const pendingBalance = projects.reduce((sum, p) => sum + p.remainingBalance, 0);
    return { totalPipelineValue, realizedCash, pendingBalance };
  }, [leads, projects]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Performance & Conversion Funnel Analytics
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Stage drop-off pinpointing, country attribution, and pipeline velocity metrics
          </p>
        </div>

        {/* Time range pills */}
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {(['7d', '15d', '30d', 'all'] as AnalyticsTimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase transition-all ${
                timeRange === r
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {r === 'all' ? 'All Time' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg backdrop-blur">
          <span className="text-xs font-semibold text-zinc-400">Total Pipeline Deal Value</span>
          <div className="text-2xl font-mono font-bold text-zinc-100 mt-1">
            ${financials.totalPipelineValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Estimated revenue potential</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 shadow-lg backdrop-blur">
          <span className="text-xs font-semibold text-emerald-300">Realized Cash Collected</span>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            ${financials.realizedCash.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">Banked client payments</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 shadow-lg backdrop-blur">
          <span className="text-xs font-semibold text-amber-300">Pending Milestone Balance</span>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            ${financials.pendingBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-400/70 mt-0.5">Outstanding contract receivables</p>
        </div>
      </div>

      {/* 1. Conversion Funnel Chart (Recharts) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Outreach Cadence Conversion Funnel
          </h3>
          <span className="text-xs text-zinc-400 font-mono">Stage 0 → Closed Won Deal</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 90, bottom: 5 }}
            >
              <XAxis type="number" stroke="#71717A" fontSize={11} />
              <YAxis
                type="category"
                dataKey="step"
                stroke="#A1A1AA"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181B',
                  borderColor: '#27272A',
                  borderRadius: '12px',
                  color: '#F4F4F5',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Stage-by-Stage Drop-off Analysis */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              Stage-by-Stage Drop-Off Bottleneck Analysis
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pinpoints which follow-up transition loses the highest volume of prospects
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {dropOffAnalysis.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2"
            >
              <div className="text-xs font-bold text-zinc-200 truncate">
                {item.transition}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Conversion Rate:</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {item.conversionRate}%
                </span>
              </div>

              {/* Progress bar showing retention */}
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${item.conversionRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-rose-400/90 pt-1 border-t border-zinc-900">
                <span>Drop-off Loss:</span>
                <span className="font-mono font-bold">-{item.dropOffRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Niche, Country & Lead Source Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Niche Breakdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              Niche Industry Breakdown
            </h3>
            <span className="text-xs text-zinc-400">{nicheData.length} niches</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {nicheData.map((n) => (
              <div
                key={n.niche}
                className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs"
              >
                <span className="font-semibold text-zinc-100">{n.niche}</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-zinc-400">{n.count} leads</span>
                  <span className="text-emerald-400 font-bold">
                    ${n.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Country Breakdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              Country & Geographic Attribution
            </h3>
            <span className="text-xs text-zinc-400">{countryData.length} countries</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {countryData.map((c) => (
              <div
                key={c.country}
                className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">{c.flag}</span>
                  <span className="font-semibold text-zinc-100">{c.country}</span>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-zinc-400">{c.count} leads</span>
                  <span className="text-emerald-400 font-bold">
                    ${c.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Source Attribution */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-teal-400" />
              Lead Acquisition Channels
            </h3>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '12px',
                    color: '#F4F4F5',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
