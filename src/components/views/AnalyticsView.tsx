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
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Globe,
  Award,
  Layers,
  Users,
  Eye,
  MessageSquare,
  Clock,
  XCircle,
  Sparkles,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const leads = useCRMStore((s) => s.leads);
  const stages = useCRMStore((s) => s.stages);
  const meetings = useCRMStore((s) => s.meetings);
  const projects = useCRMStore((s) => s.projects);

  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');

  // Niche attribution
  const nicheData = useMemo(() => {
    const map = new Map<string, { niche: string; count: number }>();
    leads.forEach((l) => {
      const n = l.niche || 'General';
      const existing = map.get(n) || { niche: n, count: 0 };
      existing.count += 1;
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
    const map = new Map<string, { country: string; flag: string; count: number }>();
    leads.forEach((l) => {
      const existing = map.get(l.isoCode) || {
        country: l.countryName,
        flag: l.flagEmoji,
        count: 0,
      };
      existing.count += 1;
      map.set(l.isoCode, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [leads]);

  // Financial aggregates from projects
  const financials = useMemo(() => {
    const realizedCash = projects.reduce((sum, p) => sum + p.paidAmount, 0);
    const pendingBalance = projects.reduce((sum, p) => sum + p.remainingBalance, 0);
    return { realizedCash, pendingBalance };
  }, [projects]);

  // Stage Engagement Analytics (Seen / Unseen / Replied / Rejected)
  const stageEngagementData = useMemo(() => {
    const stageMeta = [
      { num: 0, title: 'Initial Outreach', short: 'Initial' },
      { num: 1, title: 'Follow-up 1', short: 'FU 1' },
      { num: 2, title: 'Follow-up 2', short: 'FU 2' },
      { num: 3, title: 'Follow-up 3', short: 'FU 3' },
      { num: 4, title: 'Follow-up 4', short: 'FU 4' },
      { num: 5, title: 'FU 5 (Breakup)', short: 'FU 5' },
    ];

    const results = stageMeta.map(({ num, title, short }) => {
      const relevant = stages.filter((s) => s.stageNumber === num && s.isSent);
      const totalSent = relevant.length;

      let replied = 0;
      let seen = 0;
      let rejected = 0;
      let unseen = 0;

      relevant.forEach((s) => {
        if (s.viewStatus === 'replied') replied++;
        else if (s.viewStatus === 'seen') seen++;
        else if (s.viewStatus === 'rejected') rejected++;
        else unseen++; // 'unseen' or 'unchecked'
      });

      const replyRate = totalSent > 0 ? Math.round((replied / totalSent) * 100) : 0;
      const seenRate = totalSent > 0 ? Math.round((seen / totalSent) * 100) : 0;
      const rejectRate = totalSent > 0 ? Math.round((rejected / totalSent) * 100) : 0;
      const unseenRate = totalSent > 0 ? Math.round((unseen / totalSent) * 100) : 0;

      return {
        stageNumber: num,
        title,
        shortName: short,
        totalSent,
        replied,
        seen,
        rejected,
        unseen,
        replyRate,
        seenRate,
        rejectRate,
        unseenRate,
      };
    });

    const totalSentAll = results.reduce((sum, r) => sum + r.totalSent, 0);
    const totalRepliedAll = results.reduce((sum, r) => sum + r.replied, 0);
    const totalSeenAll = results.reduce((sum, r) => sum + r.seen, 0);
    const totalRejectedAll = results.reduce((sum, r) => sum + r.rejected, 0);
    const totalUnseenAll = results.reduce((sum, r) => sum + r.unseen, 0);

    const overallReplyRate =
      totalSentAll > 0 ? Math.round((totalRepliedAll / totalSentAll) * 100) : 0;
    const overallSeenRate =
      totalSentAll > 0 ? Math.round((totalSeenAll / totalSentAll) * 100) : 0;
    const overallRejectRate =
      totalSentAll > 0 ? Math.round((totalRejectedAll / totalSentAll) * 100) : 0;

    const withActivity = results.filter((r) => r.totalSent > 0);
    const peakReplyStage =
      withActivity.length > 0
        ? withActivity.reduce(
            (prev, curr) => (curr.replyRate > prev.replyRate ? curr : prev),
            withActivity[0]
          )
        : null;

    const peakRejectStage =
      withActivity.length > 0
        ? withActivity.reduce(
            (prev, curr) => (curr.rejectRate > prev.rejectRate ? curr : prev),
            withActivity[0]
          )
        : null;

    return {
      stages: results,
      totalSentAll,
      totalRepliedAll,
      totalSeenAll,
      totalRejectedAll,
      totalUnseenAll,
      overallReplyRate,
      overallSeenRate,
      overallRejectRate,
      peakReplyStage,
      peakRejectStage,
    };
  }, [stages]);

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

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Active Leads</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-zinc-100 mt-1">
            {leads.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">All registered prospects</p>
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

      {/* 3. Stage-by-Stage Message Engagement & Knock vs Rejection Analytics */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Stage-by-Stage Knock, Seen & Rejection Intelligence
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Identify exactly which cadence stage delivers replies/knocks and where prospects decline or stay unopened
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-xs">
              <span className="text-emerald-400 font-bold">💬 {stageEngagementData.overallReplyRate}%</span>
              <span className="text-zinc-400">Knock/Reply</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 text-xs">
              <span className="text-cyan-400 font-bold">👁️ {stageEngagementData.overallSeenRate}%</span>
              <span className="text-zinc-400">Open/Seen</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs">
              <span className="text-rose-400 font-bold">❌ {stageEngagementData.overallRejectRate}%</span>
              <span className="text-zinc-400">Rejection</span>
            </div>
          </div>
        </div>

        {/* Stacked Bar Chart for Stage Engagement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Message Volume Breakdown by Stage</span>
            <span className="font-mono">Total Sent: {stageEngagementData.totalSentAll}</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stageEngagementData.stages}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              >
                <XAxis dataKey="shortName" stroke="#71717A" fontSize={11} />
                <YAxis stroke="#71717A" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '12px',
                    color: '#F4F4F5',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Bar dataKey="replied" name="💬 Replied / Knock" stackId="a" fill="#10B981" />
                <Bar dataKey="seen" name="👁️ Seen" stackId="a" fill="#06B6D4" />
                <Bar dataKey="unseen" name="⏳ Unseen" stackId="a" fill="#64748B" />
                <Bar dataKey="rejected" name="❌ Rejected" stackId="a" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/50">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Cadence Stage</th>
                <th className="px-4 py-3 text-center">Total Sent</th>
                <th className="px-4 py-3 text-center text-emerald-400">💬 Knocks (Replied)</th>
                <th className="px-4 py-3 text-center text-cyan-400">👁️ Seen</th>
                <th className="px-4 py-3 text-center text-zinc-400">⏳ Unseen</th>
                <th className="px-4 py-3 text-center text-rose-400">❌ Rejected</th>
                <th className="px-4 py-3 text-right">Cadence Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {stageEngagementData.stages.map((stg) => {
                const isPeakKnock = stageEngagementData.peakReplyStage?.stageNumber === stg.stageNumber && stg.replied > 0;
                const isPeakReject = stageEngagementData.peakRejectStage?.stageNumber === stg.stageNumber && stg.rejected > 0;
                const isHighUnseen = stg.unseenRate >= 50 && stg.totalSent > 0;

                return (
                  <tr key={stg.stageNumber} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-sans font-bold text-zinc-200">
                      {stg.title}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-zinc-300">
                      {stg.totalSent}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">
                      {stg.replied} <span className="text-[10px] text-emerald-500/80 font-normal">({stg.replyRate}%)</span>
                    </td>
                    <td className="px-4 py-3 text-center text-cyan-400 font-semibold">
                      {stg.seen} <span className="text-[10px] text-cyan-500/80 font-normal">({stg.seenRate}%)</span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-400">
                      {stg.unseen} <span className="text-[10px] text-zinc-500 font-normal">({stg.unseenRate}%)</span>
                    </td>
                    <td className="px-4 py-3 text-center text-rose-400 font-bold">
                      {stg.rejected} <span className="text-[10px] text-rose-500/80 font-normal">({stg.rejectRate}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      {isPeakKnock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          🏆 Peak Knock Stage
                        </span>
                      ) : isPeakReject ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                          ⚠️ Rejection Hotspot
                        </span>
                      ) : isHighUnseen ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                          💤 Low Read Rate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          Progressing
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Executive Decision Intelligence Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Knock Recommendation */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Highest Knock Potential</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {stageEngagementData.peakReplyStage && stageEngagementData.peakReplyStage.replied > 0 ? (
                <>
                  Prospects reply best on{' '}
                  <span className="font-bold text-emerald-300">
                    {stageEngagementData.peakReplyStage.title}
                  </span>{' '}
                  ({stageEngagementData.peakReplyStage.replyRate}% reply rate). Ensure your booking links are active during this stage.
                </>
              ) : (
                'Send outreach messages and log client responses to reveal peak knock stages.'
              )}
            </p>
          </div>

          {/* Rejection Hotspot Alert */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              <span>Rejection Bottleneck Watch</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {stageEngagementData.peakRejectStage && stageEngagementData.peakRejectStage.rejected > 0 ? (
                <>
                  Highest rejections occur at{' '}
                  <span className="font-bold text-rose-300">
                    {stageEngagementData.peakRejectStage.title}
                  </span>{' '}
                  ({stageEngagementData.peakRejectStage.rejectRate}% rejections). Consider softening your ask or testing a case study angle.
                </>
              ) : (
                'Zero severe rejection hotspots detected. Keep your cadence messages concise and relevant.'
              )}
            </p>
          </div>

          {/* Read vs Unread Optimization */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Eye className="h-4 w-4 text-cyan-400" />
              <span>Seen-to-Reply Conversion</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {stageEngagementData.overallSeenRate > 0 ? (
                <>
                  <span className="font-bold text-cyan-300">{stageEngagementData.overallSeenRate}%</span> of all messages are read by prospects. Focus on strong opening hooks to convert reads into replies.
                </>
              ) : (
                'Log Seen & Replied statuses on each lead card to calculate your open-to-reply velocity.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Niche & Country Geographic Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  <span className="text-emerald-400 font-bold">{n.count} leads</span>
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
                  <span className="text-cyan-400 font-bold">{c.count} leads</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
