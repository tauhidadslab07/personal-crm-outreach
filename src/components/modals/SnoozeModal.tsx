'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Lead, CadenceStage } from '@/types/crm';
import { useCRMStore } from '@/lib/store';
import { getTodayISO, addDays, STAGE_TITLES } from '@/lib/date-utils';
import { Clock, Calendar, CheckCircle2, BellRing, Sparkles } from 'lucide-react';

interface SnoozeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  stage?: CadenceStage | null;
  onSnoozed?: (leadName: string, newDate: string) => void;
}

export const SnoozeModal: React.FC<SnoozeModalProps> = ({
  isOpen,
  onClose,
  lead,
  stage,
  onSnoozed,
}) => {
  const snoozeStage = useCRMStore((s) => s.snoozeStage);
  const today = getTodayISO();

  const [selectedDate, setSelectedDate] = useState(addDays(today, 1));
  const [reason, setReason] = useState('');

  const quickOptions = [
    { label: '🌅 Tomorrow', date: addDays(today, 1) },
    { label: '⚡ In 3 Days', date: addDays(today, 3) },
    { label: '📅 In 5 Days', date: addDays(today, 5) },
    { label: '💼 Next Week (+7d)', date: addDays(today, 7) },
    { label: '🗓️ Next Month (+30d)', date: addDays(today, 30) },
  ];

  const handleConfirm = () => {
    if (!stage || !lead) return;
    snoozeStage(stage.id, selectedDate, reason.trim() || undefined);
    if (onSnoozed) {
      onSnoozed(lead.name, selectedDate);
    }
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Snooze & Custom Reschedule Follow-up"
      subtitle={
        lead && stage
          ? `Reschedule ${STAGE_TITLES[stage.stageNumber]} for "${lead.name}" (${lead.company || lead.countryName})`
          : 'Snooze outreach stage to a future date'
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Quick Date Presets */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
            Quick Reschedule Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickOptions.map((opt) => (
              <button
                key={opt.date}
                type="button"
                onClick={() => setSelectedDate(opt.date)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedDate === opt.date
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] font-mono text-zinc-500">{opt.date.slice(5)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Exact Date Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-teal-400" />
            Pick Exact Target Date
          </label>
          <input
            type="date"
            min={addDays(today, 1)}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
        </div>

        {/* Optional Snooze Reason */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
            Reason / Client Note <span className="text-[10px] text-zinc-500 lowercase font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Client traveling, asked to message after 5pm next week..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Informative Callout */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-xs text-zinc-400 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            This lead will be hidden from today's active queue and will reappear automatically in <strong>Today's Work</strong> on <strong>{selectedDate}</strong>.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
          >
            <Clock className="h-4 w-4" />
            <span>Snooze to {selectedDate}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
