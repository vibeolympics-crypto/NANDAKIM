import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl+S even in input fields
        if (!(event.ctrlKey && event.key.toLowerCase() === 's')) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl;
        const shiftMatches = shortcut.shift === undefined || event.shiftKey === shortcut.shift;
        const altMatches = shortcut.alt === undefined || event.altKey === shortcut.alt;
        const metaMatches = shortcut.meta === undefined || event.metaKey === shortcut.meta;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Common keyboard shortcuts
export const commonShortcuts = {
  save: (handler: () => void): KeyboardShortcut => ({
    key: 's',
    ctrl: true,
    handler,
    description: 'Save',
  }),
  undo: (handler: () => void): KeyboardShortcut => ({
    key: 'z',
    ctrl: true,
    handler,
    description: 'Undo',
  }),
  redo: (handler: () => void): KeyboardShortcut => ({
    key: 'y',
    ctrl: true,
    handler,
    description: 'Redo',
  }),
  help: (handler: () => void): KeyboardShortcut => ({
    key: '?',
    shift: true,
    handler,
    description: 'Show help',
    preventDefault: false,
  }),
  escape: (handler: () => void): KeyboardShortcut => ({
    key: 'Escape',
    handler,
    description: 'Close/Cancel',
  }),
  find: (handler: () => void): KeyboardShortcut => ({
    key: 'f',
    ctrl: true,
    handler,
    description: 'Find',
  }),
  new: (handler: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrl: true,
    handler,
    description: 'New',
  }),
};
