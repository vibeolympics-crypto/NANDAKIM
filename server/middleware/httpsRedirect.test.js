/**
 * Tests for HTTPS Redirect Middleware
 *
 * Requirements: 4.1 - Enforce HTTPS in production environments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { httpsRedirect, hstsHeader, enforceHttps } from './httpsRedirect.js';

describe('HTTPS Redirect Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      secure: false,
      headers: {},
      url: '/test',
      path: '/test',
      method: 'GET',
      hostname: 'example.com',
    };
    res = {
      redirect: vi.fn(),
      setHeader: vi.fn(),
    };
    next = vi.fn();
  });

  describe('httpsRedirect', () => {
    it('should redirect HTTP to HTTPS in production', () => {
      const middleware = httpsRedirect({ enabled: true });
      req.headers.host = 'example.com';

      middleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com/test');
      expect(next).not.toHaveBeenCalled();
    });

    it('should not redirect if already HTTPS (req.secure)', () => {
      const middleware = httpsRedirect({ enabled: true });
      req.secure = true;

      middleware(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not redirect if already HTTPS (X-Forwarded-Proto)', () => {
      const middleware = httpsRedirect({ enabled: true });
      req.headers['x-forwarded-proto'] = 'https';

      middleware(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not redirect if already HTTPS (X-Forwarded-SSL)', () => {
      const middleware = httpsRedirect({ enabled: true });
      req.headers['x-forwarded-ssl'] = 'on';

      middleware(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not redirect when disabled', () => {
      const middleware = httpsRedirect({ enabled: false });

      middleware(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should skip excluded paths', () => {
      const middleware = httpsRedirect({
        enabled: true,
        excludePaths: ['/health', '/api/health'],
      });
      req.path = '/health';

      middleware(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should use custom status code', () => {
      const middleware = httpsRedirect({
        enabled: true,
        statusCode: 302,
      });
      req.headers.host = 'example.com';

      middleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(302, 'https://example.com/test');
    });

    it('should preserve query parameters', () => {
      const middleware = httpsRedirect({ enabled: true });
      req.url = '/test?foo=bar&baz=qux';
      req.headers.host = 'example.com';

      middleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com/test?foo=bar&baz=qux');
    });
  });

  describe('hstsHeader', () => {
    it('should set HSTS header on HTTPS requests', () => {
      const middleware = hstsHeader();
      req.secure = true;

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
      expect(next).toHaveBeenCalled();
    });

    it('should not set HSTS header on HTTP requests', () => {
      const middleware = hstsHeader();
      req.secure = false;

      middleware(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should use custom maxAge', () => {
      const middleware = hstsHeader({ maxAge: 86400 });
      req.secure = true;

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=86400; includeSubDomains; preload'
      );
    });

    it('should exclude subdomains when configured', () => {
      const middleware = hstsHeader({ includeSubDomains: false });
      req.secure = true;

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; preload'
      );
    });

    it('should exclude preload when configured', () => {
      const middleware = hstsHeader({ preload: false });
      req.secure = true;

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    });

    it('should work with X-Forwarded-Proto header', () => {
      const middleware = hstsHeader();
      req.headers['x-forwarded-proto'] = 'https';

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    });
  });

  describe('enforceHttps', () => {
    it('should redirect and set HSTS header', () => {
      const middleware = enforceHttps({ enabled: true });
      req.headers.host = 'example.com';

      middleware(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com/test');
      expect(next).not.toHaveBeenCalled();
    });

    it('should only set HSTS header on HTTPS requests', () => {
      const middleware = enforceHttps({ enabled: true });
      req.secure = true;

      middleware(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
      expect(next).toHaveBeenCalled();
    });
  });
});
