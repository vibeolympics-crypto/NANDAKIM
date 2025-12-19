/**
 * HTTPS Redirect Middleware
 *
 * This middleware enforces HTTPS in production by redirecting all HTTP requests
 * to their HTTPS equivalents.
 *
 * Requirements: 4.1 - Enforce HTTPS in production environments
 */

/**
 * Middleware to redirect HTTP requests to HTTPS in production
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable HTTPS redirect (default: true in production)
 * @param {number} options.statusCode - HTTP status code for redirect (default: 301)
 * @param {Array<string>} options.excludePaths - Paths to exclude from redirect (e.g., health checks)
 * @returns {Function} Express middleware function
 */
export function httpsRedirect(options = {}) {
  const {
    enabled = process.env.NODE_ENV === 'production',
    statusCode = 301, // 301 = permanent redirect, 302 = temporary redirect
    excludePaths = ['/health', '/api/health'],
  } = options;

  return function (req, res, next) {
    // Skip if HTTPS redirect is disabled
    if (!enabled) {
      return next();
    }

    // Skip for excluded paths (e.g., health checks)
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Check if request is already secure
    // Handle both direct HTTPS and proxied HTTPS (X-Forwarded-Proto header)
    const isSecure =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      req.headers['x-forwarded-ssl'] === 'on';

    if (!isSecure) {
      // Construct HTTPS URL
      const host = req.headers.host || req.hostname;
      const httpsUrl = `https://${host}${req.url}`;

      // Log redirect for monitoring
      console.log(`[HTTPS Redirect] ${req.method} ${req.url} -> ${httpsUrl}`);

      // Redirect to HTTPS
      return res.redirect(statusCode, httpsUrl);
    }

    // Request is already secure, continue
    next();
  };
}

/**
 * Middleware to set Strict-Transport-Security header
 * This tells browsers to always use HTTPS for future requests
 *
 * Note: This is also handled by helmet.js, but can be used independently
 *
 * @param {Object} options - HSTS configuration
 * @param {number} options.maxAge - Max age in seconds (default: 1 year)
 * @param {boolean} options.includeSubDomains - Include subdomains (default: true)
 * @param {boolean} options.preload - Enable HSTS preload (default: true)
 * @returns {Function} Express middleware function
 */
export function hstsHeader(options = {}) {
  const {
    maxAge = 31536000, // 1 year in seconds
    includeSubDomains = true,
    preload = true,
  } = options;

  return function (req, res, next) {
    // Only set HSTS header on HTTPS connections
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (isSecure) {
      let hstsValue = `max-age=${maxAge}`;

      if (includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }

      if (preload) {
        hstsValue += '; preload';
      }

      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    next();
  };
}

/**
 * Combined HTTPS enforcement middleware
 * Redirects HTTP to HTTPS and sets HSTS header
 *
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
export function enforceHttps(options = {}) {
  const redirect = httpsRedirect(options);
  const hsts = hstsHeader(options.hsts || {});

  return function (req, res, next) {
    redirect(req, res, (err) => {
      if (err) return next(err);
      hsts(req, res, next);
    });
  };
}

export default httpsRedirect;
