/**
 * Error Handler Middleware Tests
 * Tests for Requirements: 24.1, 24.2, 24.3, 24.4, 24.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AppError,
  ErrorTypes,
  createError,
  createValidationError,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler,
} from './errorHandler.js';

describe('Error Handler Middleware', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'test' });

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.isOperational).toBe(true);
    });

    it('should default to 500 status code', () => {
      const error = new AppError('Test error');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('createError', () => {
    it('should create error from ErrorTypes', () => {
      const error = createError('UNAUTHORIZED', 'Custom message');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Custom message');
    });

    it('should use default message if not provided', () => {
      const error = createError('VALIDATION_ERROR');

      expect(error.message).toBeTruthy();
      expect(error.statusCode).toBe(400);
    });

    it('should include details if provided', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = createError('VALIDATION_ERROR', 'Invalid input', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with details', () => {
      const errors = {
        email: 'Invalid email format',
        password: 'Password too short',
      };

      const error = createValidationError(errors);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(errors);
    });
  });

  describe('globalErrorHandler', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        originalUrl: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test' },
        user: { username: 'testuser' },
      };

      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      next = vi.fn();
    });

    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            message: 'Test error',
            code: 'TEST_ERROR',
            statusCode: 400,
          }),
        })
      );
    });

    it('should convert ValidationError to AppError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = { field: 'test' };

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
          }),
        })
      );
    });

    it('should convert JsonWebTokenError to AppError', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'INVALID_TOKEN',
          }),
        })
      );
    });

    it('should convert TokenExpiredError to AppError', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'TOKEN_EXPIRED',
          }),
        })
      );
    });

    it('should handle MongoDB duplicate key error', () => {
      const error = new Error('Duplicate key');
      error.code = 11000;

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'DUPLICATE_ENTRY',
          }),
        })
      );
    });

    it('should include user-friendly message', () => {
      const error = new AppError('Technical error', 500, 'INTERNAL_ERROR');

      globalErrorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.error.userMessage).toBeTruthy();
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new AppError('Test error', 500, 'INTERNAL_ERROR');

      globalErrorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const handler = asyncHandler(async (req, res) => {
        res.json({ ok: true });
      });

      const req = {};
      const res = { json: vi.fn() };
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ ok: true });
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch and pass errors to next', async () => {
      const error = new Error('Test error');
      const handler = asyncHandler(async () => {
        throw error;
      });

      const req = {};
      const res = {};
      const next = vi.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error', () => {
      const req = { originalUrl: '/nonexistent' };
      const res = {};
      const next = vi.fn();

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          code: 'NOT_FOUND',
        })
      );
    });
  });
});
