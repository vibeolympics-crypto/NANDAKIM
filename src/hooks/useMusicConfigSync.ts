/**
 * Music Configuration Sync Hook
 * Provides real-time synchronization of music player configuration
 * Requirements: Real-time config updates between admin panel and public player
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface MusicConfig {
  enabled: boolean;
  autoplay: boolean;
  defaultVolume: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'floating';
  playbackMode: 'random' | 'sequential';
  visibility?: {
    showOnWeb: boolean;
    showOnMobile: boolean;
  };
}

interface UseMusicConfigSyncOptions {
  pollInterval?: number; // Polling interval in milliseconds (default: 30000 = 30 seconds)
  onConfigChange?: (config: MusicConfig) => void;
  enabled?: boolean; // Enable/disable polling (default: true)
}

interface UseMusicConfigSyncReturn {
  config: MusicConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const DEFAULT_CONFIG: MusicConfig = {
  enabled: false,
  autoplay: false,
  defaultVolume: 70,
  position: 'bottom-right',
  playbackMode: 'random',
  visibility: {
    showOnWeb: true,
    showOnMobile: true,
  },
};

/**
 * Hook for syncing music player configuration
 * Polls the server at regular intervals to detect configuration changes
 *
 * @param options - Configuration options
 * @returns Music configuration state and control functions
 */
export function useMusicConfigSync(
  options: UseMusicConfigSyncOptions = {}
): UseMusicConfigSyncReturn {
  const {
    pollInterval = 30000, // 30 seconds default
    onConfigChange,
    enabled = true,
  } = options;

  const [config, setConfig] = useState<MusicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousConfigRef = useRef<string | null>(null);

  /**
   * Fetch configuration from server
   */
  const fetchConfig = useCallback(async () => {
    try {
      // Use public playlist endpoint instead of admin-only config endpoint
      const response = await fetch('/api/music/playlist');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle both response formats: { ok, data } and direct { config, tracks }
      const newConfig = data.data?.config || data.config;

      if (newConfig) {
        const newConfigStr = JSON.stringify(newConfig);

        // Check if configuration has changed
        if (previousConfigRef.current !== newConfigStr) {
          setConfig(newConfig);
          setLastUpdated(new Date());
          previousConfigRef.current = newConfigStr;

          // Notify callback if provided
          if (onConfigChange) {
            onConfigChange(newConfig);
          }

          // Log change in development
          if (process.env.NODE_ENV === 'development') {
            console.log('[MusicConfigSync] Configuration updated:', newConfig);
          }
        }

        setError(null);
      } else {
        throw new Error('No configuration found in response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);

      // Use default config on error
      if (!config) {
        setConfig(DEFAULT_CONFIG);
      }

      console.error('[MusicConfigSync] Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  }, [onConfigChange]); // 수정: config 제거, onConfigChange만 유지

  /**
   * Start polling for configuration changes
   */
  const startPolling = useCallback(() => {
    if (!enabled) return;

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Set up new polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchConfig();
    }, pollInterval);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[MusicConfigSync] Polling started (interval: ${pollInterval}ms)`);
    }
  }, [enabled, pollInterval, fetchConfig]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;

      if (process.env.NODE_ENV === 'development') {
        console.log('[MusicConfigSync] Polling stopped');
      }
    }
  }, []);

  /**
   * Manual refetch
   */
  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchConfig();
  }, [fetchConfig]);

  // Initial fetch only (polling disabled to prevent infinite refresh loops)
  // Music config is typically set in admin panel and doesn't change frequently
  useEffect(() => {
    fetchConfig();
    // Polling disabled - only fetch on mount and on manual refetch
    // This prevents the infinite refresh issue caused by repeated API calls
  }, [fetchConfig]);

  // No visibility change listener needed since polling is disabled

  return {
    config,
    loading,
    error,
    refetch,
    lastUpdated,
  };
}
