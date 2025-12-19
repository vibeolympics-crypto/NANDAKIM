/**
 * Server-side Validation Tests
 * Requirements: 4.2
 *
 * Tests for server-side validation middleware
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validateBody,
  validateQuery,
  validateParams,
  validateData,
  HeroContentSchema,
  BlogPostCreateSchema,
} from './validation.js';

describe('Server Validation Middleware', () => {
  describe('validateBody', () => {
    it('should pass valid data through', () => {
      const validData = {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
        backgroundImage: {
          light: '/light.jpg',
          dark: '/dark.jpg',
        },
        ctaButtons: {
          primary: { text: 'Primary', link: '#primary' },
          secondary: { text: 'Secondary', link: '#secondary' },
        },
      };

      const req = { body: validData };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validateBody(HeroContentSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid data', () => {
      const invalidData = {
        title: '', // Empty title
        subtitle: 'Test',
      };

      const req = { body: invalidData };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validateBody(HeroContentSchema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: 'Validation failed',
          errors: expect.any(Object),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters', () => {
      const schema = HeroContentSchema.pick({ title: true });
      const req = { query: { title: 'Test' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validateQuery(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    it('should validate route parameters', () => {
      const schema = HeroContentSchema.pick({ title: true });
      const req = { params: { title: 'Test' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validateParams(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateData', () => {
    it('should return valid data', () => {
      const validData = {
        title: 'Test Post',
        summary: 'Test summary',
        content: 'Test content',
        author: 'Test Author',
        tags: [],
        status: 'draft',
      };

      const result = validateData(BlogPostCreateSchema, validData);

      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        title: '', // Empty title
        content: 'Test',
      };

      const result = validateData(BlogPostCreateSchema, invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });
});
