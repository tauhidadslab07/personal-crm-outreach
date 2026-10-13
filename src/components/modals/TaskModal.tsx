'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Task, TaskPriority } from '@/types/crm';
import { useCRMStore } from '@/lib/store';
import { getTodayISO } from '@/lib/date-utils';
import { CheckSquare } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose }) => {
  const addTask = useCRMStore((s) => s.addTask);
  const leads = useCRMStore((s) => s.leads);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [clientName, setClientName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      dueDate,
      priority,
      isCompleted: false,
      clientName: clientName.trim() || undefined,
    });

    setTitle('');
    setClientName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Daily Operational Task"
      subtitle="Keep your client hunting and delivery tasks synchronized"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Task Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Audit WhatsApp funnel for Apex Tech"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Linked Client (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Elena Rostova or Sarah Jenkins"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-95"
          >
            <CheckSquare className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
