/**
 * React Hook for Service Worker Management
 * Provides service worker state and controls
 * Requirements: 8.5 - Service worker for offline support
 */

import { useState, useEffect, useCallback } from 'react';
import * as serviceWorkerRegistration from '@/lib/serviceWorkerRegistration';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  isStandalone: boolean;
  canInstall: boolean;
}

interface ServiceWorkerControls {
  update: () => Promise<void>;
  skipWaiting: () => void;
  clearCaches: () => Promise<void>;
  install: () => Promise<boolean>;
}

export function useServiceWorker(): ServiceWorkerState & ServiceWorkerControls {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: serviceWorkerRegistration.isSupported(),
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: !navigator.onLine,
    isStandalone: serviceWorkerRegistration.isStandalone(),
    canInstall: false,
  });

  // Register service worker on mount
  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    serviceWorkerRegistration.register({
      onSuccess: () => {
        setState((prev) => ({ ...prev, isRegistered: true }));
      },
      onUpdate: () => {
        setState((prev) => ({ ...prev, isUpdateAvailable: true }));
      },
      onOffline: () => {
        setState((prev) => ({ ...prev, isOffline: true }));
      },
      onOnline: () => {
        setState((prev) => ({ ...prev, isOffline: false }));
      },
    });

    // Setup install prompt
    const cleanup = serviceWorkerRegistration.setupInstallPrompt(() => {
      setState((prev) => ({ ...prev, canInstall: true }));
    });

    return cleanup;
  }, [state.isSupported]);

  // Update service worker
  const update = useCallback(async () => {
    const registration = await serviceWorkerRegistration.getRegistration();
    if (registration) {
      await registration.update();
    }
  }, []);

  // Skip waiting and activate new service worker
  const skipWaiting = useCallback(() => {
    serviceWorkerRegistration.skipWaiting();
    setState((prev) => ({ ...prev, isUpdateAvailable: false }));
    // Reload page to use new service worker
    window.location.reload();
  }, []);

  // Clear all caches
  const clearCaches = useCallback(async () => {
    await serviceWorkerRegistration.clearCaches();
  }, []);

  // Install PWA
  const install = useCallback(async () => {
    const accepted = await serviceWorkerRegistration.showInstallPrompt();
    if (accepted) {
      setState((prev) => ({ ...prev, canInstall: false, isStandalone: true }));
    }
    return accepted;
  }, []);

  return {
    ...state,
    update,
    skipWaiting,
    clearCaches,
    install,
  };
}
