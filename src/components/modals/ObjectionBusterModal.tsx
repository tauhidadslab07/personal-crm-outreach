'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Lead } from '@/types/crm';
import { OBJECTION_PLAYBOOK, VOICE_NOTE_SCRIPTS, ObjectionItem, VoiceNoteScript } from '@/lib/objections';
import { ShieldAlert, Mic, Copy, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react';

interface ObjectionBusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

export const ObjectionBusterModal: React.FC<ObjectionBusterModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const [activeTab, setActiveTab] = useState<'objections' | 'voicenotes'>('objections');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const prospectName = lead?.name?.trim() || 'there';
  const prospectCompany = lead?.company?.trim() || 'your company';

  const formatText = (text: string) => {
    return text
      .replace(/\{name\}/gi, prospectName)
      .replace(/\{company\}/gi, prospectCompany);
  };

  const handleCopy = (id: string, text: string) => {
    const formatted = formatText(text);
    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Objection Playbook & Voice Note Scripts"
      subtitle={`Personalized for ${lead ? `"${lead.name}" (${lead.company || lead.countryName})` : 'Prospect'}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('objections')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'objections'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Instant Objection Buster (6 Playbooks)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voicenotes')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'voicenotes'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Mic className="h-4 w-4 text-cyan-400" />
            <span>30-Sec Voice Note Scripts (3x Reply Rate)</span>
          </button>
        </div>

        {/* Tab 1: Objection Counters */}
        {activeTab === 'objections' && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {OBJECTION_PLAYBOOK.map((item) => {
              const formattedScript = formatText(item.script);
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                          {item.tag}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-100">{item.label}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400">{item.summary}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.script)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Counter</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3 text-xs text-zinc-300 leading-relaxed font-sans">
                    {formattedScript}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Voice Note Scripts */}
        {activeTab === 'voicenotes' && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>
                <strong>Pro-Tip:</strong> WhatsApp voice notes build 3x faster trust than text. Hold your phone naturally, smile while speaking, and speak for under 35 seconds!
              </span>
            </div>

            {VOICE_NOTE_SCRIPTS.map((vn) => {
              const formattedScript = formatText(vn.script);
              const isCopied = copiedId === vn.id;

              return (
                <div
                  key={vn.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold">
                          {vn.stageLabel}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">⏱️ {vn.duration}</span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-100">{vn.title}</h4>
                      <p className="text-[11px] text-zinc-400 italic">💡 {vn.tip}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(vn.id, vn.script)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          <span>Copied Script!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3 text-xs text-zinc-300 leading-relaxed font-sans italic">
                    {formattedScript}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
