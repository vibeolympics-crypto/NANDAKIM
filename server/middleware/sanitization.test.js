/**
 * Unit Tests for Input Sanitization Middleware
 *
 * Tests sanitization functions to ensure they properly prevent:
 * - XSS attacks
 * - SQL injection
 * - HTML injection
 * - Script injection
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizePlainText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeObject,
  validators,
  detectSqlInjection,
} from './sanitization.js';

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Hello</p>');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(\'XSS\')">Click me</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });

  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('should remove javascript: URLs', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});

describe('sanitizePlainText', () => {
  it('should escape HTML entities', () => {
    const input = '<script>alert("XSS")</script>';
    const result = sanitizePlainText(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should escape special characters', () => {
    const input = '& < > " \' /';
    const result = sanitizePlainText(input);
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
  });

  it('should handle normal text', () => {
    const input = 'Hello World';
    const result = sanitizePlainText(input);
    expect(result).toBe('Hello World');
  });

  it('should handle empty input', () => {
    expect(sanitizePlainText('')).toBe('');
    expect(sanitizePlainText(null)).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('should accept valid email addresses', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    expect(sanitizeEmail('test.user@example.co.uk')).toBe('test.user@example.co.uk');
  });

  it('should reject invalid email addresses', () => {
    expect(sanitizeEmail('invalid')).toBeNull();
    expect(sanitizeEmail('invalid@')).toBeNull();
    expect(sanitizeEmail('@example.com')).toBeNull();
    expect(sanitizeEmail('user@')).toBeNull();
  });

  it('should handle empty input', () => {
    expect(sanitizeEmail('')).toBeNull();
    expect(sanitizeEmail(null)).toBeNull();
  });

  it('should normalize email addresses', () => {
    const result = sanitizeEmail('USER@EXAMPLE.COM');
    expect(result).toBe('user@example.com');
  });
});

describe('sanitizeUrl', () => {
  it('should accept valid HTTP URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
  });

  it('should reject javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert("XSS")')).toBeNull();
    expect(sanitizeUrl('JAVASCRIPT:alert("XSS")')).toBeNull();
  });

  it('should reject data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert("XSS")</script>')).toBeNull();
  });

  it('should reject vbscript: URLs', () => {
    expect(sanitizeUrl('vbscript:msgbox("XSS")')).toBeNull();
  });

  it('should reject URLs without protocol by default', () => {
    expect(sanitizeUrl('example.com')).toBeNull();
  });

  it('should handle empty input', () => {
    expect(sanitizeUrl('')).toBeNull();
    expect(sanitizeUrl(null)).toBeNull();
  });
});

describe('sanitizeObject', () => {
  it('should sanitize all string values in object', () => {
    const input = {
      name: '<script>alert("XSS")</script>',
      description: 'Normal text',
    };
    const result = sanitizeObject(input);
    expect(result.name).not.toContain('<script>');
    expect(result.description).toBe('Normal text');
  });

  it('should sanitize nested objects', () => {
    const input = {
      user: {
        name: '<script>XSS</script>',
        profile: {
          bio: '<img src=x onerror=alert(1)>',
        },
      },
    };
    const result = sanitizeObject(input);
    expect(result.user.name).not.toContain('<script>');
    // The onerror attribute should be escaped
    expect(result.user.profile.bio).toContain('&lt;img');
    expect(result.user.profile.bio).toContain('&gt;');
  });

  it('should sanitize arrays', () => {
    const input = ['<script>XSS</script>', 'Normal text'];
    const result = sanitizeObject(input);
    expect(result[0]).not.toContain('<script>');
    expect(result[1]).toBe('Normal text');
  });

  it('should preserve non-string values', () => {
    const input = {
      name: 'Test',
      age: 25,
      active: true,
      tags: ['tag1', 'tag2'],
    };
    const result = sanitizeObject(input);
    expect(result.age).toBe(25);
    expect(result.active).toBe(true);
    expect(Array.isArray(result.tags)).toBe(true);
  });
});

describe('validators.username', () => {
  it('should accept valid usernames', () => {
    expect(validators.username('john_doe')).toBe('john_doe');
    expect(validators.username('user-123')).toBe('user-123');
    expect(validators.username('won kim')).toBe('won kim');
  });

  it('should reject short usernames', () => {
    expect(validators.username('ab')).toBeNull();
  });

  it('should reject long usernames', () => {
    const longName = 'a'.repeat(51);
    expect(validators.username(longName)).toBeNull();
  });

  it('should reject usernames with special characters', () => {
    expect(validators.username('user@name')).toBeNull();
    expect(validators.username('user<script>')).toBeNull();
  });
});

describe('validators.password', () => {
  it('should accept strong passwords', () => {
    expect(validators.password('StrongP@ss123')).toBe('StrongP@ss123');
    expect(validators.password('MyP@ssw0rd!')).toBe('MyP@ssw0rd!');
  });

  it('should reject weak passwords', () => {
    expect(validators.password('weak')).toBeNull();
    expect(validators.password('password')).toBeNull();
    expect(validators.password('12345678')).toBeNull();
  });

  it('should reject passwords without uppercase', () => {
    expect(validators.password('password123!')).toBeNull();
  });

  it('should reject passwords without lowercase', () => {
    expect(validators.password('PASSWORD123!')).toBeNull();
  });

  it('should reject passwords without numbers', () => {
    expect(validators.password('Password!')).toBeNull();
  });

  it('should reject passwords without special characters', () => {
    expect(validators.password('Password123')).toBeNull();
  });
});

describe('validators.email', () => {
  it('should accept valid emails through sanitizeEmail', () => {
    // Note: validators doesn't have email, we use sanitizeEmail
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
  });
});

describe('validators.number', () => {
  it('should accept valid numbers', () => {
    expect(validators.number(123)).toBe(123);
    expect(validators.number('456')).toBe(456);
    expect(validators.number('123.45')).toBe(123.45);
  });

  it('should reject non-numeric input', () => {
    expect(validators.number('abc')).toBeNull();
    expect(validators.number('12abc')).toBeNull();
  });
});

describe('validators.integer', () => {
  it('should accept valid integers', () => {
    expect(validators.integer(123)).toBe(123);
    expect(validators.integer('456')).toBe(456);
  });

  it('should reject non-integer input', () => {
    expect(validators.integer('123.45')).toBeNull();
    expect(validators.integer('abc')).toBeNull();
  });
});

describe('validators.boolean', () => {
  it('should accept boolean values', () => {
    expect(validators.boolean(true)).toBe(true);
    expect(validators.boolean(false)).toBe(false);
  });

  it('should accept string representations', () => {
    expect(validators.boolean('true')).toBe(true);
    expect(validators.boolean('false')).toBe(false);
    expect(validators.boolean('1')).toBe(true);
    expect(validators.boolean('0')).toBe(false);
    expect(validators.boolean('yes')).toBe(true);
    expect(validators.boolean('no')).toBe(false);
  });

  it('should reject invalid input', () => {
    expect(validators.boolean('invalid')).toBeNull();
    expect(validators.boolean('maybe')).toBeNull();
  });
});

describe('detectSqlInjection', () => {
  it('should detect SQL keywords', () => {
    expect(detectSqlInjection('SELECT * FROM users')).toBe(true);
    expect(detectSqlInjection('DROP TABLE users')).toBe(true);
    expect(detectSqlInjection('INSERT INTO users')).toBe(true);
    expect(detectSqlInjection('DELETE FROM users')).toBe(true);
  });

  it('should detect SQL comment patterns', () => {
    expect(detectSqlInjection("admin' --")).toBe(true);
    expect(detectSqlInjection('1; DROP TABLE users--')).toBe(true);
  });

  it('should detect UNION attacks', () => {
    expect(detectSqlInjection('1 UNION SELECT password FROM users')).toBe(true);
  });

  it('should allow normal text', () => {
    expect(detectSqlInjection('Hello World')).toBe(false);
    expect(detectSqlInjection('user@example.com')).toBe(false);
  });

  it('should handle empty input', () => {
    expect(detectSqlInjection('')).toBe(false);
    expect(detectSqlInjection(null)).toBe(false);
  });
});
