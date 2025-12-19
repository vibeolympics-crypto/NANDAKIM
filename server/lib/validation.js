/**
 * Server-side Validation Utilities
 * Requirements: 4.2
 *
 * Re-exports validation schemas from shared validation file
 * Provides server-specific validation utilities
 */

// Import all schemas from the shared validation file
export {
  // Schemas
  HeroContentSchema,
  BlogPostSchema,
  BlogPostUpdateSchema,
  BlogPostCreateSchema,
  ProjectSchema,
  ProjectUpdateSchema,
  ProjectCreateSchema,
  SNSFeedSchema,
  SNSFeedUpdateSchema,
  SNSFeedCreateSchema,
  ContactFormSchema,
  LoginCredentialsSchema,

  // Helper functions
  validate,
  formatZodErrors,
  validateOrThrow,

  // Common schemas
  urlSchema,
  emailSchema,
  slugSchema,
  isoDateSchema,
} from '../../shared/validation.js';

/**
 * Express middleware for validating request body
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });

        return res.status(400).json({
          ok: false,
          error: 'Validation failed',
          errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Express middleware for validating query parameters
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });

        return res.status(400).json({
          ok: false,
          error: 'Invalid query parameters',
          errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Express middleware for validating route parameters
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });

        return res.status(400).json({
          ok: false,
          error: 'Invalid route parameters',
          errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Validate data and return formatted errors if invalid
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {{ valid: boolean, data?: any, errors?: object }}
 */
export function validateData(schema, data) {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error.name === 'ZodError') {
      const errors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { valid: false, errors };
    }
    throw error;
  }
}
