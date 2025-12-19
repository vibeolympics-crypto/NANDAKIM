/**
 * Service Worker Registration Utility
 * Handles registration, updates, and lifecycle management
 * Requirements: 8.5 - Implement service worker for offline support
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Register the service worker
 */
export function register(config?: ServiceWorkerConfig): void {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // Wait for the page to load
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';

      registerValidSW(swUrl, config);

      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('[SW] Back online');
        config?.onOnline?.();
      });

      window.addEventListener('offline', () => {
        console.log('[SW] Gone offline');
        config?.onOffline?.();
      });
    });
  }
}

/**
 * Register a valid service worker
 */
async function registerValidSW(swUrl: string, config?: ServiceWorkerConfig): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);

    console.log('[SW] Service Worker registered:', registration);

    // Check for updates on page load
    registration.update();

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) {
        return;
      }

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content is available
            console.log('[SW] New content is available; please refresh.');
            config?.onUpdate?.(registration);
          } else {
            // Content is cached for offline use
            console.log('[SW] Content is cached for offline use.');
            config?.onSuccess?.(registration);
          }
        }
      });
    });

    // Check for updates every hour
    setInterval(
      () => {
        registration.update();
      },
      60 * 60 * 1000
    );
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
  }
}

/**
 * Unregister the service worker
 */
export async function unregister(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
    } catch (error) {
      console.error('[SW] Service Worker unregistration failed:', error);
    }
  }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Clear all caches
 */
export async function clearCaches(): Promise<void> {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      console.log('[SW] All caches cleared');
    } catch (error) {
      console.error('[SW] Failed to clear caches:', error);
    }
  }
}

/**
 * Check if service worker is supported
 */
export function isSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Get current service worker registration
 */
export async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.getRegistration();
  }
  return undefined;
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Prompt user to install PWA
 */
export function setupInstallPrompt(onInstallPrompt?: (event: Event) => void): () => void {
  let deferredPrompt: any = null;

  const beforeInstallHandler = (event: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = event;
    // Notify the app that install prompt is available
    onInstallPrompt?.(event);
  };

  window.addEventListener('beforeinstallprompt', beforeInstallHandler);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
  };
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
  const deferredPrompt = (window as any).deferredPrompt;

  if (!deferredPrompt) {
    console.log('[SW] Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;

  console.log(`[SW] User response to install prompt: ${outcome}`);

  // Clear the deferredPrompt
  (window as any).deferredPrompt = null;

  return outcome === 'accepted';
}
