'use client';

import React, { useState } from 'react';
import { useAuthStore, MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASSWORD } from '@/lib/auth-store';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    }, 300);
  };

  const handleFillAdmin = () => {
    setEmail(MASTER_ADMIN_EMAIL);
    setPassword(MASTER_ADMIN_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl z-10">
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/60 mb-3.5">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
            Nexus CRM & Outreach
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Secure Outbound Operations & WhatsApp Engine
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            Admin-Managed Access Gateway
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700/80 bg-zinc-800/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[10px] text-zinc-500">
                Provided by Admin
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700/80 bg-zinc-800/80 pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:from-emerald-500 hover:to-teal-400 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Sign In to CRM Portal</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Master Admin Quick Access */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">
              Master Admin Quick Access:
            </span>
            <button
              type="button"
              onClick={handleFillAdmin}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-all"
            >
              <KeyRound className="h-3 w-3" />
              1-Click Fill Admin
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
            Admin: <code className="text-zinc-300 font-mono">tauhidadslab@gmail.com</code>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-[10px] text-zinc-400 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-zinc-300 mb-0.5">
            <UserCheck className="h-3.5 w-3.5 text-teal-400" />
            Restricted Role Management
          </div>
          New accounts and credentials can only be generated by the Super Admin. Self-registration is disabled for security.
        </div>
      </div>
    </div>
  );
};
