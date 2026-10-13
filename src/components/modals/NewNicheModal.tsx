'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { useCRMStore } from '@/lib/store';
import { Layers, Sparkles, Target, Palette } from 'lucide-react';

interface NewNicheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { id: 'cyan', label: 'Electric Cyan', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { id: 'amber', label: 'Warm Amber', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { id: 'purple', label: 'Royal Purple', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  { id: 'rose', label: 'Crimson Rose', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
  { id: 'blue', label: 'Ocean Blue', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  { id: 'orange', label: 'Vibrant Orange', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
];

export const NewNicheModal: React.FC<NewNicheModalProps> = ({ isOpen, onClose }) => {
  const addNiche = useCRMStore((s) => s.addNiche);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [color, setColor] = useState('emerald');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addNiche({
      name: name.trim(),
      description: description.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      color,
    });

    setName('');
    setDescription('');
    setTargetAudience('');
    setColor('emerald');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Target Industry Niche"
      subtitle="Organize, hunt, and filter leads by specific market sectors"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Niche Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">
            Niche / Industry Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Layers className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              required
              placeholder="e.g. Solar Contractors, Med-Spas, B2B SaaS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Target Audience / ICP */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">
            Ideal Customer Profile (ICP)
          </label>
          <div className="relative">
            <Target className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="e.g. Founders, CMOs, General Contractors"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">
            Niche Description & Notes
          </label>
          <textarea
            rows={2}
            placeholder="Key value propositions, typical pain points, and pitch angle..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Color Theme Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">
            Badge & Accent Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${c.bg} ${
                  color === c.id ? 'ring-2 ring-white scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-[0.98] mt-2"
        >
          Save & Launch Niche
        </button>
      </form>
    </Modal>
  );
};
