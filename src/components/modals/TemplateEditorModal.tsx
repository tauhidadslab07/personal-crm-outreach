'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { useCRMStore } from '@/lib/store';
import { STAGE_TITLES } from '@/lib/date-utils';
import { CadenceStageNumber } from '@/types/crm';
import { MessageSquare, Save, RotateCcw } from 'lucide-react';
import { DEFAULT_CADENCE_TEMPLATES } from '@/lib/whatsapp';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ isOpen, onClose }) => {
  const templates = useCRMStore((s) => s.templates);
  const updateTemplate = useCRMStore((s) => s.updateTemplate);

  const [activeStage, setActiveStage] = useState<CadenceStageNumber>(0);
  const currentTemplate = templates.find((t) => t.stageNumber === activeStage) || templates[0];
  const [content, setContent] = useState(currentTemplate?.content || '');

  const handleStageSelect = (stage: CadenceStageNumber) => {
    setActiveStage(stage);
    const match = templates.find((t) => t.stageNumber === stage);
    setContent(match?.content || '');
  };

  const handleSave = () => {
    if (currentTemplate) {
      updateTemplate(currentTemplate.id, content);
    }
  };

  const handleResetToDefault = () => {
    const def = DEFAULT_CADENCE_TEMPLATES.find((t) => t.stageNumber === activeStage);
    if (def) {
      setContent(def.content);
      if (currentTemplate) {
        updateTemplate(currentTemplate.id, def.content);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadence WhatsApp Script Engine"
      subtitle="Customize templates for each stage. Interpolates {name}, {company}, {service}"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Stage Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-zinc-800">
          {([0, 1, 2, 3, 4, 5] as CadenceStageNumber[]).map((stageNum) => (
            <button
              key={stageNum}
              type="button"
              onClick={() => handleStageSelect(stageNum)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeStage === stageNum
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Stage {stageNum}: {stageNum === 0 ? 'Initial' : stageNum === 5 ? 'Breakup' : `FU ${stageNum}`}
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-bold text-zinc-200">
              {STAGE_TITLES[activeStage]} Script
            </h4>
            <span className="text-[11px] text-zinc-500 font-mono">
              Available tags: &#123;name&#125;, &#123;company&#125;
            </span>
          </div>

          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Live Preview Box */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
            Sample Live WhatsApp Preview
          </span>
          <p className="text-xs text-emerald-300/90 italic leading-relaxed">
            &ldquo;
            {content
              .replace(/\{name\}/gi, 'Sarah')
              .replace(/\{company\}/gi, 'CloudScale AI')}
            &rdquo;
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-95"
            >
              <Save className="h-4 w-4" />
              Save Script
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
