/**
 * Keyboard Navigation Hook
 * Provides utilities for managing keyboard navigation and focus
 * Requirements: 3.1, 3.4
 */

import { useEffect, useCallback, RefObject } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  trapFocus?: boolean;
  onEscape?: () => void;
  containerRef?: RefObject<HTMLElement>;
}

/**
 * Hook to manage keyboard navigation within a container
 */
export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const { enabled = true, trapFocus = false, onEscape, containerRef } = options;

  // Handle Escape key
  useEffect(() => {
    if (!enabled || !onEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape]);

  // Focus trap for modals
  useEffect(() => {
    if (!enabled || !trapFocus || !containerRef?.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap is activated
    firstElement.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [enabled, trapFocus, containerRef]);

  return {
    // Utility to get all focusable elements in a container
    getFocusableElements: useCallback((container: HTMLElement) => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    }, []),

    // Utility to focus first element in container
    focusFirst: useCallback((container: HTMLElement) => {
      const focusable = container.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, []),
  };
};

/**
 * Hook to handle Enter/Space key activation for custom interactive elements
 */
export const useKeyboardActivation = (callback: () => void, enabled: boolean = true) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback();
      }
    },
    [callback, enabled]
  );

  return { onKeyDown: handleKeyDown };
};
