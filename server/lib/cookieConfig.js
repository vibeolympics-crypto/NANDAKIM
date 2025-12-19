/**
 * Cookie Configuration Helper
 *
 * Provides secure cookie configuration based on environment
 *
 * Requirements: 4.1 - Configure secure cookies
 */

/**
 * Get secure cookie options based on environment
 *
 * @param {Object} options - Additional cookie options
 * @param {number} options.maxAge - Cookie max age in milliseconds
 * @param {string} options.sameSite - SameSite attribute ('strict', 'lax', 'none')
 * @param {string} options.path - Cookie path
 * @returns {Object} Cookie options object
 */
export function getSecureCookieOptions(options = {}) {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true, // Prevent JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: options.sameSite || (isProduction ? 'strict' : 'lax'),
    path: options.path || '/',
    maxAge: options.maxAge,
    domain: options.domain || undefined,
  };
}

/**
 * Get cookie options for access tokens
 * Short-lived, strict security
 *
 * @param {number} maxAge - Token expiration in milliseconds
 * @returns {Object} Cookie options
 */
export function getAccessTokenCookieOptions(maxAge) {
  return getSecureCookieOptions({
    maxAge,
    sameSite: 'strict',
  });
}

/**
 * Get cookie options for refresh tokens
 * Long-lived, strict security
 *
 * @param {number} maxAge - Token expiration in milliseconds
 * @returns {Object} Cookie options
 */
export function getRefreshTokenCookieOptions(maxAge) {
  return getSecureCookieOptions({
    maxAge,
    sameSite: 'strict',
  });
}

/**
 * Get cookie options for session IDs
 *
 * @param {number} maxAge - Session expiration in milliseconds
 * @returns {Object} Cookie options
 */
export function getSessionCookieOptions(maxAge) {
  return getSecureCookieOptions({
    maxAge,
    sameSite: 'strict',
  });
}

/**
 * Get cookie options for CSRF tokens
 * Must be readable by JavaScript for API calls
 *
 * @returns {Object} Cookie options
 */
export function getCsrfCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: false, // Must be readable by JavaScript
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  };
}

/**
 * Clear cookie helper
 * Ensures cookies are properly cleared with matching options
 *
 * @param {Object} res - Express response object
 * @param {string} name - Cookie name
 * @param {Object} options - Cookie options (should match original options)
 */
export function clearCookie(res, name, options = {}) {
  res.clearCookie(name, {
    path: options.path || '/',
    domain: options.domain || undefined,
  });
}

export default {
  getSecureCookieOptions,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getSessionCookieOptions,
  getCsrfCookieOptions,
  clearCookie,
};
