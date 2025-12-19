/**
 * Data Model Type Definitions
 * Types for data loaded from JSON files
 */

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription?: string; // Detailed admin-written introduction
  thumbnail?: string; // Specific thumbnail URL for the card
  projectUrl?: string; // Direct link to the project
  image: string;
  technologies: string[];
  year?: string;
  category?: string;
  url?: string;
  github?: string;
  featured?: boolean;
  screenshots?: string[]; // Optional project screenshots
  demoUrl?: string; // Optional demo link
  githubUrl?: string; // Optional GitHub repository
}

// Enhanced ProjectDetail interface for modal display
export interface ProjectDetail extends Project {
  fullDescription: string; // Required for detail view
  thumbnail: string; // Required for card display
  projectUrl: string; // Required for direct link
}

export interface ProjectsData {
  projects: Project[];
}

// ============================================
// Event Types
// ============================================

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image?: string;
  url?: string;
}

export interface EventsData {
  events: Event[];
}

// ============================================
// News Types
// ============================================

export interface NewsData {
  news: NewsItem[];
}

// NewsItem은 api.ts에서 export됨
import { NewsItem } from '@/lib/api';

// ============================================
// Configuration Types
// ============================================

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  author: string;
  email: string;
  social: {
    twitter?: string;
    linkedin?: string;
    threads?: string;
    github?: string;
    instagram?: string;
    youtube?: string;
  };
  analytics?: {
    googleAnalyticsId?: string;
    googleAdsenseId?: string;
  };
  maps?: {
    provider: 'google' | 'kakao';
    apiKey: string;
    defaultLocation: {
      lat: number;
      lng: number;
      zoom: number;
    };
  };
}
