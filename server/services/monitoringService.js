/**
 * Monitoring Service
 * Provides system health monitoring and metrics collection
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Metrics storage
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: {},
  },
  performance: {
    responseTime: [],
    slowRequests: [],
  },
  system: {
    startTime: Date.now(),
    lastCheck: Date.now(),
  },
  errors: [],
};

/**
 * Record a request
 */
export function recordRequest(endpoint, method, statusCode, responseTime) {
  metrics.requests.total++;

  if (statusCode >= 200 && statusCode < 400) {
    metrics.requests.success++;
  } else {
    metrics.requests.errors++;
  }

  // Track by endpoint
  const key = `${method} ${endpoint}`;
  if (!metrics.requests.byEndpoint[key]) {
    metrics.requests.byEndpoint[key] = {
      count: 0,
      errors: 0,
      avgResponseTime: 0,
    };
  }

  const endpointMetrics = metrics.requests.byEndpoint[key];
  endpointMetrics.count++;

  if (statusCode >= 400) {
    endpointMetrics.errors++;
  }

  // Update average response time
  const currentAvg = endpointMetrics.avgResponseTime;
  const count = endpointMetrics.count;
  endpointMetrics.avgResponseTime = (currentAvg * (count - 1) + responseTime) / count;

  // Record response time
  metrics.performance.responseTime.push({
    endpoint: key,
    time: responseTime,
    timestamp: Date.now(),
  });

  // Keep only last 1000 response times
  if (metrics.performance.responseTime.length > 1000) {
    metrics.performance.responseTime.shift();
  }

  // Track slow requests (> 1 second)
  if (responseTime > 1000) {
    metrics.performance.slowRequests.push({
      endpoint: key,
      time: responseTime,
      timestamp: Date.now(),
    });

    // Keep only last 100 slow requests
    if (metrics.performance.slowRequests.length > 100) {
      metrics.performance.slowRequests.shift();
    }
  }
}

/**
 * Record an error
 */
export function recordError(error, context = {}) {
  metrics.errors.push({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: Date.now(),
  });

  // Keep only last 100 errors
  if (metrics.errors.length > 100) {
    metrics.errors.shift();
  }
}

/**
 * Get system health status
 */
export function getHealthStatus() {
  const uptime = Date.now() - metrics.system.startTime;
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  // Calculate error rate
  const errorRate =
    metrics.requests.total > 0 ? (metrics.requests.errors / metrics.requests.total) * 100 : 0;

  // Calculate average response time
  const avgResponseTime =
    metrics.performance.responseTime.length > 0
      ? metrics.performance.responseTime.reduce((sum, r) => sum + r.time, 0) /
        metrics.performance.responseTime.length
      : 0;

  // Determine health status
  let status = 'healthy';
  const issues = [];

  if (errorRate > 10) {
    status = 'degraded';
    issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
  }

  if (avgResponseTime > 1000) {
    status = 'degraded';
    issues.push(`Slow response time: ${avgResponseTime.toFixed(0)}ms`);
  }

  if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
    status = 'degraded';
    issues.push('High memory usage');
  }

  if (errorRate > 50 || avgResponseTime > 5000) {
    status = 'unhealthy';
  }

  return {
    status,
    uptime,
    timestamp: Date.now(),
    metrics: {
      requests: {
        total: metrics.requests.total,
        success: metrics.requests.success,
        errors: metrics.requests.errors,
        errorRate: errorRate.toFixed(2) + '%',
      },
      performance: {
        avgResponseTime: avgResponseTime.toFixed(0) + 'ms',
        slowRequests: metrics.performance.slowRequests.length,
      },
      memory: {
        used: formatBytes(memoryUsage.heapUsed),
        total: formatBytes(memoryUsage.heapTotal),
        percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1) + '%',
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
      },
    },
    issues,
  };
}

/**
 * Get detailed metrics
 */
export function getMetrics() {
  return {
    requests: {
      ...metrics.requests,
      byEndpoint: Object.entries(metrics.requests.byEndpoint).map(([endpoint, data]) => ({
        endpoint,
        ...data,
        errorRate: data.count > 0 ? ((data.errors / data.count) * 100).toFixed(2) + '%' : '0%',
      })),
    },
    performance: {
      avgResponseTime:
        metrics.performance.responseTime.length > 0
          ? (
              metrics.performance.responseTime.reduce((sum, r) => sum + r.time, 0) /
              metrics.performance.responseTime.length
            ).toFixed(0) + 'ms'
          : '0ms',
      slowRequests: metrics.performance.slowRequests.length,
      recentSlowRequests: metrics.performance.slowRequests.slice(-10),
    },
    errors: {
      total: metrics.errors.length,
      recent: metrics.errors.slice(-10),
    },
    system: {
      uptime: Date.now() - metrics.system.startTime,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  };
}

/**
 * Get system information
 */
export function getSystemInfo() {
  return {
    os: {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
    },
    cpu: {
      model: os.cpus()[0].model,
      cores: os.cpus().length,
      speed: os.cpus()[0].speed,
      loadAverage: os.loadavg(),
    },
    memory: {
      total: formatBytes(os.totalmem()),
      free: formatBytes(os.freemem()),
      used: formatBytes(os.totalmem() - os.freemem()),
      percentage: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1) + '%',
    },
    process: {
      pid: process.pid,
      version: process.version,
      uptime: process.uptime(),
      memory: {
        rss: formatBytes(process.memoryUsage().rss),
        heapTotal: formatBytes(process.memoryUsage().heapTotal),
        heapUsed: formatBytes(process.memoryUsage().heapUsed),
        external: formatBytes(process.memoryUsage().external),
      },
    },
  };
}

/**
 * Reset metrics
 */
export function resetMetrics() {
  metrics.requests = {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: {},
  };
  metrics.performance = {
    responseTime: [],
    slowRequests: [],
  };
  metrics.errors = [];
  metrics.system.lastCheck = Date.now();
}

/**
 * Export metrics to file
 */
export function exportMetrics(filePath) {
  const data = {
    timestamp: new Date().toISOString(),
    health: getHealthStatus(),
    metrics: getMetrics(),
    system: getSystemInfo(),
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Monitoring middleware
 */
export function monitoringMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
      const responseTime = Date.now() - startTime;
      recordRequest(req.path, req.method, res.statusCode, responseTime);
      originalSend.call(this, data);
    };

    next();
  };
}

export default {
  recordRequest,
  recordError,
  getHealthStatus,
  getMetrics,
  getSystemInfo,
  resetMetrics,
  exportMetrics,
  monitoringMiddleware,
};
