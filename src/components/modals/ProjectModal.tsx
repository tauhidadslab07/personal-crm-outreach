'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Project, ProjectStatus } from '@/types/crm';
import { useCRMStore } from '@/lib/store';
import { getTodayISO, addDays } from '@/lib/date-utils';
import { FolderKanban, DollarSign, Calendar } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProject?: Project;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  existingProject,
}) => {
  const addProject = useCRMStore((s) => s.addProject);
  const updateProject = useCRMStore((s) => s.updateProject);
  const leads = useCRMStore((s) => s.leads);

  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState(getTodayISO());
  const [deliveryDeadline, setDeliveryDeadline] = useState(addDays(getTodayISO(), 14));
  const [totalOrderValue, setTotalOrderValue] = useState('5000');
  const [paidAmount, setPaidAmount] = useState('2500');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingProject) {
      setClientName(existingProject.clientName);
      setProjectName(existingProject.projectName);
      setAcquisitionDate(existingProject.acquisitionDate);
      setDeliveryDeadline(existingProject.deliveryDeadline);
      setTotalOrderValue(String(existingProject.totalOrderValue));
      setPaidAmount(String(existingProject.paidAmount));
      setStatus(existingProject.status);
      setNotes(existingProject.notes || '');
    } else {
      setClientName('');
      setProjectName('');
      setAcquisitionDate(getTodayISO());
      setDeliveryDeadline(addDays(getTodayISO(), 14));
      setTotalOrderValue('5000');
      setPaidAmount('2500');
      setStatus('in_progress');
      setNotes('');
    }
  }, [isOpen, existingProject]);

  const totalNum = parseFloat(totalOrderValue) || 0;
  const paidNum = parseFloat(paidAmount) || 0;
  const remainingNum = Math.max(0, totalNum - paidNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !projectName.trim()) return;

    const payload = {
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      acquisitionDate,
      deliveryDeadline,
      totalOrderValue: totalNum,
      paidAmount: paidNum,
      remainingBalance: remainingNum,
      status,
      notes: notes.trim() || undefined,
    };

    if (existingProject) {
      updateProject(existingProject.id, payload);
    } else {
      addProject(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingProject ? 'Edit Client Project' : 'New Client Project'}
      subtitle="Track project deliverables, cash collected, and outstanding balances"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Client / Account <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Tech Solutions"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Outreach Pipeline Architecture"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Acquisition Date
            </label>
            <input
              type="date"
              value={acquisitionDate}
              onChange={(e) => setAcquisitionDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Delivery Deadline <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={deliveryDeadline}
              onChange={(e) => setDeliveryDeadline(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Financials: Total, Paid, Balance */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            Financial Breakdown (USD)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Total Order Value
              </label>
              <input
                type="number"
                min="0"
                value={totalOrderValue}
                onChange={(e) => setTotalOrderValue(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-mono font-bold text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Paid / Cash Collected
              </label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Remaining Balance
              </label>
              <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm font-mono font-bold text-amber-400">
                ${remainingNum.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Project Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="in_progress">In Progress</option>
            <option value="delivered">Delivered</option>
            <option value="revision">Revision</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Deliverable Notes
          </label>
          <textarea
            rows={2}
            placeholder="Key milestones or client specifications"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
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
            <FolderKanban className="h-4 w-4" />
            {existingProject ? 'Save Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
