'use client';

import React from 'react';
import { useCRMStore } from '@/lib/store';
import { getTodayISO, isOverdue } from '@/lib/date-utils';
import { Zap, Users, Calendar, FolderKanban, BarChart3, Layers } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const activeTab = useCRMStore((s) => s.activeTab);
  const setActiveTab = useCRMStore((s) => s.setActiveTab);
  const stages = useCRMStore((s) => s.stages);
  const meetings = useCRMStore((s) => s.meetings);

  const today = getTodayISO();
  const pendingOutreachCount = stages.filter(
    (s) => !s.isSent && (s.scheduledDate === today || isOverdue(s.scheduledDate))
  ).length;

  const todayMeetingsCount = meetings.filter(
    (m) => m.meetingDate === today && m.outcome === 'pending'
  ).length;

  const navItems = [
    {
      id: 'today',
      label: 'Today',
      icon: Zap,
      badge: pendingOutreachCount,
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
    },
    {
      id: 'niches',
      label: 'Niches',
      icon: Layers,
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: Calendar,
      badge: todayMeetingsCount,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg px-1 sm:px-2 pt-1 pb-2 sm:pb-1 shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1.5 xs:px-2.5 sm:px-3 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
