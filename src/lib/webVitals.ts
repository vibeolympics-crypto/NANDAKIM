/**
 * Web Vitals Integration
 * Measures and reports Core Web Vitals metrics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export interface WebVitalsMetrics {
  fcp?: number;
  lcp?: number;
  cls?: number;
  inp?: number; // Interaction to Next Paint (replaces FID)
  ttfb?: number;
}

export interface WebVitalsReport extends WebVitalsMetrics {
  timestamp: number;
  url: string;
  userAgent: string;
}

type MetricHandler = (metric: Metric) => void;

const metrics: WebVitalsMetrics = {};

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
  // Store metric
  metrics[metric.name.toLowerCase() as keyof WebVitalsMetrics] = metric.value;

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Send to analytics endpoint (if configured)
  const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (analyticsEndpoint) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });

    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(analyticsEndpoint, body);
    } else {
      fetch(analyticsEndpoint, {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch((error) => {
        // Silent failure - analytics is optional
        if (import.meta.env.DEV) {
          console.warn('[Web Vitals] Failed to send analytics:', error.message);
        }
      });
    }
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(onReport?: (report: WebVitalsReport) => void) {
  const handler: MetricHandler = (metric) => {
    sendToAnalytics(metric);

    // Call custom report handler if provided
    if (onReport) {
      onReport({
        ...metrics,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  };

  // Register all Core Web Vitals
  onCLS(handler);
  onFCP(handler);
  onINP(handler); // Interaction to Next Paint (replaces FID)
  onLCP(handler);
  onTTFB(handler);
}

/**
 * Get current metrics snapshot
 */
export function getMetrics(): WebVitalsMetrics {
  return { ...metrics };
}

/**
 * Generate performance report
 */
export function generateReport(): WebVitalsReport {
  return {
    ...metrics,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
}

/**
 * Check if metrics meet performance thresholds
 */
export function checkThresholds(customMetrics?: WebVitalsMetrics): {
  passed: boolean;
  results: Record<string, { value: number; threshold: number; passed: boolean }>;
} {
  const metricsToCheck = customMetrics || metrics;

  const thresholds = {
    fcp: 1800, // First Contentful Paint < 1.8s
    lcp: 2500, // Largest Contentful Paint < 2.5s
    cls: 0.1, // Cumulative Layout Shift < 0.1
    inp: 200, // Interaction to Next Paint < 200ms
    ttfb: 600, // Time to First Byte < 600ms
  };

  const results: Record<string, { value: number; threshold: number; passed: boolean }> = {};
  let allPassed = true;

  for (const [key, threshold] of Object.entries(thresholds)) {
    const value = metricsToCheck[key as keyof WebVitalsMetrics];
    if (value !== undefined) {
      const passed = value <= threshold;
      results[key] = { value, threshold, passed };
      if (!passed) allPassed = false;
    }
  }

  return { passed: allPassed, results };
}
