'use client';

import { useEffect } from 'react';
import { useCRMStore } from '@/lib/store';

interface ShortcutOptions {
  onOpenNewLead?: () => void;
  onOpenBulkImport?: () => void;
  onFocusSearch?: () => void;
}

export function useKeyboardShortcuts(options?: ShortcutOptions) {
  const setActiveTab = useCRMStore((s) => s.setActiveTab);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Check key
      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('today');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('leads');
      } else if (e.key === '3') {
        e.preventDefault();
        setActiveTab('meetings');
      } else if (e.key === '4') {
        e.preventDefault();
        setActiveTab('projects');
      } else if (e.key === '5') {
        e.preventDefault();
        setActiveTab('analytics');
      } else if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        options?.onOpenNewLead?.();
      } else if (e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        options?.onOpenBulkImport?.();
      } else if (e.key === '/') {
        e.preventDefault();
        options?.onFocusSearch?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, options]);
}
