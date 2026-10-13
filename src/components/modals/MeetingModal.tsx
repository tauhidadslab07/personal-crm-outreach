'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { useCRMStore } from '@/lib/store';
import { Meeting, MeetingOutcome } from '@/types/crm';
import { checkMeetingBufferConflict, BufferConflict } from '@/lib/meeting-buffer';
import { getTodayISO } from '@/lib/date-utils';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Video,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillLeadId?: string;
  existingMeeting?: Meeting;
}

export const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  onClose,
  prefillLeadId,
  existingMeeting,
}) => {
  const leads = useCRMStore((s) => s.leads);
  const meetings = useCRMStore((s) => s.meetings);
  const addMeeting = useCRMStore((s) => s.addMeeting);
  const updateMeeting = useCRMStore((s) => s.updateMeeting);

  const [selectedLeadId, setSelectedLeadId] = useState(prefillLeadId || '');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [meetingDate, setMeetingDate] = useState(getTodayISO());
  const [startTime, setStartTime] = useState('15:00');
  const [endTime, setEndTime] = useState('15:45');
  const [meetingLink, setMeetingLink] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [outcome, setOutcome] = useState<MeetingOutcome>('pending');
  const [dealValue, setDealValue] = useState('');
  const [allowConflictOverride, setAllowConflictOverride] = useState(false);

  // Sync prefill on open
  useEffect(() => {
    if (existingMeeting) {
      setSelectedLeadId(existingMeeting.leadId || '');
      setClientName(existingMeeting.leadName);
      setClientPhone(existingMeeting.leadPhone);
      setMeetingDate(existingMeeting.meetingDate);
      setStartTime(existingMeeting.startTime);
      setEndTime(existingMeeting.endTime);
      setMeetingLink(existingMeeting.meetingLink || '');
      setLocationNotes(existingMeeting.locationNotes || '');
      setOutcome(existingMeeting.outcome);
      setDealValue(existingMeeting.dealValue ? String(existingMeeting.dealValue) : '');
      setAllowConflictOverride(false);
    } else if (prefillLeadId) {
      const match = leads.find((l) => l.id === prefillLeadId);
      if (match) {
        setSelectedLeadId(match.id);
        setClientName(match.name);
        setClientPhone(match.phoneRaw);
        setMeetingDate(getTodayISO());
        setStartTime('15:00');
        setEndTime('15:45');
        setMeetingLink('https://meet.google.com/new');
        setOutcome('pending');
        setDealValue(match.value ? String(match.value) : '');
        setAllowConflictOverride(false);
      }
    } else {
      setMeetingDate(getTodayISO());
      setStartTime('15:00');
      setEndTime('15:45');
      setMeetingLink('https://meet.google.com/new');
      setAllowConflictOverride(false);
    }
  }, [isOpen, prefillLeadId, existingMeeting, leads]);

  // Handle lead selection change
  const handleLeadChange = (id: string) => {
    setSelectedLeadId(id);
    const match = leads.find((l) => l.id === id);
    if (match) {
      setClientName(match.name);
      setClientPhone(match.phoneRaw);
      if (match.value) setDealValue(String(match.value));
    }
  };

  // Real-time Buffer Conflict Detection (60-minute window)
  const bufferCheck: BufferConflict = useMemo(() => {
    return checkMeetingBufferConflict(
      meetingDate,
      startTime,
      endTime,
      meetings,
      existingMeeting?.id
    );
  }, [meetingDate, startTime, endTime, meetings, existingMeeting?.id]);

  const handleApplySuggestedSlot = () => {
    if (bufferCheck.suggestedSlot) {
      setStartTime(bufferCheck.suggestedSlot.startTime);
      setEndTime(bufferCheck.suggestedSlot.endTime);
      setAllowConflictOverride(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !meetingDate || !startTime || !endTime) return;

    if (bufferCheck.isConflict && !allowConflictOverride) {
      return; // Block unless override confirmed
    }

    const leadMatch = leads.find((l) => l.id === selectedLeadId);

    const payload = {
      leadId: selectedLeadId || '',
      leadName: clientName.trim(),
      leadPhone: clientPhone.trim() || (leadMatch?.phoneRaw || ''),
      leadIsoCode: leadMatch?.isoCode,
      leadFlagEmoji: leadMatch?.flagEmoji,
      meetingDate,
      startTime,
      endTime,
      meetingLink: meetingLink.trim() || undefined,
      locationNotes: locationNotes.trim() || undefined,
      outcome,
      dealValue: dealValue ? parseFloat(dealValue) : 0,
    };

    if (existingMeeting) {
      updateMeeting(existingMeeting.id, payload);
    } else {
      addMeeting(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingMeeting ? 'Edit Scheduled Meeting' : 'Schedule Intelligent Meeting'}
      subtitle="Guaranteed 60-minute buffer protection against calendar burnout"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Select Lead / Client <span className="text-rose-400">*</span>
          </label>
          <select
            value={selectedLeadId}
            onChange={(e) => handleLeadChange(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          >
            <option value="">-- Choose from existing leads or enter manually --</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.flagEmoji} {l.name} {l.company ? `(${l.company})` : ''} - {l.phoneRaw}
              </option>
            ))}
          </select>
        </div>

        {/* Client Name & Phone (Auto-filled or manual) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Client Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Elena Rostova"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Client Phone
            </label>
            <input
              type="text"
              placeholder="+1 (647) 555-0199"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
            />
          </div>
        </div>

        {/* Date, Start Time, End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Meeting Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Start Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              End Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
            />
          </div>
        </div>

        {/* Intelligent 60-Minute Buffer Conflict Alert Callout */}
        {bufferCheck.isConflict ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  {bufferCheck.isDirectOverlap ? 'Direct Collision Detected' : 'Buffer Conflict Warning'}
                </h4>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  {bufferCheck.message}
                </p>
              </div>
            </div>

            {bufferCheck.suggestedSlot && (
              <div className="flex items-center justify-between bg-zinc-900/80 rounded-lg p-2 border border-zinc-700/60">
                <span className="text-xs text-zinc-300">
                  Nearest conflict-free slot (+60m buffer):{' '}
                  <strong className="text-emerald-400 font-mono">
                    {bufferCheck.suggestedSlot.startTime} - {bufferCheck.suggestedSlot.endTime}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleApplySuggestedSlot}
                  className="rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold transition-all shadow-sm"
                >
                  Apply Slot
                </button>
              </div>
            )}

            <div className="pt-1 flex items-center gap-2">
              <input
                type="checkbox"
                id="overrideBuffer"
                checked={allowConflictOverride}
                onChange={(e) => setAllowConflictOverride(e.target.checked)}
                className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="overrideBuffer" className="text-xs text-zinc-300 cursor-pointer">
                I understand the buffer violation and want to schedule anyway
              </label>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Time slot verified: Complete 60-minute buffer before & after.</span>
          </div>
        )}

        {/* Meeting Link & Potential Deal Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Meeting / Join Link
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://meet.google.com/xyz or Zoom"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 pl-9 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
              <Video className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Estimated Deal Value ($ USD)
            </label>
            <input
              type="number"
              placeholder="e.g. 7500"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Agenda / Location Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Agenda / Location Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Demo outreach automation workflows & scope contract"
            value={locationNotes}
            onChange={(e) => setLocationNotes(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={bufferCheck.isConflict && !allowConflictOverride}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
          >
            <Calendar className="h-4 w-4" />
            {existingMeeting ? 'Save Changes' : 'Confirm & Lock Slot'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
