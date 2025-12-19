/**
 * Central Type Definitions Export
 * Import types from here: import { Project } from '@/types'
 */

// Data types
export type {
  Project,
  ProjectsData,
  Event,
  EventsData,
  NewsItem,
  NewsData,
  SiteConfig,
} from './data';

// Re-export commonly used types from lib/api.ts
export type { BlogPost as ApiBlogPost, SNSFeed } from '@/lib/api';
