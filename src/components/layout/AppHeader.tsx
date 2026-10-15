'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCRMStore } from '@/lib/store';
import {
  Search,
  UserPlus,
  UploadCloud,
  FileCode,
  RotateCcw,
  Sparkles,
  Database,
  Download,
  Layers,
  UserCog,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { exportLeadsToCSV } from '@/lib/csv-export';
import { useAuthStore, MASTER_ADMIN_PASSWORD } from '@/lib/auth-store';

interface AppHeaderProps {
  onOpenNewLead: () => void;
  onOpenBulkImport: () => void;
  onOpenTemplates: () => void;
  onOpenBackup?: () => void;
  onOpenUserManagement?: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenNewLead,
  onOpenBulkImport,
  onOpenTemplates,
  onOpenBackup,
  onOpenUserManagement,
  searchInputRef,
}) => {
  const searchQuery = useCRMStore((s) => s.searchQuery);
  const setSearchQuery = useCRMStore((s) => s.setSearchQuery);
  const resetToSampleData = useCRMStore((s) => s.resetToSampleData);
  const activeTab = useCRMStore((s) => s.activeTab);
  const setActiveTab = useCRMStore((s) => s.setActiveTab);
  const leads = useCRMStore((s) => s.leads);

  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Security confirmation state for database reset
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetToast, setResetToast] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen || isResetConfirmOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isResetConfirmOpen]);

  const handleConfirmReset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (resetPasswordInput !== MASTER_ADMIN_PASSWORD) {
      setResetError('Incorrect Super Admin password. Reset cancelled.');
      return;
    }
    resetToSampleData();
    setIsResetConfirmOpen(false);
    setResetPasswordInput('');
    setResetError('');
    setResetToast('✓ Database cleaned & reset to clean state (2 niches only)!');
    setTimeout(() => setResetToast(null), 4000);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-3 sm:px-6 backdrop-blur-md">
      {/* Left: Brand & Title */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/50">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="hidden xs:block">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm font-bold tracking-tight text-zinc-100">
              Nexus CRM
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
              WhatsApp
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
      <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search leads, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:bg-zinc-900 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 sm:top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Niches button (desktop only) */}
        <button
          onClick={() => setActiveTab('niches')}
          title="Manage Target Industry Niches"
          className={`hidden md:inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
            activeTab === 'niches'
              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm'
              : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-emerald-400" />
          <span>Niches</span>
        </button>

        {/* Export CSV button (desktop only) */}
        <button
          onClick={() => exportLeadsToCSV(leads)}
          title="Export Leads to CSV / Excel"
          className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
        >
          <Download className="h-3.5 w-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>

        {/* Scripts button (desktop only) */}
        <button
          onClick={onOpenTemplates}
          title="Cadence WhatsApp Scripts"
          className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
        >
          <FileCode className="h-3.5 w-3.5 text-teal-400" />
          <span>Scripts</span>
        </button>

        {/* Database Backup & Disaster Recovery button */}
        {onOpenBackup && (
          <button
            onClick={onOpenBackup}
            title="Database Backup & Cloud Disaster Recovery"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
          >
            <Database className="h-3.5 w-3.5 text-amber-400" />
            <span>Backup</span>
          </button>
        )}

        {/* Bulk Import button (desktop only) */}
        <button
          onClick={onOpenBulkImport}
          title="Bulk Lead Importer (B)"
          className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all"
        >
          <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
          <span>Bulk Import</span>
          <kbd className="hidden 2xl:inline-block rounded bg-zinc-800 px-1 py-0.2 text-[9px] text-zinc-400">
            B
          </kbd>
        </button>

        {/* Add Lead button (both mobile and desktop) */}
        <button
          onClick={onOpenNewLead}
          title="Add New Target Lead"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/50 hover:bg-emerald-500 transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Lead</span>
          <span className="sm:hidden text-xs">Add</span>
        </button>

        {/* Desktop User Profile & Logout */}
        {currentUser && (
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-zinc-800 ml-1">
            {currentUser.role === 'admin' && onOpenUserManagement && (
              <button
                onClick={onOpenUserManagement}
                title="Manage Team Members & Credentials"
                className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-2.5 py-1.5 text-xs font-bold text-rose-300 transition-all"
              >
                <UserCog className="h-3.5 w-3.5 text-rose-400" />
                <span>Team</span>
              </button>
            )}

            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-bold text-zinc-200 truncate max-w-[110px]">
                {currentUser.name}
              </span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase">
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Secure Reset Database (desktop) */}
        <button
          onClick={() => {
            setResetError('');
            setResetPasswordInput('');
            setIsResetConfirmOpen(true);
          }}
          title="Reset Database to Clean State (Admin Verification Required)"
          className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors hidden sm:block cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          title="Open Mobile Navigation Menu"
          className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Slide-Over Drawer Portaled directly to body to avoid stacking and backdrop-filter issues */}
      {mounted &&
        isMobileMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] lg:hidden flex justify-end animate-in fade-in duration-200">
            {/* Dark Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Solid Drawer Content */}
            <div
              className="relative w-full max-w-sm h-full border-l border-zinc-800 p-5 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto animate-in slide-in-from-right duration-200"
              style={{ backgroundColor: '#09090b', opacity: 1 }}
            >
              <div className="space-y-5">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-base shadow">
                      {currentUser?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-100 truncate max-w-[170px]">
                        {currentUser?.name || 'User'}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        {currentUser?.role === 'admin' ? '🛡️ Super Admin' : '👤 Team Member'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Action Buttons List */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenNewLead();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>+ Add Target Lead</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenBulkImport();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4 text-cyan-400" />
                    <span>Bulk Lead Importer</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTemplates();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    <FileCode className="h-4 w-4 text-teal-400" />
                    <span>Cadence WhatsApp Scripts</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      exportLeadsToCSV(leads);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    <span>Export Leads to CSV</span>
                  </button>

                  {onOpenBackup && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenBackup();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                    >
                      <Database className="h-4 w-4 text-amber-400" />
                      <span>Database Backup & Restore</span>
                    </button>
                  )}

                  {currentUser?.role === 'admin' && onOpenUserManagement && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenUserManagement();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <UserCog className="h-4 w-4 text-rose-400" />
                      <span>Team & Access Management</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom: Demo Reset & Sign Out */}
              <div className="pt-4 border-t border-zinc-800/80 space-y-2 mt-6">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setResetError('');
                    setResetPasswordInput('');
                    setIsResetConfirmOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Database to Clean State</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Floating Success Toast */}
      {mounted &&
        resetToast &&
        createPortal(
          <div className="fixed top-5 right-5 z-[120] flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
            <span>{resetToast}</span>
          </div>,
          document.body
        )}

      {/* Security Verification Modal for Database Reset */}
      {mounted &&
        isResetConfirmOpen &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setIsResetConfirmOpen(false)}
            />
            <div
              className="relative w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl space-y-4 z-10"
              style={{ backgroundColor: '#18181b', opacity: 1 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <AlertTriangle className="h-6 w-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Security Check: Reset Database
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Admin authorization required to clear database to clean state.
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmReset} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-rose-400" />
                    <span>Enter Super Admin Password</span>
                  </label>
                  <input
                    type="password"
                    value={resetPasswordInput}
                    onChange={(e) => {
                      setResetPasswordInput(e.target.value);
                      setResetError('');
                    }}
                    placeholder="Super Admin Password..."
                    autoFocus
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                  {resetError && (
                    <p className="text-xs font-bold text-rose-400 mt-1.5">{resetError}</p>
                  )}
                </div>

                <div className="rounded-xl bg-zinc-950/60 p-3 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                  <p className="font-semibold text-zinc-300">This action will:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                    <li>Remove all leads, stages, meetings, and projects.</li>
                    <li>Retain only 2 designated target niches: <b>Website Developer</b> & <b>Website Development Agency</b>.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/50 transition-all active:scale-95 cursor-pointer"
                  >
                    Authorize & Reset
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
