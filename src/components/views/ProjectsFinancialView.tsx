'use client';

import React, { useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { Project, ProjectStatus } from '@/types/crm';
import { getTodayISO, getDaysDifferenceFromToday, isOverdue } from '@/lib/date-utils';
import {
  FolderKanban,
  DollarSign,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface ProjectsFinancialViewProps {
  onOpenNewProject: () => void;
  onEditProject: (project: Project) => void;
  onOpenNewTask: () => void;
}

export const ProjectsFinancialView: React.FC<ProjectsFinancialViewProps> = ({
  onOpenNewProject,
  onEditProject,
  onOpenNewTask,
}) => {
  const projects = useCRMStore((s) => s.projects);
  const tasks = useCRMStore((s) => s.tasks);
  const deleteProject = useCRMStore((s) => s.deleteProject);
  const toggleTask = useCRMStore((s) => s.toggleTask);
  const deleteTask = useCRMStore((s) => s.deleteTask);

  const today = getTodayISO();

  // Financial aggregates
  const financials = useMemo(() => {
    let totalValue = 0;
    let cashCollected = 0;
    let pendingBalance = 0;

    projects.forEach((p) => {
      totalValue += p.totalOrderValue;
      cashCollected += p.paidAmount;
      pendingBalance += p.remainingBalance;
    });

    return { totalValue, cashCollected, pendingBalance };
  }, [projects]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-amber-400" />
            Client Projects & Financial Operations
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deliverable tracking, contract values, upfront deposits, and outstanding receivables
          </p>
        </div>

        <button
          onClick={onOpenNewProject}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-amber-500 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Client Project
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg backdrop-blur space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Total Contract Value</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-zinc-100">
            ${financials.totalValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500">Across {projects.length} client accounts</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 shadow-lg backdrop-blur space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
            <span>Realized Cash Collected</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            ${financials.cashCollected.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400/70">
            {financials.totalValue > 0
              ? `${Math.round((financials.cashCollected / financials.totalValue) * 100)}% realization rate`
              : '0% realization'}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 shadow-lg backdrop-blur space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
            <span>Pending Balance / Receivables</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">
            ${financials.pendingBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-400/70">Awaiting milestone completion & final sign-off</p>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
          Active Client Deliverables ({projects.length})
        </h3>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <p className="text-xs text-zinc-500">No active client projects registered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => {
              const diffDays = getDaysDifferenceFromToday(proj.deliveryDeadline);
              const isLate = diffDays < 0;

              return (
                <div
                  key={proj.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg space-y-3 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-zinc-100 text-sm truncate">
                        {proj.projectName}
                      </h4>
                      <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                        Client: {proj.clientName}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                        proj.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : proj.status === 'delivered'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : proj.status === 'revision'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Financial Bar */}
                  <div className="rounded-xl bg-zinc-950 p-3 space-y-2 border border-zinc-800/80">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">
                        Paid: <strong className="text-emerald-400">${proj.paidAmount.toLocaleString()}</strong>
                      </span>
                      <span className="text-zinc-400">
                        Total: <strong className="text-zinc-200">${proj.totalOrderValue.toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${proj.totalOrderValue > 0 ? Math.min(100, (proj.paidAmount / proj.totalOrderValue) * 100) : 0}%`,
                        }}
                      />
                    </div>

                    {proj.remainingBalance > 0 && (
                      <div className="flex justify-between text-[11px] text-amber-400/90 pt-1">
                        <span>Balance Due:</span>
                        <span className="font-mono font-bold">${proj.remainingBalance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Deadlines & Notes */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      Deadline: {proj.deliveryDeadline}
                    </span>

                    {isLate && proj.status !== 'completed' ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {Math.abs(diffDays)}d overdue
                      </span>
                    ) : (
                      <span className="text-zinc-500">
                        {diffDays === 0 ? 'Due Today' : `In ${diffDays} days`}
                      </span>
                    )}
                  </div>

                  {proj.notes && (
                    <p className="text-xs text-zinc-400 italic line-clamp-1">{proj.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button
                      onClick={() => onEditProject(proj)}
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="rounded-lg text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 p-1.5 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
