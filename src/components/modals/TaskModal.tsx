'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Task, TaskPriority } from '@/types/crm';
import { useCRMStore } from '@/lib/store';
import { getTodayISO } from '@/lib/date-utils';
import { CheckSquare, ShieldAlert, Clock, Calendar, Tag, User, AlignLeft } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTask?: Task;
  defaultDueDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  existingTask,
  defaultDueDate,
}) => {
  const addTask = useCRMStore((s) => s.addTask);
  const updateTask = useCRMStore((s) => s.updateTask);
  const tasks = useCRMStore((s) => s.tasks);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('Outreach');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title || '');
      setDueDate(existingTask.dueDate || getTodayISO());
      setDueTime(existingTask.dueTime || '');
      setPriority(existingTask.priority || 'medium');
      setCategory(existingTask.category || 'Outreach');
      setClientName(existingTask.clientName || '');
      setNotes(existingTask.notes || '');
    } else {
      setTitle('');
      setDueDate(defaultDueDate || getTodayISO());
      setDueTime('');
      setPriority('medium');
      setCategory('Outreach');
      setClientName('');
      setNotes('');
    }
  }, [existingTask, defaultDueDate, isOpen]);

  // Check duplicate active task for same date
  const isDuplicateTask = React.useMemo(() => {
    const cleanTitle = title.trim().toLowerCase();
    if (!cleanTitle) return false;
    return tasks.some(
      (t) =>
        t.id !== existingTask?.id &&
        !t.isCompleted &&
        t.dueDate === dueDate &&
        t.title.trim().toLowerCase() === cleanTitle
    );
  }, [title, dueDate, tasks, existingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (existingTask) {
      updateTask(existingTask.id, {
        title: title.trim(),
        dueDate,
        dueTime: dueTime.trim() || undefined,
        priority,
        category: category.trim() || undefined,
        clientName: clientName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addTask({
        title: title.trim(),
        dueDate,
        dueTime: dueTime.trim() || undefined,
        priority,
        category: category.trim() || undefined,
        isCompleted: false,
        clientName: clientName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingTask ? 'Edit Scheduled Task' : 'Create Daily Operational Task'}
      subtitle={
        existingTask
          ? 'Update the date, optional time, and priority of this task'
          : 'Schedule tasks by date & optional time to track in Today’s Work'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Task Name / Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Audit WhatsApp funnel / Follow up with Agency"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full rounded-xl border bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all ${
              isDuplicateTask
                ? 'border-amber-500/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                : 'border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            }`}
          />
          {isDuplicateTask && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs text-amber-300 animate-in fade-in">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                ⚠️ <strong>Duplicate Task:</strong> An active task with this exact title already exists for this due date.
              </span>
            </div>
          )}
        </div>

        {/* Date & Time (Time is Non-Mandatory) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              Date (তারিখ) <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              যেই তারিখ সিলেক্ট করবেন, সেদিন এটি <strong>Today’s Work</strong>-এ দেখাবে।
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              Time (সময় - Optional)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              বাধ্যতামূলক নয়; নির্দিষ্ট সময়ে করার থাকলে দিতে পারেন।
            </p>
          </div>
        </div>

        {/* Priority & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Priority (অগ্রাধিকার)
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority (Urgent)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-zinc-400" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Outreach">Outreach & WhatsApp</option>
              <option value="Follow-up">Client Follow-up</option>
              <option value="Meeting">Meeting Preparation</option>
              <option value="Delivery">Client Project Delivery</option>
              <option value="General">General Operational Task</option>
            </select>
          </div>
        </div>

        {/* Linked Client / Prospect */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-zinc-400" />
            Linked Client or Agency (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Shellsoft Technologies or Creative Tech Park"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <AlignLeft className="h-3.5 w-3.5 text-zinc-400" />
            Notes / Instructions (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Specific notes or reminders for this task..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer"
          >
            <CheckSquare className="h-4 w-4" />
            {existingTask ? 'Save Changes' : 'Schedule Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
