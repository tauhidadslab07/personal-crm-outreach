'use client';

import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { useCRMStore } from '@/lib/store';
import { downloadDatabaseBackup, validateBackupData } from '@/lib/backup';
import { Download, UploadCloud, CheckCircle2, AlertTriangle, Database, ShieldCheck } from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useCRMStore();
  const restoreDatabase = useCRMStore((s) => s.restoreDatabase);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleDownload = () => {
    downloadDatabaseBackup(store);
    setRestoreSuccess('✓ Full CRM database snapshot exported to your downloads folder!');
    setTimeout(() => setRestoreSuccess(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateBackupData(parsed);

        if (!validation.isValid) {
          setRestoreError(validation.error || 'Invalid backup file structure.');
          return;
        }

        restoreDatabase(parsed);
        setRestoreSuccess(`✓ Successfully restored ${parsed.data.leads?.length || 0} leads and complete pipeline data!`);
        setTimeout(() => {
          setRestoreSuccess(null);
          onClose();
        }, 2500);
      } catch (err: any) {
        setRestoreError('Failed to parse JSON file. Ensure you uploaded a valid .json backup.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Data Backup & Cloud-Ready Disaster Recovery"
      subtitle="Safely export full JSON snapshots or restore complete database state across devices"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Status Alerts */}
        {restoreSuccess && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 p-3.5 text-xs font-bold text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{restoreSuccess}</span>
          </div>
        )}

        {restoreError && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-rose-600/20 border border-rose-500/40 p-3.5 text-xs font-bold text-rose-300 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{restoreError}</span>
          </div>
        )}

        {/* Database Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Leads</span>
            <p className="text-lg font-extrabold text-zinc-100">{store.leads.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Stages Active</span>
            <p className="text-lg font-extrabold text-zinc-100">{store.stages.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Meetings</span>
            <p className="text-lg font-extrabold text-zinc-100">{store.meetings.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Projects</span>
            <p className="text-lg font-extrabold text-zinc-100">{store.projects.length}</p>
          </div>
        </div>

        {/* Actions Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export / Download */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <Download className="h-4 w-4" />
                <h4 className="text-sm font-bold text-zinc-100">Export Full Backup (.json)</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Download an uncorrupted, portable JSON snapshot of all your leads, cadence history, meetings, projects, and templates.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import / Restore */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400">
                <UploadCloud className="h-4 w-4" />
                <h4 className="text-sm font-bold text-zinc-100">Restore Backup (.json)</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Restore your complete pipeline onto a new computer or reload an earlier backup snapshot safely with 0% data loss.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="restore-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-200 hover:text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all active:scale-95 cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload & Restore Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px] text-zinc-400 flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            Backups are stored locally on your machine and can also be auto-synced with Supabase cloud whenever active.
          </span>
        </div>
      </div>
    </Modal>
  );
};
