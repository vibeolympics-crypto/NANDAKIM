/**
 * Sentry Error Tracking Integration
 * Requirements: 4.5, 7.5
 *
 * Initializes Sentry for error tracking in production
 */

/**
 * Initialize Sentry
 * Only loads in production or when explicitly enabled
 */
export function initializeSentry(): void {
  // Only initialize in production or if explicitly enabled
  const shouldInitialize =
    import.meta.env.MODE === 'production' || import.meta.env.VITE_ENABLE_SENTRY === 'true';

  if (!shouldInitialize) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] Skipping initialization (not in production)');
    }
    return;
  }

  // Check if Sentry DSN is configured
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] DSN not configured, skipping initialization');
    }
    return;
  }

  // Dynamically import Sentry to avoid bundling in development
  // Use try-catch to handle case where @sentry/browser is not installed
  try {
    // Use Function constructor to avoid Vite trying to resolve at build time
    const importSentry = new Function('return import("@sentry/browser")');
    importSentry()
      .then((Sentry: any) => {
        Sentry.init({
          dsn,
          environment: import.meta.env.MODE || 'development',

          // Set sample rate for performance monitoring
          tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

          // Set sample rate for session replay
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,

          // Integrations
          integrations: [
            // Note: BrowserTracing and Replay require @sentry/browser to be installed
            // Uncomment when Sentry is properly configured
            // new Sentry.BrowserTracing({
            //   tracingOrigins: ['localhost', /^\//],
            // }),
            // new Sentry.Replay({
            //   maskAllText: true,
            //   blockAllMedia: true,
            // }),
          ],

          // Filter out sensitive data
          beforeSend(event, hint) {
            // Remove sensitive headers
            if (event.request?.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
              delete event.request.headers['x-csrf-token'];
            }

            // Remove sensitive data from breadcrumbs
            if (event.breadcrumbs) {
              event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
                if (breadcrumb.data) {
                  const data = { ...breadcrumb.data };

                  // Redact sensitive fields
                  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
                  sensitiveFields.forEach((field) => {
                    if (field in data) {
                      data[field] = '[REDACTED]';
                    }
                  });

                  return { ...breadcrumb, data };
                }
                return breadcrumb;
              });
            }

            return event;
          },

          // Ignore certain errors
          ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            'chrome-extension://',
            'moz-extension://',

            // Network errors that are expected
            'NetworkError',
            'Failed to fetch',
            'Load failed',

            // User cancelled actions
            'AbortError',
            'The user aborted a request',
          ],
        });

        if (import.meta.env.DEV) {
          console.log('[Sentry] Initialized successfully');
        }

        // Make Sentry available globally for monitoring
        if (typeof window !== 'undefined') {
          (window as any).Sentry = Sentry;
        }
      })
      .catch((error) => {
        // Silent failure - don't show errors to users
        if (import.meta.env.DEV) {
          console.warn('[Sentry] Failed to initialize:', error.message);
        }
      });
  } catch (error) {
    // Silent failure - don't show errors to users
    if (import.meta.env.DEV) {
      console.log('[Sentry] Package not installed, skipping initialization');
    }
  }
}

/**
 * Set user context in Sentry
 */
export function setSentryUser(
  user: { id?: string; username?: string; role?: string } | null
): void {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    try {
      (window as any).Sentry.setUser(user);
    } catch (error) {
      // Silent failure
      if (import.meta.env.DEV) {
        console.warn('[Sentry] Failed to set user:', error);
      }
    }
  }
}

/**
 * Capture exception in Sentry
 */
export function captureSentryException(error: Error, context?: Record<string, any>): void {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    try {
      (window as any).Sentry.captureException(error, context);
    } catch (sentryError) {
      // Silent failure
      if (import.meta.env.DEV) {
        console.warn('[Sentry] Failed to capture exception:', sentryError);
      }
    }
  }
}

/**
 * Capture message in Sentry
 */
export function captureSentryMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    try {
      (window as any).Sentry.captureMessage(message, level);
    } catch (error) {
      // Silent failure
      if (import.meta.env.DEV) {
        console.warn('[Sentry] Failed to capture message:', error);
      }
    }
  }
}
