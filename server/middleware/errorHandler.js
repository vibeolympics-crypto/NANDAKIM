/**
 * Global Error Handler Middleware
 * Requirements: 24.1, 24.2, 24.3, 24.4, 24.5
 *
 * Provides:
 * - Centralized error handling
 * - User-friendly error messages
 * - Error logging
 * - Consistent error response format
 */

import { logger } from '../utils/logger.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for consistent error handling
 */
export const ErrorTypes = {
  // Authentication errors (401)
  UNAUTHORIZED: { statusCode: 401, code: 'UNAUTHORIZED' },
  TOKEN_EXPIRED: { statusCode: 401, code: 'TOKEN_EXPIRED' },
  INVALID_TOKEN: { statusCode: 401, code: 'INVALID_TOKEN' },
  INVALID_CREDENTIALS: { statusCode: 401, code: 'INVALID_CREDENTIALS' },

  // Authorization errors (403)
  FORBIDDEN: { statusCode: 403, code: 'FORBIDDEN' },
  INSUFFICIENT_PERMISSIONS: { statusCode: 403, code: 'INSUFFICIENT_PERMISSIONS' },
  CSRF_VALIDATION_FAILED: { statusCode: 403, code: 'CSRF_VALIDATION_FAILED' },

  // Validation errors (400)
  VALIDATION_ERROR: { statusCode: 400, code: 'VALIDATION_ERROR' },
  MISSING_REQUIRED_FIELDS: { statusCode: 400, code: 'MISSING_REQUIRED_FIELDS' },
  INVALID_INPUT: { statusCode: 400, code: 'INVALID_INPUT' },

  // Not found errors (404)
  NOT_FOUND: { statusCode: 404, code: 'NOT_FOUND' },
  RESOURCE_NOT_FOUND: { statusCode: 404, code: 'RESOURCE_NOT_FOUND' },

  // Conflict errors (409)
  CONFLICT: { statusCode: 409, code: 'CONFLICT' },
  DUPLICATE_ENTRY: { statusCode: 409, code: 'DUPLICATE_ENTRY' },

  // File upload errors
  FILE_TOO_LARGE: { statusCode: 413, code: 'FILE_TOO_LARGE' },
  UNSUPPORTED_FILE_TYPE: { statusCode: 415, code: 'UNSUPPORTED_FILE_TYPE' },

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' },

  // Server errors (500)
  INTERNAL_ERROR: { statusCode: 500, code: 'INTERNAL_ERROR' },
  DATABASE_ERROR: { statusCode: 500, code: 'DATABASE_ERROR' },
  EXTERNAL_SERVICE_ERROR: { statusCode: 502, code: 'EXTERNAL_SERVICE_ERROR' },
  SERVICE_UNAVAILABLE: { statusCode: 503, code: 'SERVICE_UNAVAILABLE' },
  TIMEOUT: { statusCode: 504, code: 'TIMEOUT' },
  STORAGE_FULL: { statusCode: 507, code: 'STORAGE_FULL' },
};

/**
 * User-friendly error messages
 * Requirement 24.2: User-friendly error messages
 */
const userFriendlyMessages = {
  // Authentication
  UNAUTHORIZED: 'You need to be logged in to access this resource.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_TOKEN: 'Invalid authentication token. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid username or password. Please try again.',

  // Authorization
  FORBIDDEN: 'You do not have permission to access this resource.',
  INSUFFICIENT_PERMISSIONS: 'Your account does not have sufficient permissions for this action.',
  CSRF_VALIDATION_FAILED: 'Security validation failed. Please refresh the page and try again.',

  // Validation
  VALIDATION_ERROR: 'The information you provided is invalid. Please check and try again.',
  MISSING_REQUIRED_FIELDS: 'Please fill in all required fields.',
  INVALID_INPUT: 'The information you provided is not in the correct format.',

  // Not found
  NOT_FOUND: 'The requested resource was not found.',
  RESOURCE_NOT_FOUND: 'The item you are looking for does not exist or has been deleted.',

  // Conflict
  CONFLICT: 'This action conflicts with existing data.',
  DUPLICATE_ENTRY: 'This item already exists. Please use a different value.',

  // File upload
  FILE_TOO_LARGE: 'The file you are trying to upload is too large. Please choose a smaller file.',
  UNSUPPORTED_FILE_TYPE: 'This file type is not supported. Please upload a different file.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',

  // Server errors
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
  DATABASE_ERROR: 'We are experiencing database issues. Please try again later.',
  EXTERNAL_SERVICE_ERROR: 'An external service is currently unavailable. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  TIMEOUT: 'The request took too long to complete. Please try again.',
  STORAGE_FULL: 'Storage is full. Please contact the administrator.',
};

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(code, defaultMessage) {
  return userFriendlyMessages[code] || defaultMessage || 'An unexpected error occurred.';
}

/**
 * Format error response
 * Requirement 24.2: Consistent error response format
 */
function formatErrorResponse(error, includeStack = false) {
  const response = {
    ok: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      statusCode: error.statusCode || 500,
    },
  };

  // Add user-friendly message
  response.error.userMessage = getUserFriendlyMessage(error.code, error.message);

  // Add details if available
  if (error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Log error with appropriate level
 * Requirement 24.5: Error logging
 */
function logError(error, req) {
  const errorInfo = {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.username || 'anonymous',
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  };

  // Log with appropriate level based on status code
  if (error.statusCode >= 500) {
    // Server errors - log as error
    logger.error('Server error occurred', {
      ...errorInfo,
      stack: error.stack,
    });
  } else if (error.statusCode >= 400) {
    // Client errors - log as warning
    logger.warn('Client error occurred', errorInfo);
  } else {
    // Other errors - log as info
    logger.info('Error occurred', errorInfo);
  }
}

/**
 * Global error handler middleware
 * Requirement 24.1: Global error handler
 *
 * This should be the last middleware in the chain
 */
export function globalErrorHandler(err, req, res, next) {
  // Default to 500 server error
  let error = err;

  // Convert non-AppError errors to AppError
  if (!(error instanceof AppError)) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors);
    } else if (error.name === 'CastError') {
      error = new AppError('Invalid ID format', 400, 'INVALID_INPUT');
    } else if (error.code === 11000) {
      // MongoDB duplicate key error
      error = new AppError('Duplicate entry', 409, 'DUPLICATE_ENTRY');
    } else if (error.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
    } else if (error.name === 'TokenExpiredError') {
      error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    } else if (error.type === 'entity.too.large') {
      error = new AppError('Request body too large', 413, 'FILE_TOO_LARGE');
    } else {
      // Generic error
      error = new AppError(
        error.message || 'Internal server error',
        error.statusCode || 500,
        error.code || 'INTERNAL_ERROR'
      );
    }
  }

  // Log the error
  // Requirement 24.5: Error logging
  logError(error, req);

  // Send error response
  // Requirement 24.2: User-friendly error messages
  const includeStack = process.env.NODE_ENV === 'development';
  const response = formatErrorResponse(error, includeStack);

  res.status(error.statusCode || 500).json(response);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 *
 * Usage:
 * app.get('/route', asyncHandler(async (req, res) => {
 *   // async code that might throw
 * }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler
 * Should be added before the global error handler
 */
export function notFoundHandler(req, res, next) {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
}

/**
 * Helper function to create errors
 */
export function createError(type, message, details = null) {
  const errorType = ErrorTypes[type] || ErrorTypes.INTERNAL_ERROR;
  return new AppError(
    message || getUserFriendlyMessage(errorType.code),
    errorType.statusCode,
    errorType.code,
    details
  );
}

/**
 * Validation error helper
 * Requirement 24.2: Field-specific error messages
 */
export function createValidationError(errors) {
  return new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);
}

/**
 * Network timeout handler
 * Requirement 24.4: Timeout handling
 */
export function timeoutHandler(timeoutMs = 30000) {
  return (req, res, next) => {
    // Set timeout
    req.setTimeout(timeoutMs, () => {
      const error = new AppError('Request timeout', 504, 'TIMEOUT');
      next(error);
    });

    // Set response timeout
    res.setTimeout(timeoutMs, () => {
      const error = new AppError('Response timeout', 504, 'TIMEOUT');
      next(error);
    });

    next();
  };
}

/**
 * Unhandled rejection handler
 * Catches unhandled promise rejections
 */
export function setupUnhandledRejectionHandler() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason,
      promise: promise,
      stack: reason instanceof Error ? reason.stack : undefined,
    });

    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      // Give time for logging before exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
}

/**
 * Uncaught exception handler
 * Catches uncaught exceptions
 */
export function setupUncaughtExceptionHandler() {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });

    // Uncaught exceptions are serious - exit process
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}
