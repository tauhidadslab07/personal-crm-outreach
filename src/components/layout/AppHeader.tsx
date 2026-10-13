'use client';

import React from 'react';
import { useCRMStore } from '@/lib/store';
import {
  Search,
  UserPlus,
  UploadCloud,
  FileCode,
  RotateCcw,
  Sparkles,
  Database,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AppHeaderProps {
  onOpenNewLead: () => void;
  onOpenBulkImport: () => void;
  onOpenTemplates: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenNewLead,
  onOpenBulkImport,
  onOpenTemplates,
  searchInputRef,
}) => {
  const searchQuery = useCRMStore((s) => s.searchQuery);
  const setSearchQuery = useCRMStore((s) => s.setSearchQuery);
  const resetToSampleData = useCRMStore((s) => s.resetToSampleData);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/50">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="hidden xs:block">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-zinc-100">
              Nexus CRM
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              WhatsApp Engine
            </span>
            {isSupabaseConfigured && (
              <span
                title="PostgreSQL Database Connected"
                className="hidden xl:inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/20"
              >
                <Database className="h-2.5 w-2.5" />
                Supabase Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            High-Velocity Outreach & Pipeline Operations
          </p>
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="flex-1 max-w-md mx-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search leads, phone, company, country... (Press '/' to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:bg-zinc-900 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Scripts button */}
        <button
          onClick={onOpenTemplates}
          title="Cadence WhatsApp Scripts"
          className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
        >
          <FileCode className="h-3.5 w-3.5 text-teal-400" />
          <span>Scripts</span>
        </button>

        {/* Bulk Import button */}
        <button
          onClick={onOpenBulkImport}
          title="Bulk Lead Importer (B)"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all"
        >
          <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Bulk Import</span>
          <kbd className="hidden lg:inline-block rounded bg-zinc-800 px-1 py-0.2 text-[9px] text-zinc-400">
            B
          </kbd>
        </button>

        {/* Add Lead button */}
        <button
          onClick={onOpenNewLead}
          title="Add New Target Lead (N)"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/50 hover:bg-emerald-500 transition-all active:scale-95"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Lead</span>
          <kbd className="hidden lg:inline-block rounded bg-emerald-700/60 px-1 py-0.2 text-[9px] text-emerald-200">
            N
          </kbd>
        </button>

        {/* Demo reset */}
        <button
          onClick={resetToSampleData}
          title="Reset to sample demo data"
          className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors hidden sm:block"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
