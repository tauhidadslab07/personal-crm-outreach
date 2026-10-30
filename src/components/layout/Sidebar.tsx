'use client';

import React from 'react';
import { useCRMStore } from '@/lib/store';
import { getTodayISO, isOverdue } from '@/lib/date-utils';
import {
  Zap,
  Users,
  Calendar,
  FolderKanban,
  BarChart3,
  FileCode,
  ShieldCheck,
  Flame,
  Layers,
  UserCog,
  Database,
  CheckSquare,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface SidebarProps {
  onOpenTemplates: () => void;
  onOpenBackup?: () => void;
  onOpenUserManagement?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenTemplates, onOpenBackup, onOpenUserManagement }) => {
  const activeTab = useCRMStore((s) => s.activeTab);
  const setActiveTab = useCRMStore((s) => s.setActiveTab);
  const stages = useCRMStore((s) => s.stages);
  const leads = useCRMStore((s) => s.leads);
  const meetings = useCRMStore((s) => s.meetings);
  const projects = useCRMStore((s) => s.projects);
  const niches = useCRMStore((s) => s.niches);
  const tasks = useCRMStore((s) => s.tasks);
  const currentUser = useAuthStore((s) => s.currentUser);

  const today = getTodayISO();

  // Due today + Overdue unsent stages count (only Stage 0 if isQueuedForToday, plus active Follow-ups 1-5 on due dates)
  const leadMap = new Map(leads.map((l) => [l.id, l]));
  const pendingOutreachCount = stages.filter((s) => {
    if (s.isSent || !s.scheduledDate) return false;
    const isDue = s.scheduledDate === today || isOverdue(s.scheduledDate);
    if (!isDue) return false;
    const lead = leadMap.get(s.leadId);
    if (!lead || lead.killSwitchStatus !== 'active') return false;
    if (s.stageNumber === 0) return lead.isQueuedForToday === true;
    return true;
  }).length;

  const todayMeetingsCount = meetings.filter(
    (m) => m.meetingDate === today && m.outcome === 'pending'
  ).length;

  const activeProjectsCount = projects.filter(
    (p) => p.status === 'in_progress' || p.status === 'revision'
  ).length;

  const activeTasksCount = tasks.filter(
    (t) => !t.isCompleted && (t.dueDate === today || isOverdue(t.dueDate))
  ).length;

  const navItems = [
    {
      id: 'today',
      label: "Today's Work",
      shortcut: '1',
      icon: Zap,
      badge: pendingOutreachCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'leads',
      label: 'Leads',
      shortcut: '2',
      icon: Users,
      badge: leads.length,
      badgeColor: 'bg-zinc-800 text-zinc-400',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      shortcut: 'T',
      icon: CheckSquare,
      badge: activeTasksCount > 0 ? activeTasksCount : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'niches',
      label: 'Niches',
      shortcut: 'N',
      icon: Layers,
      badge: niches.length,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    {
      id: 'meetings',
      label: 'Intelligent Meetings',
      shortcut: '3',
      icon: Calendar,
      badge: todayMeetingsCount > 0 ? todayMeetingsCount : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    },
    {
      id: 'projects',
      label: 'Projects & Delivery',
      shortcut: '4',
      icon: FolderKanban,
      badge: activeProjectsCount > 0 ? activeProjectsCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'analytics',
      label: 'Performance Analytics',
      shortcut: '5',
      icon: BarChart3,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800 bg-zinc-950/60 p-4 justify-between select-none">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Workspaces
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <kbd className="rounded bg-zinc-900 px-1 py-0.5 text-[9px] font-mono text-zinc-500 border border-zinc-800">
                    {item.shortcut}
                  </kbd>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Tools */}
        <div className="space-y-1 pt-2 border-t border-zinc-900">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Operations
          </div>
          <button
            onClick={onOpenTemplates}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-colors"
          >
            <FileCode className="h-4 w-4 text-teal-400" />
            <span>Cadence Scripts</span>
          </button>

          {onOpenBackup && (
            <button
              onClick={onOpenBackup}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-colors cursor-pointer"
            >
              <Database className="h-4 w-4 text-amber-400" />
              <span>Backup & Restore</span>
            </button>
          )}

          {currentUser?.role === 'admin' && onOpenUserManagement && (
            <button
              onClick={onOpenUserManagement}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/10 border border-rose-500/20 transition-all mt-1"
            >
              <div className="flex items-center gap-2.5">
                <UserCog className="h-4 w-4 text-rose-400" />
                <span>Team & Access</span>
              </div>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold uppercase">
                Admin
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Info Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-zinc-200">Zero-Friction Engine</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Universal WhatsApp deep links with 5-stage automated follow-up cadences and buffer protection.
        </p>
      </div>
    </aside>
  );
};
