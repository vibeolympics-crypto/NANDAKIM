import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login endpoint
 * Limits to 5 attempts per 15 minutes per IP
 * Requirement 25.5: Rate limiting to prevent abuse
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    ok: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use default IP-based key generation (handles IPv4 and IPv6 correctly)
  // No custom keyGenerator needed - express-rate-limit handles this properly
  // Skip successful requests from counting against the limit
  skipSuccessfulRequests: false,
  // Skip failed requests from counting against the limit
  skipFailedRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      message: 'Too many login attempts from this IP, please try again after 15 minutes',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Rate limiter for general API endpoints
 * Limits to 100 requests per 15 minutes per IP
 * Requirement 25.5: Rate limiting to prevent abuse
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    ok: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default IP-based key generation (handles IPv4 and IPv6 correctly)
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Stricter rate limiter for sensitive operations
 * Can be used for password changes, 2FA setup, etc.
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: {
    ok: false,
    message: 'Too many attempts for this operation, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default IP-based key generation (handles IPv4 and IPv6 correctly)
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      message: 'Too many attempts for this operation, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});
