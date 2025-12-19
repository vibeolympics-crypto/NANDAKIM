/**
 * Session Timeout Hook
 * Tracks user activity and handles automatic logout with warning
 * Requirements: 4.4
 *
 * This hook provides a simplified interface for session timeout management:
 * - Tracks user activity automatically
 * - Shows warning at 25 minutes (5 minutes before timeout)
 * - Auto-logout at 30 minutes of inactivity
 */

import { useEffect, useState, useCallback } from 'react';
import { sessionManager, SessionEventType } from '../lib/auth/sessionManager';

export interface UseSessionTimeoutOptions {
  /**
   * Callback when session times out
   */
  onTimeout?: () => void;

  /**
   * Callback when warning is shown
   */
  onWarning?: (remainingSeconds: number) => void;

  /**
   * Whether to automatically start monitoring on mount
   * @default true
   */
  autoStart?: boolean;
}

export interface UseSessionTimeoutReturn {
  /**
   * Whether the warning dialog should be visible
   */
  isWarningVisible: boolean;

  /**
   * Time remaining until timeout (in seconds)
   */
  timeRemaining: number;

  /**
   * Extend the session (dismiss warning and reset timer)
   */
  extendSession: () => void;

  /**
   * Manually trigger logout
   */
  logout: () => void;

  /**
   * Whether session monitoring is active
   */
  isActive: boolean;
}

/**
 * Hook for managing session timeout with automatic logout
 *
 * @example
 * ```tsx
 * function AdminLayout() {
 *   const { isWarningVisible, timeRemaining, extendSession, logout } = useSessionTimeout({
 *     onTimeout: () => {
 *       // Clear auth state and redirect to login
 *       clearAuth();
 *       navigate('/admin/login');
 *     },
 *     onWarning: (seconds) => {
 *       console.log(`Session expiring in ${seconds} seconds`);
 *     }
 *   });
 *
 *   return (
 *     <>
 *       <div>Your admin content</div>
 *       {isWarningVisible && (
 *         <SessionWarningDialog
 *           timeRemaining={timeRemaining}
 *           onExtend={extendSession}
 *           onLogout={logout}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}): UseSessionTimeoutReturn {
  const { onTimeout, onWarning, autoStart = true } = options;

  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Handle session events
  useEffect(() => {
    const handleSessionEvent = (event: SessionEventType, data?: any) => {
      switch (event) {
        case 'warning': {
          // Warning shown at 25 minutes (5 minutes before 30-minute timeout)
          setIsWarningVisible(true);
          const remainingMs = data?.remainingTime || 0;
          const remainingSeconds = Math.floor(remainingMs / 1000);
          setTimeRemaining(remainingSeconds);

          if (onWarning) {
            onWarning(remainingSeconds);
          }
          break;
        }

        case 'timeout':
          // Auto-logout at 30 minutes
          setIsWarningVisible(false);
          setTimeRemaining(0);
          setIsActive(false);

          if (onTimeout) {
            onTimeout();
          }
          break;

        case 'activity':
          // User activity detected - reset warning if shown
          if (data?.extended || data?.started) {
            setIsWarningVisible(false);
            setIsActive(true);
          }
          break;
      }
    };

    // Register event handler
    const unsubscribe = sessionManager.on(handleSessionEvent);

    // Start session monitoring if autoStart is enabled
    if (autoStart && !sessionManager.isActive()) {
      sessionManager.start();
      setIsActive(true);
    }

    // Cleanup
    return () => {
      unsubscribe();
      // Note: We don't stop the session manager here as other components might be using it
    };
  }, [onTimeout, onWarning, autoStart]);

  // Update countdown timer every second when warning is visible
  useEffect(() => {
    if (!isWarningVisible) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = sessionManager.getTimeUntilTimeout();
      const remainingSeconds = Math.floor(remaining / 1000);
      setTimeRemaining(remainingSeconds);

      // Hide warning if time runs out
      if (remainingSeconds <= 0) {
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
    setIsActive(false);

    if (onTimeout) {
      onTimeout();
    }
  }, [onTimeout]);

  return {
    isWarningVisible,
    timeRemaining,
    extendSession,
    logout,
    isActive,
  };
}
