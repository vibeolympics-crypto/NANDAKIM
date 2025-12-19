/**
 * Client-side Validation
 * Requirements: 4.2
 *
 * Re-exports validation schemas from shared validation file
 * Provides TypeScript types for client-side use
 */

import { z } from 'zod';

// Re-export everything from shared validation
export * from '../../shared/validation.js';

// Import schemas for type inference
import {
  HeroContentSchema,
  BlogPostSchema,
  BlogPostCreateSchema,
  BlogPostUpdateSchema,
  ProjectSchema,
  ProjectCreateSchema,
  ProjectUpdateSchema,
  SNSFeedSchema,
  SNSFeedCreateSchema,
  SNSFeedUpdateSchema,
  ContactFormSchema,
  LoginCredentialsSchema,
} from '../../shared/validation.js';

// ==================== TYPE EXPORTS ====================

export type HeroContent = z.infer<typeof HeroContentSchema>;
export type BlogPost = z.infer<typeof BlogPostSchema>;
export type BlogPostCreate = z.infer<typeof BlogPostCreateSchema>;
export type BlogPostUpdate = z.infer<typeof BlogPostUpdateSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;
export type SNSFeed = z.infer<typeof SNSFeedSchema>;
export type SNSFeedCreate = z.infer<typeof SNSFeedCreateSchema>;
export type SNSFeedUpdate = z.infer<typeof SNSFeedUpdateSchema>;
export type ContactForm = z.infer<typeof ContactFormSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// ==================== ADDITIONAL CLIENT-SPECIFIC SCHEMAS ====================

export const MediaFileSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  filename: z.string().min(1, 'Filename is required'),
  originalName: z.string().min(1, 'Original name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().int().positive('File size must be positive'),
  url: z.string().min(1, 'URL is required'),
  thumbnailUrl: z.string().optional(),
  thumbnails: z
    .object({
      small: z.string(),
      medium: z.string(),
      large: z.string(),
    })
    .optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  uploadedAt: z.string().datetime(),
  uploadedBy: z.string().optional(),
  usedIn: z.array(z.string()).default([]),
});

export type MediaFile = z.infer<typeof MediaFileSchema>;

export const AppearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  borderRadius: z.number().min(0).max(20).default(8),
  spacing: z.number().min(0).max(20).default(4),
});

export type AppearanceSettings = z.infer<typeof AppearanceSettingsSchema>;

export const FontSettingsSchema = z.object({
  fontFamily: z.string().min(1, 'Font family is required'),
  fontSize: z.number().min(10).max(24).default(16),
  lineHeight: z.number().min(1).max(3).default(1.5),
});

export type FontSettings = z.infer<typeof FontSettingsSchema>;

export const ColorSettingsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  foreground: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
});

export type ColorSettings = z.infer<typeof ColorSettingsSchema>;

export const LayoutSettingsSchema = z.object({
  containerWidth: z.number().min(800).max(2000).default(1200),
  sidebarWidth: z.number().min(200).max(400).default(280),
  headerHeight: z.number().min(50).max(100).default(64),
});

export type LayoutSettings = z.infer<typeof LayoutSettingsSchema>;

export const SettingsSchema = z.object({
  appearance: AppearanceSettingsSchema,
  fonts: FontSettingsSchema,
  colors: ColorSettingsSchema,
  layout: LayoutSettingsSchema,
});

export type Settings = z.infer<typeof SettingsSchema>;

export const UserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  role: z.enum(['admin', 'editor', 'viewer']),
  email: z.string().email().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const SEOSettingsSchema = z.object({
  metaTitle: z
    .string()
    .min(1, 'Meta title is required')
    .max(60, 'Meta title should be under 60 characters'),
  metaDescription: z
    .string()
    .min(1, 'Meta description is required')
    .max(160, 'Meta description should be under 160 characters'),
  keywords: z.array(z.string()).default([]),
  ogTitle: z.string().min(1, 'OG title is required').max(60, 'OG title too long'),
  ogDescription: z
    .string()
    .min(1, 'OG description is required')
    .max(160, 'OG description too long'),
  ogImage: z.string().min(1, 'OG image is required'),
  twitterCard: z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
  twitterTitle: z.string().min(1, 'Twitter title is required').max(60, 'Twitter title too long'),
  twitterDescription: z
    .string()
    .min(1, 'Twitter description is required')
    .max(160, 'Twitter description too long'),
  twitterImage: z.string().min(1, 'Twitter image is required'),
  canonicalUrl: z.string().optional(),
  robots: z.string().optional(),
});

export type SEOSettings = z.infer<typeof SEOSettingsSchema>;
