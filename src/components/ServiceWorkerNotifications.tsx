/**
 * Service Worker Notifications Component
 * Shows notifications for updates, offline status, and install prompts
 * Requirements: 8.5 - Service worker for offline support
 */

import { useEffect } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WifiOff, Download, RefreshCw } from 'lucide-react';

export function ServiceWorkerNotifications() {
  const { isSupported, isUpdateAvailable, isOffline, canInstall, skipWaiting, install } =
    useServiceWorker();

  // Show offline notification (disabled - removed online/offline notifications)
  // useEffect(() => {
  //   if (!isSupported) return;

  //   if (isOffline) {
  //     toast.info('You are offline', {
  //       description: 'Some features may be limited. Cached content is still available.',
  //       icon: <WifiOff className="h-4 w-4" />,
  //       duration: 5000,
  //     });
  //   } else {
  //     toast.success('You are back online', {
  //       description: 'All features are now available.',
  //       duration: 3000,
  //     });
  //   }
  // }, [isOffline, isSupported]);

  // Show update notification
  useEffect(() => {
    if (!isSupported || !isUpdateAvailable) return;

    toast.info('Update available', {
      description: 'A new version of the app is available.',
      icon: <RefreshCw className="h-4 w-4" />,
      duration: Infinity,
      action: {
        label: 'Update',
        onClick: skipWaiting,
      },
    });
  }, [isUpdateAvailable, skipWaiting, isSupported]);

  // Show install prompt
  useEffect(() => {
    if (!isSupported || !canInstall) return;

    // Show install prompt after a delay
    const timer = setTimeout(() => {
      toast.info('Install app', {
        description: 'Install this app for a better experience and offline access.',
        icon: <Download className="h-4 w-4" />,
        duration: 10000,
        action: {
          label: 'Install',
          onClick: async () => {
            const accepted = await install();
            if (accepted) {
              toast.success('App installed successfully!');
            }
          },
        },
      });
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, [canInstall, install, isSupported]);

  return null; // This component only manages notifications
}
