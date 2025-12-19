/**
 * React Hook for Session Management
 * Provides session state and controls for React components
 * Requirements: 26.1, 26.2, 26.3
 */

import { useEffect, useState, useCallback } from 'react';
import { sessionManager, SessionEventType } from '../lib/auth/sessionManager';
import { refreshAuthToken } from '../lib/auth/jwt';

export interface UseSessionManagerReturn {
  isWarningVisible: boolean;
  timeUntilTimeout: number;
  extendSession: () => void;
  logout: () => void;
}

export function useSessionManager(
  onTimeout?: () => void,
  onRefreshError?: (error: Error) => void
): UseSessionManagerReturn {
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState(0);

  // Handle session events
  useEffect(() => {
    const handleSessionEvent = async (event: SessionEventType, data?: any) => {
      switch (event) {
        case 'warning':
          setIsWarningVisible(true);
          setTimeUntilTimeout(data?.remainingTime || 0);
          break;

        case 'timeout':
          setIsWarningVisible(false);
          if (onTimeout) {
            onTimeout();
          }
          break;

        case 'refresh':
          try {
            await refreshAuthToken();
          } catch (error) {
            console.error('Token refresh failed:', error);
            if (onRefreshError) {
              onRefreshError(error as Error);
            }
          }
          break;

        case 'activity':
          if (data?.extended) {
            setIsWarningVisible(false);
          }
          break;
      }
    };

    // Register event handler
    const unsubscribe = sessionManager.on(handleSessionEvent);

    // Start session monitoring
    sessionManager.start();

    // Cleanup
    return () => {
      unsubscribe();
      sessionManager.stop();
    };
  }, [onTimeout, onRefreshError]);

  // Update countdown timer
  useEffect(() => {
    if (!isWarningVisible) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = sessionManager.getTimeUntilTimeout();
      setTimeUntilTimeout(remaining);

      if (remaining <= 0) {
        setIsWarningVisible(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWarningVisible]);

  // Extend session handler
  const extendSession = useCallback(() => {
    sessionManager.extendSession();
    setIsWarningVisible(false);
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    sessionManager.stop();
    setIsWarningVisible(false);
  }, []);

  return {
    isWarningVisible,
    timeUntilTimeout,
    extendSession,
    logout,
  };
}
