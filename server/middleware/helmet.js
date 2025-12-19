/**
 * Helmet.js Security Middleware Configuration
 *
 * This module configures helmet.js to provide comprehensive security headers
 * including Content Security Policy (CSP), XSS protection, and clickjacking defense.
 *
 * Requirements: 25.1
 * - Content Security Policy headers to prevent unauthorized script execution
 * - XSS protection headers
 * - Clickjacking protection via X-Frame-Options
 */

import helmet from 'helmet';

/**
 * Configure Content Security Policy
 *
 * CSP helps prevent XSS attacks by controlling which resources can be loaded
 * and executed on the page.
 */
const cspConfig = {
  directives: {
    // Default fallback for all resource types
    defaultSrc: ["'self'"],

    // Scripts: Allow self and inline scripts (needed for React/Vite)
    // In production, consider using nonces or hashes instead of 'unsafe-inline'
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Vite HMR in development
      "'unsafe-eval'", // Required for Vite in development
    ],

    // Styles: Allow self and inline styles (needed for styled components)
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
      'https://fonts.googleapis.com', // Google Fonts (trusted source)
    ],

    // Fonts: Allow self and Google Fonts (with SRI verification recommended)
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'data:', // For inline fonts
    ],

    // Images: Allow self, data URIs, and external image sources
    imgSrc: [
      "'self'",
      'data:', // For inline images
      'blob:', // For dynamically generated images
      'https:', // Allow HTTPS images (for user uploads, CDN, etc.)
    ],

    // Media: Allow self and data URIs
    mediaSrc: ["'self'", 'data:', 'blob:'],

    // Connect: Allow self and API endpoints
    connectSrc: [
      "'self'",
      'http://localhost:*', // Development servers
      'ws://localhost:*', // WebSocket for HMR
      'wss://localhost:*', // Secure WebSocket
    ],

    // Frames: Restrict iframe sources (clickjacking protection)
    frameSrc: ["'self'"],

    // Objects: Disallow plugins like Flash
    objectSrc: ["'none'"],

    // Base URI: Restrict base tag to prevent base tag injection
    baseUri: ["'self'"],

    // Form actions: Restrict form submission targets
    formAction: ["'self'"],

    // Frame ancestors: Prevent embedding in iframes (clickjacking)
    frameAncestors: ["'none'"],

    // Upgrade insecure requests in production
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  },
};

/**
 * Development-specific CSP configuration
 * More permissive to allow Vite HMR and development tools
 */
const developmentCspConfig = {
  directives: {
    ...cspConfig.directives,
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'", // Required for Vite HMR
    ],
    connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*', 'wss://localhost:*'],
  },
};

/**
 * Production-specific CSP configuration
 * More restrictive for better security
 */
const productionCspConfig = {
  directives: {
    ...cspConfig.directives,
    scriptSrc: [
      "'self'",
      // In production, consider removing 'unsafe-inline' and using nonces
      "'unsafe-inline'",
    ],
    connectSrc: [
      "'self'",
      // Add your production API domains here
      process.env.API_DOMAIN || '',
    ].filter(Boolean),
    upgradeInsecureRequests: [],
  },
};

/**
 * Get the appropriate CSP configuration based on environment
 */
function getCspConfig() {
  return process.env.NODE_ENV === 'production' ? productionCspConfig : developmentCspConfig;
}

/**
 * Configure helmet with all security headers
 *
 * This includes:
 * - Content Security Policy (CSP)
 * - X-Content-Type-Options (prevents MIME sniffing)
 * - X-Frame-Options (clickjacking protection)
 * - X-XSS-Protection (legacy XSS protection)
 * - Strict-Transport-Security (HSTS)
 * - Referrer-Policy
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: getCspConfig(),

  // Prevent browsers from MIME-sniffing
  // This prevents browsers from interpreting files as a different MIME type
  noSniff: true,

  // Clickjacking protection
  // Prevents the page from being embedded in iframes
  frameguard: {
    action: 'deny', // Can also be 'sameorigin' if you need to embed your own pages
  },

  // XSS Protection (legacy, but still useful for older browsers)
  xssFilter: true,

  // HTTP Strict Transport Security (HSTS)
  // Forces browsers to use HTTPS
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // Referrer Policy
  // Controls how much referrer information is sent
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // IE No Open
  // Prevents IE from executing downloads in site's context
  ieNoOpen: true,
});

/**
 * Middleware to log CSP violations
 * This helps identify legitimate resources that are being blocked
 */
export function cspViolationLogger(req, res, next) {
  if (req.path === '/api/csp-violation-report') {
    console.warn('CSP Violation Report:', req.body);
    return res.status(204).end();
  }
  next();
}

/**
 * Export individual helmet middlewares for fine-grained control
 */
export const helmetMiddlewares = {
  contentSecurityPolicy: helmet.contentSecurityPolicy(getCspConfig()),
  noSniff: helmet.noSniff(),
  frameguard: helmet.frameguard({ action: 'deny' }),
  xssFilter: helmet.xssFilter(),
  hsts: helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }),
  referrerPolicy: helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }),
  hidePoweredBy: helmet.hidePoweredBy(),
};

export default helmetConfig;
