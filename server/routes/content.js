import express from 'express';
import contentService from '../services/contentService.js';
import { asyncHandler, createError, createValidationError } from '../middleware/errorHandler.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * Get hero content
 * Public endpoint - no authentication required
 * Requirements: 2.1, 6.1, 6.2
 */
router.get(
  '/hero',
  asyncHandler(async (req, res) => {
    try {
      const heroContent = await contentService.getHeroContent();
      return res.json({
        ok: true,
        data: heroContent,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Content API] Error fetching hero content:', error);
      }

      // Return default hero content instead of 500
      return res.json({
        ok: true,
        data: {
          title: 'Won Kim Portfolio',
          subtitle: 'Portfolio showcasing projects and activities',
          backgroundImage: {
            light: '/assets/hero-bg.jpg',
            dark: '/assets/hero-bg.jpg',
          },
          ctaButtons: {
            primary: {
              text: 'View Projects',
              link: '#projects',
            },
            secondary: {
              text: 'Contact Me',
              link: '#contact',
            },
          },
          updatedAt: new Date().toISOString(),
        },
      });
    }
  })
);

/**
 * Get all blog posts
 * Public endpoint - no authentication required
 * Supports filtering by status and tag
 * Requirements: 2.2, 6.1, 6.2
 */
router.get(
  '/blog',
  asyncHandler(async (req, res) => {
    try {
      const { status, tag } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (tag) filters.tag = tag;

      const posts = await contentService.getBlogPosts(filters);

      // Filter to only published posts for public access
      const publishedPosts = posts.filter((post) => post.status === 'published');

      return res.json({
        ok: true,
        data: publishedPosts,
        count: publishedPosts.length,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Content API] Error fetching blog posts:', error);
      }

      // Return empty array instead of 500
      return res.json({
        ok: true,
        data: [],
        count: 0,
      });
    }
  })
);

/**
 * Get single blog post by ID
 * Public endpoint - no authentication required
 * Requirements: 2.2
 */
router.get(
  '/blog/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const post = await contentService.getBlogPost(id);

    // Only return if published
    if (post.status !== 'published') {
      throw createError('NOT_FOUND', 'Blog post not found');
    }

    return res.json({
      ok: true,
      data: post,
    });
  })
);

/**
 * Get all projects
 * Public endpoint - no authentication required
 * Requirements: 2.4, 6.1, 6.2
 */
router.get(
  '/projects',
  asyncHandler(async (req, res) => {
    try {
      const projects = await contentService.getProjects();
      return res.json({
        ok: true,
        data: projects,
        count: projects.length,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Content API] Error fetching projects:', error);
      }

      // Return empty array instead of 500
      return res.json({
        ok: true,
        data: [],
        count: 0,
      });
    }
  })
);

/**
 * Get single project by ID
 * Public endpoint - no authentication required
 * Requirements: 2.4
 */
router.get(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const project = await contentService.getProject(id);
    return res.json({
      ok: true,
      data: project,
    });
  })
);

/**
 * Get all SNS feeds
 * Public endpoint - no authentication required
 * Supports filtering by platform
 * Requirements: 2.4, 6.1, 6.2
 */
router.get(
  '/sns',
  asyncHandler(async (req, res) => {
    try {
      const { platform } = req.query;

      const filters = {};
      if (platform) filters.platform = platform;

      const feeds = await contentService.getSNSFeeds(filters);
      return res.json({
        ok: true,
        data: feeds,
        count: feeds.length,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Content API] Error fetching SNS feeds:', error);
      }

      // Return empty array instead of 500
      return res.json({
        ok: true,
        data: [],
        count: 0,
      });
    }
  })
);

/**
 * Get single SNS feed by ID
 * Public endpoint - no authentication required
 * Requirements: 2.4
 */
router.get(
  '/sns/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const feed = await contentService.getSNSFeed(id);
    return res.json({
      ok: true,
      data: feed,
    });
  })
);

/**
 * Get contact information
 * Public endpoint - no authentication required
 */
router.get(
  '/contact',
  asyncHandler(async (req, res) => {
    try {
      const contactData = await contentService.getContactInfo();
      return res.json({
        ok: true,
        data: contactData,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Content API] Error fetching contact info:', error);
      }

      // Return default contact info instead of 500
      return res.json({
        ok: true,
        data: {
          contact: {
            email: 'hello@example.com',
            phone: '+1 234 567 8900',
            address: 'City, Country',
            socialMedia: {},
          },
        },
      });
    }
  })
);

/**
 * Get about content
 * Public endpoint - no authentication required
 */
router.get(
  '/about',
  asyncHandler(async (req, res) => {
    try {
      const aboutData = await contentService.getAboutContent();
      return res.json({
        ok: true,
        data: aboutData,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Content API] Error fetching about content:', error);
      }

      // Return default about content instead of 500
      return res.json({
        ok: true,
        data: {
          profileImage: '',
          name: '',
          title: '',
          biography: '',
          certifications: [],
          careerTimeline: [],
        },
      });
    }
  })
);

export default router;
