/**
 * Shared Validation Schemas (ES Module)
 * Requirements: 4.2
 *
 * Zod schemas for all content types
 * Shared between client and server for consistent validation
 *
 * This file uses ES modules and can be imported by both Node.js and browser
 */

import { z } from 'zod';

// ==================== COMMON SCHEMAS ====================

/**
 * URL validation - allows empty string or valid URL
 */
export const urlSchema = z.string().refine(
  (val) => {
    if (!val || val === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      // Check if it's a relative URL (starts with / or #)
      return val.startsWith('/') || val.startsWith('#');
    }
  },
  { message: 'Must be a valid URL or relative path' }
);

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Slug validation - lowercase, alphanumeric with hyphens
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');

/**
 * ISO date string validation
 */
export const isoDateSchema = z.string().datetime();

// ==================== HERO CONTENT SCHEMA ====================

export const HeroContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  subtitle: z
    .string()
    .min(1, 'Subtitle is required')
    .max(500, 'Subtitle must be less than 500 characters'),
  backgroundImage: z.object({
    light: z.string().min(1, 'Light background image is required'),
    dark: z.string().min(1, 'Dark background image is required'),
  }),
  ctaButtons: z.object({
    primary: z.object({
      text: z.string().min(1, 'Primary button text is required').max(50, 'Button text too long'),
      link: z.string().min(1, 'Primary button link is required'),
    }),
    secondary: z.object({
      text: z.string().min(1, 'Secondary button text is required').max(50, 'Button text too long'),
      link: z.string().min(1, 'Secondary button link is required'),
    }),
  }),
  updatedAt: isoDateSchema.optional(),
  updatedBy: z.string().optional(),
});

// ==================== BLOG POST SCHEMA ====================

export const BlogPostSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .min(1, 'Summary is required')
    .max(500, 'Summary must be less than 500 characters'),
  excerpt: z
    .string()
    .min(1, 'Excerpt is required')
    .max(500, 'Excerpt must be less than 500 characters')
    .optional(),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required').max(100, 'Author name too long'),
  tags: z.array(z.string()).default([]),
  category: z.string().min(1, 'Category is required').optional(),
  image: z.string().optional(),
  thumbnail: z.string().optional(),
  readTime: z.number().int().positive().optional(),
  publishedAt: isoDateSchema.optional(),
  date: z.string().optional(),
  createdAt: isoDateSchema.optional(),
  updatedAt: isoDateSchema.optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

// Partial schema for updates
export const BlogPostUpdateSchema = BlogPostSchema.partial().required({ id: true });

// Schema for creating new posts (without id, timestamps)
export const BlogPostCreateSchema = BlogPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

// ==================== PROJECT SCHEMA ====================

export const ProjectSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  images: z.array(z.string()).default([]),
  image: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  liveUrl: urlSchema.optional().or(z.literal('')),
  githubUrl: urlSchema.optional().or(z.literal('')),
  url: urlSchema.optional(),
  github: urlSchema.optional(),
  link: urlSchema.optional(),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  date: z.string().optional(),
  createdAt: isoDateSchema.optional(),
  updatedAt: isoDateSchema.optional(),
});

// Partial schema for updates
export const ProjectUpdateSchema = ProjectSchema.partial().required({ id: true });

// Schema for creating new projects
export const ProjectCreateSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ==================== SNS FEED SCHEMA ====================

export const SNSFeedSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  platform: z.enum(['twitter', 'threads', 'instagram', 'youtube'], {
    errorMap: () => ({ message: 'Invalid platform' }),
  }),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  image: z.string().optional(),
  video: z.string().optional(),
  url: z.string().min(1, 'URL is required'),
  timestamp: isoDateSchema,
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
});

// Partial schema for updates
export const SNSFeedUpdateSchema = SNSFeedSchema.partial().required({ id: true });

// Schema for creating new feeds
export const SNSFeedCreateSchema = SNSFeedSchema.omit({ id: true });

// ==================== CONTACT FORM SCHEMA ====================

export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message too long'),
});

// ==================== AUTHENTICATION SCHEMAS ====================

export const LoginCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  twoFactorCode: z.string().length(6, 'Two-factor code must be 6 digits').optional(),
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Format Zod errors into a user-friendly object
 */
export function formatZodErrors(error) {
  const formatted = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}

/**
 * Validate data against a schema and return typed result
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow(schema, data) {
  return schema.parse(data);
}
