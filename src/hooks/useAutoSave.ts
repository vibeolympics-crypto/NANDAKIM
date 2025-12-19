import { useEffect, useRef, useState, useCallback } from 'react';

export interface AutoSaveOptions {
  delay?: number; // Delay in milliseconds before auto-save triggers (default: 3000)
  enabled?: boolean; // Whether auto-save is enabled (default: true)
  onSaveStart?: () => void; // Callback when save starts
  onSaveSuccess?: () => void; // Callback when save succeeds
  onSaveError?: (error: Error) => void; // Callback when save fails
  maxRetries?: number; // Maximum number of retry attempts (default: 3)
  retryDelay?: number; // Delay between retries in milliseconds (default: 1000)
  localStorageKey?: string; // Key for localStorage backup
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  retryCount: number;
  hasLocalBackup: boolean;
}

/**
 * Hook for implementing auto-save functionality with retry logic and localStorage backup
 * Validates: Requirements 20.1, 20.2, 20.3
 *
 * @param content - The content to auto-save
 * @param saveFunction - Async function that performs the save operation
 * @param options - Configuration options for auto-save behavior
 * @returns Auto-save state and manual save function
 */
export const useAutoSave = <T>(
  content: T,
  saveFunction: (data: T) => Promise<void>,
  options: AutoSaveOptions = {}
): AutoSaveState & { manualSave: () => Promise<void>; restoreFromBackup: () => T | null } => {
  const {
    delay = 3000,
    enabled = true,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
    maxRetries = 3,
    retryDelay = 1000,
    localStorageKey,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [hasLocalBackup, setHasLocalBackup] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const contentRef = useRef<T>(content);
  const isInitialMount = useRef(true);

  // Update content ref and create localStorage backup
  useEffect(() => {
    contentRef.current = content;

    // Save to localStorage as backup if key is provided
    if (localStorageKey) {
      try {
        localStorage.setItem(
          localStorageKey,
          JSON.stringify({
            content,
            timestamp: new Date().toISOString(),
          })
        );
        setHasLocalBackup(true);
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }, [content, localStorageKey]);

  // Perform save operation with retry logic
  const performSave = useCallback(
    async (currentRetry = 0): Promise<void> => {
      if (isSaving) return;

      setIsSaving(true);
      setSaveStatus('saving');
      setError(null);
      setRetryCount(currentRetry);
      onSaveStart?.();

      try {
        await saveFunction(contentRef.current);
        setLastSaved(new Date());
        setSaveStatus('saved');
        setRetryCount(0);
        onSaveSuccess?.();

        // Clear localStorage backup on successful save
        if (localStorageKey) {
          try {
            localStorage.removeItem(localStorageKey);
            setHasLocalBackup(false);
          } catch (err) {
            console.error('Failed to clear localStorage backup:', err);
          }
        }

        // Reset to idle after showing "saved" status for 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Save failed');

        // Retry logic
        if (currentRetry < maxRetries) {
          console.log(`Save failed, retrying (${currentRetry + 1}/${maxRetries})...`);

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          // Recursive retry
          return performSave(currentRetry + 1);
        } else {
          // Max retries reached
          setError(error);
          setSaveStatus('error');
          setRetryCount(currentRetry);
          onSaveError?.(error);
          console.error('Auto-save failed after max retries:', error);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      isSaving,
      saveFunction,
      onSaveStart,
      onSaveSuccess,
      onSaveError,
      maxRetries,
      retryDelay,
      localStorageKey,
    ]
  );

  // Manual save function
  const manualSave = useCallback(async () => {
    // Clear any pending auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave(0);
  }, [performSave]);

  // Restore from localStorage backup
  const restoreFromBackup = useCallback((): T | null => {
    if (!localStorageKey) return null;

    try {
      const backup = localStorage.getItem(localStorageKey);
      if (backup) {
        const parsed = JSON.parse(backup);
        return parsed.content as T;
      }
    } catch (err) {
      console.error('Failed to restore from localStorage:', err);
    }
    return null;
  }, [localStorageKey]);

  // Auto-save effect
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip if auto-save is disabled
    if (!enabled) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save (3 seconds after last edit)
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, delay, performSave]);

  return {
    isSaving,
    lastSaved,
    error,
    saveStatus,
    retryCount,
    hasLocalBackup,
    manualSave,
    restoreFromBackup,
  };
};
