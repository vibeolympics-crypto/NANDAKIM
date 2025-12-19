/**
 * Session State Hook
 * Manages page location persistence across refreshes using sessionStorage
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { useEffect, useCallback } from 'react';

export interface SessionLocation {
  path: string;
  section?: string;
  scrollPosition?: number;
  timestamp: number;
}

export interface UseSessionStateReturn {
  saveCurrentLocation: (path: string, section?: string, scrollPosition?: number) => void;
  restoreLocation: () => SessionLocation | null;
  clearLocation: () => void;
}

/**
 * Hook for managing session state persistence
 * @param key - Unique key for storing session data
 * @returns Session state management functions
 */
export function useSessionState(key: string): UseSessionStateReturn {
  /**
   * Save current location to sessionStorage
   * Requirements: 8.1
   */
  const saveCurrentLocation = useCallback(
    (path: string, section?: string, scrollPosition?: number): void => {
      try {
        const location: SessionLocation = {
          path,
          section,
          scrollPosition,
          timestamp: Date.now(),
        };

        sessionStorage.setItem(key, JSON.stringify(location));
      } catch (error) {
        console.error('Failed to save session location:', error);
      }
    },
    [key]
  );

  /**
   * Restore location from sessionStorage
   * Requirements: 8.2
   */
  const restoreLocation = useCallback((): SessionLocation | null => {
    try {
      const stored = sessionStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const location: SessionLocation = JSON.parse(stored);

      // Validate the restored data
      if (!location.path || typeof location.path !== 'string') {
        console.warn('Invalid session location data');
        return null;
      }

      return location;
    } catch (error) {
      console.error('Failed to restore session location:', error);
      return null;
    }
  }, [key]);

  /**
   * Clear location from sessionStorage
   * Requirements: 8.4
   */
  const clearLocation = useCallback((): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear session location:', error);
    }
  }, [key]);

  return {
    saveCurrentLocation,
    restoreLocation,
    clearLocation,
  };
}
