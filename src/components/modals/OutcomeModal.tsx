'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Meeting, MeetingOutcome } from '@/types/crm';
import { useCRMStore } from '@/lib/store';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle, RefreshCw, XCircle, DollarSign } from 'lucide-react';

interface OutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({ isOpen, onClose, meeting }) => {
  const setMeetingOutcome = useCRMStore((s) => s.setMeetingOutcome);

  const [outcome, setOutcome] = useState<MeetingOutcome>(meeting?.outcome || 'closed_won');
  const [dealValue, setDealValue] = useState(meeting?.dealValue ? String(meeting.dealValue) : '5000');
  const [notes, setNotes] = useState('');

  if (!meeting) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const valueNum = dealValue ? parseFloat(dealValue) : 0;
    setMeetingOutcome(meeting.id, outcome, valueNum, notes.trim() || undefined);

    if (outcome === 'closed_won') {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#FBBF24', '#60A5FA'],
        });
      } catch (err) {
        console.error(err);
      }
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Meeting Outcome: ${meeting.leadName}`}
      subtitle={`Meeting on ${meeting.meetingDate} at ${meeting.startTime}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Outcome Selector Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setOutcome('closed_won')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
              outcome === 'closed_won'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-500/20'
                : 'border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Trophy className="h-6 w-6 text-emerald-400 mb-1" />
            <span className="text-xs font-bold text-zinc-100">Closed Won!</span>
            <span className="text-[10px] text-zinc-400">Deal signed & secured</span>
          </button>

          <button
            type="button"
            onClick={() => setOutcome('followup_needed')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
              outcome === 'followup_needed'
                ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-2 ring-cyan-500/20'
                : 'border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <RefreshCw className="h-6 w-6 text-cyan-400 mb-1" />
            <span className="text-xs font-bold text-zinc-100">Follow-up Needed</span>
            <span className="text-[10px] text-zinc-400">Proposal / 2nd call</span>
          </button>

          <button
            type="button"
            onClick={() => setOutcome('pending')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
              outcome === 'pending'
                ? 'border-amber-500 bg-amber-950/40 text-amber-300 ring-2 ring-amber-500/20'
                : 'border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <CheckCircle className="h-6 w-6 text-amber-400 mb-1" />
            <span className="text-xs font-bold text-zinc-100">Pending Decision</span>
            <span className="text-[10px] text-zinc-400">Client reviewing</span>
          </button>

          <button
            type="button"
            onClick={() => setOutcome('lost')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
              outcome === 'lost'
                ? 'border-rose-500 bg-rose-950/40 text-rose-300 ring-2 ring-rose-500/20'
                : 'border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <XCircle className="h-6 w-6 text-rose-400 mb-1" />
            <span className="text-xs font-bold text-zinc-100">Lost Deal</span>
            <span className="text-[10px] text-zinc-400">Not a good fit / budget</span>
          </button>
        </div>

        {/* Closed Won Deal Value */}
        {outcome === 'closed_won' && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Closed Deal Value ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold">$</span>
              <input
                type="number"
                required
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 pl-8 pr-3.5 py-2 text-sm font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Tip: Setting this will automatically spin up a client project delivery card with 50% deposit balance!
            </p>
          </div>
        )}

        {/* Reschedule or Outcome Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Outcome Notes & Key Next Actions
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Client loved the WhatsApp demo. Sending invoice by Friday."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
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
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-95"
          >
            Log Outcome
          </button>
        </div>
      </form>
    </Modal>
  );
};
