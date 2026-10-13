'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Zap, CheckCircle2, Flame, Award, Target, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCRMStore } from '@/lib/store';

interface VelocityBarProps {
  completed: number;
  total: number;
  overdueCount?: number;
}

export const VelocityBar: React.FC<VelocityBarProps> = ({
  completed,
  total,
  overdueCount = 0,
}) => {
  const dailyGoal = useCRMStore((s) => s.dailyGoal);
  const streakDays = useCRMStore((s) => s.streakDays);
  const setDailyGoal = useCRMStore((s) => s.setDailyGoal);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));

  const effectiveTotal = Math.max(total, dailyGoal);
  const percentage = effectiveTotal > 0 ? Math.min(100, Math.round((completed / effectiveTotal) * 100)) : 100;
  const isAllDone = completed >= dailyGoal && (total === 0 || completed >= total);
  const prevDoneRef = useRef(false);

  useEffect(() => {
    if (isAllDone && !prevDoneRef.current) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'],
        });
      } catch (err) {
        console.error(err);
      }
    }
    prevDoneRef.current = isAllDone;
  }, [isAllDone]);

  const handleSaveGoal = () => {
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val > 0) {
      setDailyGoal(val);
    }
    setIsEditingGoal(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Background ambient glow */}
      <div
        className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-700 ${
          isAllDone ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
        }`}
      />

      <div className="relative flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-inner ${
                isAllDone
                  ? 'bg-emerald-500 text-white shadow-emerald-500/40'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isAllDone ? (
                <Award className="h-5 w-5 animate-bounce" />
              ) : (
                <Flame className="h-5 w-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base text-zinc-100 tracking-tight">
                  Daily Outreach Velocity
                </h3>
                {/* Streak Badge */}
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  <Flame className="h-3 w-3 text-amber-400" />
                  {streakDays}-Day Streak!
                </span>
                {isAllDone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                    Goal Met!
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {isAllDone
                  ? `Outstanding! You reached today's target of ${dailyGoal} outreach dispatches.`
                  : `${Math.max(0, dailyGoal - completed)} more to hit your daily goal (${dailyGoal} target).`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
            {/* Goal setter */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/60 px-2 py-1 rounded-lg border border-zinc-700/50">
              <Target className="h-3.5 w-3.5 text-teal-400" />
              {isEditingGoal ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-12 bg-zinc-900 border border-zinc-600 rounded px-1 py-0.5 text-xs text-zinc-100"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                  />
                  <button
                    onClick={handleSaveGoal}
                    className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingGoal(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white"
                  title="Click to adjust daily quota"
                >
                  <span>Goal: {dailyGoal}</span>
                  <Edit3 className="h-2.5 w-2.5 opacity-60" />
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight text-zinc-100">
                {completed}
              </span>
              <span className="text-sm font-medium text-zinc-500">/</span>
              <span className="text-sm font-semibold text-zinc-400">{dailyGoal}</span>
              <span className="ml-1.5 rounded-lg bg-zinc-800/80 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-zinc-700/50">
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-800/80 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
              isAllDone
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/50'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Overdue callout inline pill if present */}
        {overdueCount > 0 && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/50">
            <span className="text-rose-400 font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping inline-block" />
              {overdueCount} overdue follow-up{overdueCount === 1 ? '' : 's'} waiting for attention
            </span>
            <span className="text-[11px] text-zinc-500">Prioritized at top of queue</span>
          </div>
        )}
      </div>
    </div>
  );
};
