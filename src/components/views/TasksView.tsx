'use client';

import React, { useState, useMemo } from 'react';
import { useCRMStore } from '@/lib/store';
import { Task, TaskPriority } from '@/types/crm';
import { getTodayISO, isOverdue } from '@/lib/date-utils';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  Filter,
  CheckCircle2,
  Tag,
  User,
  ListFilter,
  Search,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface TasksViewProps {
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenNewTask, onEditTask }) => {
  const tasks = useCRMStore((s) => s.tasks);
  const toggleTask = useCRMStore((s) => s.toggleTask);
  const deleteTask = useCRMStore((s) => s.deleteTask);
  const setActiveTab = useCRMStore((s) => s.setActiveTab);

  const [filterStatus, setFilterStatus] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const today = getTodayISO();

  // Stats
  const todayTasksCount = useMemo(
    () => tasks.filter((t) => !t.isCompleted && t.dueDate === today).length,
    [tasks, today]
  );

  const overdueTasksCount = useMemo(
    () => tasks.filter((t) => !t.isCompleted && isOverdue(t.dueDate) && t.dueDate !== today).length,
    [tasks, today]
  );

  const upcomingTasksCount = useMemo(
    () => tasks.filter((t) => !t.isCompleted && t.dueDate > today).length,
    [tasks, today]
  );

  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.isCompleted).length,
    [tasks]
  );

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Status filter
        if (filterStatus === 'today') {
          if (task.dueDate !== today || task.isCompleted) return false;
        } else if (filterStatus === 'overdue') {
          if (!isOverdue(task.dueDate) || task.dueDate === today || task.isCompleted) return false;
        } else if (filterStatus === 'upcoming') {
          if (task.dueDate <= today || task.isCompleted) return false;
        } else if (filterStatus === 'completed') {
          if (!task.isCompleted) return false;
        }

        // Priority filter
        if (filterPriority !== 'all' && task.priority !== filterPriority) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchClient = task.clientName?.toLowerCase().includes(q);
          const matchNotes = task.notes?.toLowerCase().includes(q);
          const matchCategory = task.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchClient && !matchNotes && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Active first, then by date, then by time
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
        if (a.dueTime) return -1;
        if (b.dueTime) return 1;
        return 0;
      });
  }, [tasks, filterStatus, filterPriority, searchQuery, today]);

  const formatDisplayTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getDateBadge = (dueDate: string, isCompleted: boolean) => {
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
          <Calendar className="h-3 w-3" />
          {dueDate}
        </span>
      );
    }

    if (dueDate === today) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/40 animate-pulse">
          <Calendar className="h-3 w-3" />
          Today (আজকে)
        </span>
      );
    }

    if (isOverdue(dueDate)) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-500/40">
          <AlertCircle className="h-3 w-3" />
          Overdue: {dueDate}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/30">
        <Calendar className="h-3 w-3" />
        {dueDate}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-400" />
              Task Manager &amp; Daily Schedule ({tasks.length})
            </h2>
            <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {todayTasksCount} Due Today
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Schedule tasks by date &amp; optional time. Tasks set for today automatically sync with{' '}
            <button
              onClick={() => setActiveTab('today')}
              className="text-emerald-400 hover:underline font-semibold inline-flex items-center gap-0.5"
            >
              Today&apos;s Work <ArrowRight className="h-3 w-3" />
            </button>
          </p>
        </div>

        <button
          onClick={onOpenNewTask}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          + Add New Task
        </button>
      </div>

      {/* KPI Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'today' ? 'all' : 'today')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'today'
              ? 'bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-500 shadow-md'
              : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Today&apos;s Tasks</span>
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <div className="text-2xl font-black text-zinc-100 mt-1">{todayTasksCount}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Visible in Today&apos;s Work</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'overdue' ? 'all' : 'overdue')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'overdue'
              ? 'bg-rose-950/50 border-rose-500/60 ring-1 ring-rose-500 shadow-md'
              : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Overdue Pending</span>
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1">{overdueTasksCount}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Requires attention</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'upcoming'
              ? 'bg-cyan-950/50 border-cyan-500/60 ring-1 ring-cyan-500 shadow-md'
              : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>Upcoming</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="text-2xl font-black text-cyan-200 mt-1">{upcomingTasksCount}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Future dates</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'completed' ? 'all' : 'completed')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'completed'
              ? 'bg-zinc-800/80 border-zinc-600 ring-1 ring-zinc-500 shadow-md'
              : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-black text-zinc-300 mt-1">{completedTasksCount}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Tasks finished</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tasks, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'all' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterStatus('today')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'today' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Today ({todayTasksCount})
            </button>
            <button
              onClick={() => setFilterStatus('upcoming')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'upcoming' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Upcoming ({upcomingTasksCount})
            </button>
            <button
              onClick={() => setFilterStatus('overdue')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'overdue' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overdue ({overdueTasksCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 space-y-3">
            <CheckSquare className="h-10 w-10 text-zinc-600 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-zinc-300">No tasks found</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Stay organized by adding your first daily outreach or operational task.'}
            </p>
            <button
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const displayTime = formatDisplayTime(task.dueTime);
            return (
              <div
                key={task.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all gap-3 ${
                  task.isCompleted
                    ? 'border-zinc-800/50 bg-zinc-950/40 opacity-60'
                    : task.dueDate === today
                    ? 'border-emerald-500/40 bg-zinc-900/80 shadow-sm hover:border-emerald-500/70'
                    : isOverdue(task.dueDate)
                    ? 'border-rose-500/40 bg-zinc-900/80 shadow-sm hover:border-rose-500/70'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                {/* Checkbox and Title */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="mt-0.5 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    title={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {task.isCompleted ? (
                      <CheckSquare className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Square className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        onClick={() => toggleTask(task.id)}
                        className={`text-sm font-semibold cursor-pointer select-none transition-all ${
                          task.isCompleted
                            ? 'line-through text-zinc-500'
                            : 'text-zinc-100 hover:text-emerald-300'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Priority Tag */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {task.priority}
                      </span>

                      {/* Category Tag */}
                      {task.category && (
                        <span className="text-[10px] font-sans text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-700/60">
                          {task.category}
                        </span>
                      )}
                    </div>

                    {/* Metadata line: Date, Time, Linked Client */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                      {getDateBadge(task.dueDate, task.isCompleted)}

                      {/* Optional Time Badge */}
                      {displayTime && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          {displayTime}
                        </span>
                      )}

                      {/* Linked Client */}
                      {task.clientName && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <User className="h-3 w-3 text-zinc-500" />
                          <span className="text-zinc-300 font-medium">{task.clientName}</span>
                        </span>
                      )}

                      {/* Notes snippet */}
                      {task.notes && (
                        <span className="text-[11px] text-zinc-500 italic truncate max-w-xs">
                          &quot;{task.notes}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    title="Edit task"
                    className="p-1.5 text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete task "${task.title}"?`)) {
                        deleteTask(task.id);
                      }
                    }}
                    title="Delete task"
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
