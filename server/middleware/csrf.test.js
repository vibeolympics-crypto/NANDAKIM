/**
 * CSRF Protection Middleware Tests
 *
 * Tests for CSRF token generation and validation
 * Requirements: 25.1, 25.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { csrfTokenGenerator, csrfErrorHandler, generateCsrfToken } from './csrf.js';

describe('CSRF Protection Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/test',
      ip: '127.0.0.1',
      get: vi.fn(() => 'test-user-agent'),
      headers: {},
      body: {},
      query: {},
    };

    res = {
      locals: {},
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  describe('csrfTokenGenerator', () => {
    it('should generate and attach CSRF token to response', () => {
      csrfTokenGenerator(req, res, next);

      // Should attach token to res.locals
      expect(res.locals.csrfToken).toBeDefined();
      expect(typeof res.locals.csrfToken).toBe('string');
      expect(res.locals.csrfToken.length).toBeGreaterThan(0);

      // Should set token in response header
      expect(res.setHeader).toHaveBeenCalledWith('X-CSRF-Token', expect.any(String));

      // Should call next
      expect(next).toHaveBeenCalled();
    });

    it('should generate different tokens on subsequent calls', () => {
      const tokens = new Set();

      for (let i = 0; i < 5; i++) {
        const freshReq = { ...req };
        const freshRes = { ...res, locals: {}, setHeader: vi.fn() };
        csrfTokenGenerator(freshReq, freshRes, next);
        tokens.add(freshRes.locals.csrfToken);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(5);
    });
  });

  describe('csrfErrorHandler', () => {
    it('should handle CSRF validation errors', () => {
      const csrfError = new Error('Invalid CSRF token');
      csrfError.code = 'EBADCSRFTOKEN';

      csrfErrorHandler(csrfError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        message: expect.stringContaining('Invalid CSRF token'),
        code: 'CSRF_VALIDATION_FAILED',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors with csrf in message', () => {
      const csrfError = new Error('csrf token mismatch');

      csrfErrorHandler(csrfError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        message: expect.stringContaining('Invalid CSRF token'),
        code: 'CSRF_VALIDATION_FAILED',
      });
    });

    it('should pass non-CSRF errors to next handler', () => {
      const otherError = new Error('Some other error');

      csrfErrorHandler(otherError, req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(otherError);
    });
  });

  describe('Token Format Validation', () => {
    it('should generate tokens with correct format', () => {
      csrfTokenGenerator(req, res, next);
      const token = res.locals.csrfToken;

      // Token should be a non-empty string
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Token should be URL-safe (base64 or similar)
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate tokens of sufficient length', () => {
      csrfTokenGenerator(req, res, next);
      const token = res.locals.csrfToken;

      // Token should be at least 32 characters for security
      expect(token.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Error Handling', () => {
    it('should handle token generation errors gracefully', () => {
      // Mock a scenario where token generation might fail
      const errorReq = {
        ...req,
        // Simulate a problematic request
        headers: null,
      };

      // The middleware should handle this gracefully
      // Note: Actual behavior depends on csrf-csrf implementation
      expect(() => {
        csrfTokenGenerator(errorReq, res, next);
      }).not.toThrow();
    });
  });

  describe('Security Properties', () => {
    it('should generate cryptographically random tokens', () => {
      const tokens = [];

      for (let i = 0; i < 100; i++) {
        const freshReq = { ...req };
        const freshRes = { ...res, locals: {}, setHeader: vi.fn() };
        csrfTokenGenerator(freshReq, freshRes, next);
        tokens.push(freshRes.locals.csrfToken);
      }

      // Check for uniqueness (no duplicates)
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);

      // Check for randomness (no obvious patterns)
      // Tokens should not be sequential or predictable
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).not.toBe(tokens[i - 1]);
      }
    });

    it('should not expose sensitive information in tokens', () => {
      csrfTokenGenerator(req, res, next);
      const token = res.locals.csrfToken;

      // Token should not contain user information
      expect(token).not.toContain('user');
      expect(token).not.toContain('admin');
      expect(token).not.toContain('127.0.0.1');

      // Token should not be easily guessable
      expect(token).not.toMatch(/^(0+|1+|a+|test)$/i);
    });
  });
});
