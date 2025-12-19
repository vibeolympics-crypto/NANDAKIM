/**
 * Client-Side Monitoring and Performance Tracking
 * Requirements: 4.5, 7.5
 *
 * Provides:
 * - Performance monitoring
 * - Error tracking integration
 * - User analytics
 * - Custom metrics
 */

/**
 * Performance metric types
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Error tracking context
 */
export interface ErrorContext {
  user?: {
    id?: string;
    username?: string;
    role?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of events to track
  enablePerformance: boolean;
  enableErrors: boolean;
  enableUserTracking: boolean;
}

/**
 * Monitoring class
 */
class Monitoring {
  private config: MonitoringConfig;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics in memory

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      enablePerformance: true,
      enableErrors: true,
      enableUserTracking: false,
      ...config,
    };

    // Initialize error tracking if available
    if (this.config.enabled && this.config.enableErrors) {
      this.initializeErrorTracking();
    }

    // Initialize performance monitoring
    if (this.config.enabled && this.config.enablePerformance) {
      this.initializePerformanceMonitoring();
    }
  }

  /**
   * Initialize error tracking (Sentry, etc.)
   * Requirement 4.5, 7.5: Set up error tracking
   */
  private initializeErrorTracking(): void {
    // Check if Sentry is available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      console.log('[Monitoring] Sentry error tracking initialized');

      // Set up global error handler
      window.addEventListener('error', (event) => {
        this.captureError(event.error, {
          extra: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      // Set up unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(event.reason, {
          extra: {
            promise: 'unhandled rejection',
          },
        });
      });
    }
  }

  /**
   * Initialize performance monitoring
   * Requirement 4.5, 7.5: Add performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.capturePageLoadMetrics();
      }, 0);
    });

    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.captureNavigationTiming(entry as PerformanceNavigationTiming);
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.captureResourceTiming(entry as PerformanceResourceTiming);
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });

        // Observe long tasks (> 50ms)
        if ('PerformanceLongTaskTiming' in window) {
          const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              this.captureLongTask(entry);
            }
          });
          longTaskObserver.observe({ entryTypes: ['longtask'] });
        }
      } catch (error) {
        console.warn('[Monitoring] Failed to initialize PerformanceObserver:', error);
      }
    }
  }

  /**
   * Capture page load metrics
   */
  private capturePageLoadMetrics(): void {
    if (!window.performance || !window.performance.timing) {
      return;
    }

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    // Calculate key metrics
    const metrics = {
      // Time to first byte
      ttfb: timing.responseStart - timing.requestStart,
      // DOM content loaded
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      // Page load complete
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      // DOM processing
      domProcessing: timing.domComplete - timing.domLoading,
      // DNS lookup
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      // TCP connection
      tcpConnection: timing.connectEnd - timing.connectStart,
      // Server response
      serverResponse: timing.responseEnd - timing.requestStart,
    };

    // Track metrics
    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.trackMetric({
          name: `page.${name}`,
          value,
          unit: 'ms',
          timestamp: Date.now(),
          tags: {
            navigationType: navigation.type.toString(),
          },
        });
      }
    });

    // Log slow page loads
    if (metrics.loadComplete > 3000) {
      console.warn('[Monitoring] Slow page load detected:', {
        loadComplete: `${metrics.loadComplete}ms`,
        ttfb: `${metrics.ttfb}ms`,
        domContentLoaded: `${metrics.domContentLoaded}ms`,
      });
    }
  }

  /**
   * Capture navigation timing
   */
  private captureNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      domProcessing: entry.domComplete - entry.domInteractive,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.trackMetric({
          name: `navigation.${name}`,
          value,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Capture resource timing
   */
  private captureResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;

    // Only track slow resources (> 1 second)
    if (duration > 1000) {
      this.trackMetric({
        name: 'resource.slow',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: {
          url: entry.name,
          type: entry.initiatorType,
        },
      });

      console.warn('[Monitoring] Slow resource detected:', {
        url: entry.name,
        duration: `${duration}ms`,
        type: entry.initiatorType,
      });
    }
  }

  /**
   * Capture long tasks
   */
  private captureLongTask(entry: PerformanceEntry): void {
    this.trackMetric({
      name: 'task.long',
      value: entry.duration,
      unit: 'ms',
      timestamp: Date.now(),
    });

    console.warn('[Monitoring] Long task detected:', {
      duration: `${entry.duration}ms`,
      startTime: entry.startTime,
    });
  }

  /**
   * Track custom metric
   * Requirement 4.5, 7.5: Add performance monitoring
   */
  trackMetric(metric: PerformanceMetric): void {
    if (!this.config.enabled || !this.config.enablePerformance) {
      return;
    }

    // Sample rate check
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // Add to metrics array
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Monitoring] Metric:', metric);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendMetricToService(metric);
    }
  }

  /**
   * Send metric to monitoring service
   */
  private sendMetricToService(metric: PerformanceMetric): void {
    // Implement integration with monitoring service
    // Example: DataDog, New Relic, etc.

    // For now, just log
    if (process.env.NODE_ENV === 'production') {
      // You can send to your monitoring endpoint
      // fetch('/api/metrics', {
      //   method: 'POST',
      //   body: JSON.stringify(metric),
      // });
    }
  }

  /**
   * Capture error
   * Requirement 4.5, 7.5: Log errors and security events
   */
  captureError(error: Error, context?: ErrorContext): void {
    if (!this.config.enabled || !this.config.enableErrors) {
      return;
    }

    // Log to console
    console.error('[Monitoring] Error captured:', error, context);

    // Send to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        (window as any).Sentry.captureException(error, {
          user: context?.user,
          tags: context?.tags,
          extra: context?.extra,
        });
      } catch (sentryError) {
        console.error('[Monitoring] Failed to send error to Sentry:', sentryError);
      }
    }
  }

  /**
   * Capture message
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ): void {
    if (!this.config.enabled) {
      return;
    }

    console.log(`[Monitoring] ${level.toUpperCase()}:`, message, context);

    // Send to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        (window as any).Sentry.captureMessage(message, {
          level,
          user: context?.user,
          tags: context?.tags,
          extra: context?.extra,
        });
      } catch (sentryError) {
        console.error('[Monitoring] Failed to send message to Sentry:', sentryError);
      }
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; username?: string; role?: string } | null): void {
    if (!this.config.enabled || !this.config.enableUserTracking) {
      return;
    }

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        (window as any).Sentry.setUser(user);
      } catch (error) {
        console.error('[Monitoring] Failed to set user context:', error);
      }
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.config.enabled) {
      return;
    }

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        (window as any).Sentry.addBreadcrumb({
          message,
          category,
          data,
          timestamp: Date.now() / 1000,
        });
      } catch (error) {
        console.error('[Monitoring] Failed to add breadcrumb:', error);
      }
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }
}

/**
 * Default monitoring instance
 */
export const monitoring = new Monitoring({
  enabled: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
  enablePerformance: true,
  enableErrors: true,
  enableUserTracking: false,
});

/**
 * Convenience exports
 */
export const trackMetric = (metric: PerformanceMetric) => monitoring.trackMetric(metric);
export const captureError = (error: Error, context?: ErrorContext) =>
  monitoring.captureError(error, context);
export const captureMessage = (
  message: string,
  level?: 'info' | 'warning' | 'error',
  context?: ErrorContext
) => monitoring.captureMessage(message, level, context);
export const setUser = (user: { id?: string; username?: string; role?: string } | null) =>
  monitoring.setUser(user);
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) =>
  monitoring.addBreadcrumb(message, category, data);

export default monitoring;
