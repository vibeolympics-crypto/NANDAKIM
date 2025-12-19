/**
 * Tests for Cookie Configuration Helper
 *
 * Requirements: 4.1 - Configure secure cookies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSecureCookieOptions,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getSessionCookieOptions,
  getCsrfCookieOptions,
  clearCookie,
} from './cookieConfig.js';

describe('Cookie Configuration', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('getSecureCookieOptions', () => {
    it('should return secure cookies in production', () => {
      process.env.NODE_ENV = 'production';

      const options = getSecureCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: undefined,
        domain: undefined,
      });
    });

    it('should return non-secure cookies in development', () => {
      process.env.NODE_ENV = 'development';

      const options = getSecureCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: undefined,
        domain: undefined,
      });
    });

    it('should accept custom options', () => {
      process.env.NODE_ENV = 'production';

      const options = getSecureCookieOptions({
        maxAge: 3600000,
        sameSite: 'none',
        path: '/api',
        domain: 'example.com',
      });

      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/api',
        maxAge: 3600000,
        domain: 'example.com',
      });
    });
  });

  describe('getAccessTokenCookieOptions', () => {
    it('should return strict sameSite for access tokens', () => {
      process.env.NODE_ENV = 'production';

      const options = getAccessTokenCookieOptions(3600000);

      expect(options.sameSite).toBe('strict');
      expect(options.maxAge).toBe(3600000);
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
    });
  });

  describe('getRefreshTokenCookieOptions', () => {
    it('should return strict sameSite for refresh tokens', () => {
      process.env.NODE_ENV = 'production';

      const options = getRefreshTokenCookieOptions(604800000);

      expect(options.sameSite).toBe('strict');
      expect(options.maxAge).toBe(604800000);
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
    });
  });

  describe('getSessionCookieOptions', () => {
    it('should return strict sameSite for session cookies', () => {
      process.env.NODE_ENV = 'production';

      const options = getSessionCookieOptions(1800000);

      expect(options.sameSite).toBe('strict');
      expect(options.maxAge).toBe(1800000);
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
    });
  });

  describe('getCsrfCookieOptions', () => {
    it('should return non-httpOnly cookies for CSRF tokens', () => {
      process.env.NODE_ENV = 'production';

      const options = getCsrfCookieOptions();

      expect(options.httpOnly).toBe(false); // Must be readable by JavaScript
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe('strict');
    });

    it('should use lax sameSite in development', () => {
      process.env.NODE_ENV = 'development';

      const options = getCsrfCookieOptions();

      expect(options.httpOnly).toBe(false);
      expect(options.secure).toBe(false);
      expect(options.sameSite).toBe('lax');
    });
  });

  describe('clearCookie', () => {
    it('should clear cookie with default options', () => {
      const res = {
        clearCookie: vi.fn(),
      };

      clearCookie(res, 'testCookie');

      expect(res.clearCookie).toHaveBeenCalledWith('testCookie', {
        path: '/',
        domain: undefined,
      });
    });

    it('should clear cookie with custom options', () => {
      const res = {
        clearCookie: vi.fn(),
      };

      clearCookie(res, 'testCookie', {
        path: '/api',
        domain: 'example.com',
      });

      expect(res.clearCookie).toHaveBeenCalledWith('testCookie', {
        path: '/api',
        domain: 'example.com',
      });
    });
  });

  describe('Environment-based behavior', () => {
    it('should use strict sameSite in production', () => {
      process.env.NODE_ENV = 'production';

      const options = getSecureCookieOptions();

      expect(options.sameSite).toBe('strict');
      expect(options.secure).toBe(true);
    });

    it('should use lax sameSite in development', () => {
      process.env.NODE_ENV = 'development';

      const options = getSecureCookieOptions();

      expect(options.sameSite).toBe('lax');
      expect(options.secure).toBe(false);
    });

    it('should handle test environment', () => {
      process.env.NODE_ENV = 'test';

      const options = getSecureCookieOptions();

      expect(options.secure).toBe(false);
      expect(options.sameSite).toBe('lax');
    });
  });
});
