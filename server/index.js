import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { validateEnv, printEnvInfo } from './config/env-validator.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { sanitizeAll, blockSqlInjection } from './middleware/sanitization.js';
import { helmetConfig, cspViolationLogger } from './middleware/helmet.js';
import { csrfErrorHandler } from './middleware/csrf.js';
import { logger, httpLogger } from './utils/logger.js';
import healthRoutes from './routes/health.js';
import emailRoutes from './routes/email.js';
import socialMediaRoutes from './routes/socialMedia.js';
import adsenseRoutes from './routes/adsense.js';
import contentRoutes from './routes/content.js';
import contactRoutes from './routes/contactForm.js';
import publicMediaRoutes from './routes/publicMedia.js';
import musicRoutes from './routes/music.js';
import {
  globalErrorHandler,
  notFoundHandler,
  timeoutHandler,
  setupUnhandledRejectionHandler,
  setupUncaughtExceptionHandler,
} from './middleware/errorHandler.js';
import { enforceHttps } from './middleware/httpsRedirect.js';

// Load environment variables
dotenv.config();

// Setup global error handlers for unhandled rejections and exceptions
// Requirement 24.5: Error logging
setupUnhandledRejectionHandler();
setupUncaughtExceptionHandler();

// Validate environment variables before starting server
try {
  validateEnv();
  if (process.env.NODE_ENV === 'development') {
    printEnvInfo();
  }
} catch (error) {
  logger.error('Failed to start server due to environment validation errors', {
    error: error.message,
  });
  process.exit(1);
}

const app = express();

// Trust proxy - important for rate limiting to work correctly behind proxies
app.set('trust proxy', 1);

// Enforce HTTPS in production
// Requirements: 4.1 - Enforce HTTPS in production environments
app.use(
  enforceHttps({
    enabled: process.env.NODE_ENV === 'production',
    excludePaths: ['/health', '/api/health'],
  })
);

// Apply helmet security headers (CSP, XSS protection, clickjacking defense)
// Requirements: 25.1 - Content Security Policy and security headers
app.use(helmetConfig);

// CSP violation reporting endpoint
app.use(cspViolationLogger);

app.use(express.json());
app.use(cookieParser());

// Allow CORS from Vite dev server and local testing
// Support multiple frontend ports for development flexibility
const allowedOrigins = [
  'http://localhost:8092',
  'http://localhost:8093',
  'http://localhost:8094',
  'http://localhost:8095',
  'http://localhost:8096',
  'http://[::]:8092',
  'http://[::]:8093',
  'http://[::]:8094',
  'http://[::]:8095',
  'http://[::]:8096',
  'http://127.0.0.1:8092',
  'http://127.0.0.1:8093',
  'http://127.0.0.1:8094',
  'http://127.0.0.1:8095',
  'http://127.0.0.1:8096',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Log CORS rejection in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[CORS] Rejected origin: ${origin}`);
        }
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Cookie'],
  })
);

// Apply input sanitization to all routes
// This prevents XSS attacks by sanitizing all user input
app.use(sanitizeAll());

// Block potential SQL injection attempts
// Note: Always use parameterized queries as primary defense
app.use(blockSqlInjection());

// HTTP request logging
// Requirement 24.5: Error logging
app.use(httpLogger);

// Request timeout handler
// Requirement 24.4: Timeout handling
app.use(timeoutHandler(30000)); // 30 second timeout

const PORT = process.env.PORT || 3001;



// ============================================
// Health Check Endpoints (NO MIDDLEWARE)
// ============================================

/**
 * Health check routes
 * Requirements: 4.5, 7.5 - Configure health checks and alerts
 * Note: These routes are mounted before other middleware to ensure they always work
 */
app.use(healthRoutes);

/**
 * Email routes
 * Requirements: 29.1, 29.2, 29.3, 29.4, 29.5 - Email configuration and sending
 */
app.use('/api/email', emailRoutes);

/**
 * Social Media routes
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5 - Social media integration
 */
app.use('/api/social-media', socialMediaRoutes);

/**
 * AdSense routes
 * Requirements: 28.1, 28.2, 28.3, 28.4, 28.5 - Google AdSense integration
 */
app.use('/api/adsense', adsenseRoutes);

/**
 * Content routes (public)
 * Requirements: 2.1, 2.2, 2.3, 2.4 - Public content access
 */
app.use('/api/content', contentRoutes);

/**
 * Contact form route (public)
 * Requirements: 4.2, 29.x - send inquiries via email
 */
app.use('/api/contact', contactRoutes);



/**
 * Public media routes (no authentication required)
 * Requirements: 2.3 - Serve media files
 */
app.use('/api/media', publicMediaRoutes);

/**
 * Music routes
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */
app.use('/api/music', musicRoutes);











// ============================================
// Error Handlers
// ============================================

// CSRF error handler must be added after all routes
app.use(csrfErrorHandler);

// 404 handler - must be before global error handler
// Requirement 24.1: Global error handler
app.use(notFoundHandler);

// Global error handler - must be last
// Requirements: 24.1, 24.2, 24.3, 24.4, 24.5
app.use(globalErrorHandler);

app.listen(PORT, async () => {
  logger.info(`Admin auth server running on http://localhost:${PORT}`);
  logger.info('Security features enabled:', {
    features: [
      'Content Security Policy (CSP)',
      'XSS protection headers',
      'Clickjacking protection (X-Frame-Options)',
      'Input sanitization (XSS prevention)',
      'SQL injection detection',
      'Rate limiting',
      'JWT authentication',
      'Role-based access control',
      'CSRF protection',
      'Global error handling',
      'Request logging',
      'Timeout handling',
    ],
  });

  // Initialize data directory before service initialization
  // Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5
  try {
    logger.info('[Startup] Initializing data directory...');
    const { initializeDataDirectory } = await import('./utils/initDataDirectory.js');
    const initResult = await initializeDataDirectory();

    if (initResult.success) {
      logger.info('[Startup] ✓ Data directory initialized successfully', {
        created: initResult.created.length,
        validated: initResult.validated.length,
      });
    } else {
      logger.warn('[Startup] ⚠ Data directory initialization completed with errors', {
        errors: initResult.errors.length,
        details: initResult.errors,
      });
    }
  } catch (error) {
    logger.error('[Startup] ✗ Failed to initialize data directory', {
      error: error.message,
      stack: error.stack,
    });
    // Continue server startup even if initialization fails
    logger.warn('[Startup] Continuing server startup despite initialization failure');
  }

  // Warm up content cache on server start
  // Wrap in try-catch with detailed logging to ensure server starts even if cache warming fails
  // Requirements: 1.1, 1.2, 1.3
  try {
    logger.info('[Startup] Warming content cache...');
    const contentService = (await import('./services/contentService.js')).default;
    await contentService.warmCache();
    logger.info('[Startup] ✓ Content cache warmed successfully');
  } catch (error) {
    logger.error('[Startup] ✗ Failed to warm content cache', {
      error: error.message,
      stack: error.stack,
    });
    // Continue server startup even if cache warming fails
    logger.warn(
      '[Startup] Server will continue with cold cache - content will be loaded on first request'
    );
  }

  // Startup health check logging
  // Requirements: 7.5
  logger.info('[Startup] ✓ Server startup complete', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
  logger.info('[Startup] Server is ready to accept requests');
});
