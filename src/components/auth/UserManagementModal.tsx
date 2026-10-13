'use client';

import React, { useState } from 'react';
import { Modal } from '../modals/Modal';
import { useAuthStore, MASTER_ADMIN_EMAIL } from '@/lib/auth-store';
import { UserRole } from '@/types/crm';
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Trash2,
  Lock,
  Mail,
  User,
  Power,
  Share2,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const users = useAuthStore((s) => s.users);
  const addUser = useAuthStore((s) => s.addUser);
  const deleteUser = useAuthStore((s) => s.deleteUser);
  const toggleUserStatus = useAuthStore((s) => s.toggleUserStatus);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('hunter');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const res = addUser({
      name,
      email,
      password,
      role,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to create user account');
    } else {
      setSuccessMsg(`Account for "${name}" created successfully with assigned password!`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('hunter');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleCopyCredentials = (user: (typeof users)[0]) => {
    const text = `*Nexus CRM Login Credentials*\n👤 Name: ${user.name}\n📧 Email: ${user.email}\n🔑 Password: ${user.passwordHash}\nRole: ${user.role.toUpperCase()}\nLogin URL: http://localhost:3000`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    hunter: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    closer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    member: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team & Access Control (Admin Portal)"
      subtitle="Create team accounts and set assigned passwords. Members cannot create or change their own passwords."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Only Admin Warning */}
        {currentUser?.role !== 'admin' && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Only the Super Admin ({MASTER_ADMIN_EMAIL}) has authority to create and manage accounts.</span>
          </div>
        )}

        {/* Create Member Form */}
        <form onSubmit={handleCreateUser} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <UserPlus className="h-4 w-4 text-emerald-400" />
            <span>+ Create New Team Member Account</span>
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
              {formError}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud, Jessica Taylor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. asif@team.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password (Assigned by Admin) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-300 uppercase">
                  Assign Password *
                </label>
                <span className="text-[10px] text-zinc-500">(Admin-controlled)</span>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif@hunt2026"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                Designated Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="hunter">Outreach Hunter (WhatsApp Cadence)</option>
                <option value="closer">Deal Closer (Meetings & Deals)</option>
                <option value="admin">Administrator (Full Access)</option>
                <option value="member">Viewer / Associate</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-[0.98]"
          >
            Create Member & Assign Password
          </button>
        </form>

        {/* Member Directory */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-cyan-400" />
              <span>Active Team Roster ({users.length})</span>
            </div>
            <span className="text-[11px] text-zinc-500">Super Admin: {MASTER_ADMIN_EMAIL}</span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {users.map((u) => {
              const isMaster = u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
              const isCopied = copiedId === u.id;

              return (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-200 shrink-0">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{u.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase ${roleColors[u.role]}`}
                        >
                          {u.role}
                        </span>
                        {isMaster && (
                          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">
                            Master Owner
                          </span>
                        )}
                        {!u.isActive && (
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/20">
                            Deactivated
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 flex flex-wrap items-center gap-3">
                        <span>{u.email}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="font-mono text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
                          PW: {u.passwordHash}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {/* Copy Credential for WhatsApp */}
                    <button
                      onClick={() => handleCopyCredentials(u)}
                      title="Copy credentials formatted for WhatsApp"
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                        isCopied
                          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3 w-3 text-cyan-400" />
                          <span>Share</span>
                        </>
                      )}
                    </button>

                    {/* Toggle Status (Active / Deactive) */}
                    {!isMaster && (
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        title={u.isActive ? 'Deactivate user' : 'Activate user'}
                        className={`p-1.5 rounded-xl border transition-all ${
                          u.isActive
                            ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-amber-400'
                            : 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Delete User */}
                    {!isMaster && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        title="Delete user account"
                        className="p-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
