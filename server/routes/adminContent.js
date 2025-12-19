import express from 'express';
import contentService from '../services/contentService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { autoCacheInvalidation } from '../middleware/cacheInvalidation.js';
import {
  HeroContentSchema,
  BlogPostCreateSchema,
  BlogPostUpdateSchema,
  ProjectCreateSchema,
  ProjectUpdateSchema,
  SNSFeedCreateSchema,
  SNSFeedUpdateSchema,
  validateBody,
} from '../lib/validation.js';

const router = express.Router();

// Note: All routes in this file require authentication and CSRF protection
// These are applied in server/index.js before mounting this router

// ==================== HERO SECTION ====================

/**
 * Update hero content
 * Requires: admin or editor role
 * Requirements: 2.1, 4.2
 * Auto-invalidates hero cache on update
 */
router.put(
  '/hero',
  validateBody(HeroContentSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.username || 'admin';
    const heroContent = await contentService.updateHeroContent(req.body, userId);

    return res.json({
      ok: true,
      message: 'Hero content updated successfully',
      data: heroContent,
    });
  }),
  autoCacheInvalidation('hero')
);

// ==================== BLOG POSTS ====================

/**
 * Get all blog posts (including drafts)
 * Requires: admin or editor role
 * Requirements: 2.2, 8.1, 8.2
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

      return res.json({
        ok: true,
        data: posts,
        count: posts.length,
      });
    } catch (error) {
      // Log as warning, not error - service degradation
      console.warn('[Admin Content API] Blog posts service degraded:', error.message);

      // Return empty array instead of failing
      return res.json({
        ok: true,
        data: [],
        count: 0,
        warning: 'Service temporarily degraded',
      });
    }
  })
);

/**
 * Get single blog post by ID (including drafts)
 * Requires: admin or editor role
 * Requirements: 2.2, 8.1, 8.2
 */
router.get(
  '/blog/:id',
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const post = await contentService.getBlogPost(id);

      return res.json({
        ok: true,
        data: post,
      });
    } catch (error) {
      // Log as warning for service issues
      console.warn('[Admin Content API] Failed to fetch blog post:', error.message);

      // Return 404 for not found, 503 for service issues
      if (error.message.includes('not found')) {
        return res.status(404).json({
          ok: false,
          message: error.message,
        });
      }

      return res.status(503).json({
        ok: false,
        message: 'Service temporarily unavailable',
      });
    }
  })
);

/**
 * Create new blog post
 * Requires: admin or editor role
 * Requirements: 2.2, 4.2
 * Auto-invalidates blog cache on create
 */
router.post(
  '/blog',
  validateBody(BlogPostCreateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.username || 'admin';
    const post = await contentService.createBlogPost(req.body, userId);

    return res.status(201).json({
      ok: true,
      message: 'Blog post created successfully',
      data: post,
    });
  }),
  autoCacheInvalidation('blog')
);

/**
 * Update existing blog post
 * Requires: admin or editor role
 * Requirements: 2.2, 4.2
 * Auto-invalidates blog cache on update
 */
router.put(
  '/blog/:id',
  validateBody(BlogPostUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.username || 'admin';
    const post = await contentService.updateBlogPost(id, req.body, userId);

    return res.json({
      ok: true,
      message: 'Blog post updated successfully',
      data: post,
    });
  }),
  autoCacheInvalidation('blog')
);

/**
 * Delete blog post
 * Requires: admin role only
 * Requirements: 2.2
 * Auto-invalidates blog cache on delete
 */
router.delete(
  '/blog/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user has admin role
    if (req.user?.role !== 'admin') {
      throw createError('FORBIDDEN', 'Only admins can delete blog posts');
    }

    await contentService.deleteBlogPost(id);

    return res.json({
      ok: true,
      message: 'Blog post deleted successfully',
    });
  }),
  autoCacheInvalidation('blog')
);

// ==================== PROJECTS ====================

/**
 * Get all projects
 * Requires: admin or editor role
 * Requirements: 2.4, 8.1, 8.2
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
      // Log as warning - service degradation
      console.warn('[Admin Content API] Projects service degraded:', error.message);

      // Return empty array instead of failing
      return res.json({
        ok: true,
        data: [],
        count: 0,
        warning: 'Service temporarily degraded',
      });
    }
  })
);

/**
 * Get single project by ID
 * Requires: admin or editor role
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
 * Create new project
 * Requires: admin or editor role
 * Requirements: 2.4, 4.2
 * Auto-invalidates projects cache on create
 */
router.post(
  '/projects',
  validateBody(ProjectCreateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.username || 'admin';
    const project = await contentService.createProject(req.body, userId);

    return res.status(201).json({
      ok: true,
      message: 'Project created successfully',
      data: project,
    });
  }),
  autoCacheInvalidation('projects')
);

/**
 * Update existing project
 * Requires: admin or editor role
 * Requirements: 2.4, 4.2
 * Auto-invalidates projects cache on update
 */
router.put(
  '/projects/:id',
  validateBody(ProjectUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.username || 'admin';
    const project = await contentService.updateProject(id, req.body, userId);

    return res.json({
      ok: true,
      message: 'Project updated successfully',
      data: project,
    });
  }),
  autoCacheInvalidation('projects')
);

/**
 * Delete project
 * Requires: admin role only
 * Requirements: 2.4
 * Auto-invalidates projects cache on delete
 */
router.delete(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user has admin role
    if (req.user?.role !== 'admin') {
      throw createError('FORBIDDEN', 'Only admins can delete projects');
    }

    await contentService.deleteProject(id);

    return res.json({
      ok: true,
      message: 'Project deleted successfully',
    });
  }),
  autoCacheInvalidation('projects')
);

// ==================== SNS FEEDS ====================

/**
 * Get all SNS feeds
 * Requires: admin or editor role
 * Requirements: 2.4, 8.1, 8.2
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
      // Log as warning - service degradation
      console.warn('[Admin Content API] SNS feeds service degraded:', error.message);

      // Return empty array instead of failing
      return res.json({
        ok: true,
        data: [],
        count: 0,
        warning: 'Service temporarily degraded',
      });
    }
  })
);

/**
 * Get single SNS feed by ID
 * Requires: admin or editor role
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
 * Create new SNS feed
 * Requires: admin or editor role
 * Requirements: 2.4, 4.2
 * Auto-invalidates SNS cache on create
 */
router.post(
  '/sns',
  validateBody(SNSFeedCreateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.username || 'admin';
    const feed = await contentService.createSNSFeed(req.body, userId);

    return res.status(201).json({
      ok: true,
      message: 'SNS feed created successfully',
      data: feed,
    });
  }),
  autoCacheInvalidation('sns')
);

/**
 * Update existing SNS feed
 * Requires: admin or editor role
 * Requirements: 2.4, 4.2
 * Auto-invalidates SNS cache on update
 */
router.put(
  '/sns/:id',
  validateBody(SNSFeedUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.username || 'admin';
    const feed = await contentService.updateSNSFeed(id, req.body, userId);

    return res.json({
      ok: true,
      message: 'SNS feed updated successfully',
      data: feed,
    });
  }),
  autoCacheInvalidation('sns')
);

/**
 * Delete SNS feed
 * Requires: admin role only
 * Requirements: 2.4
 * Auto-invalidates SNS cache on delete
 */
router.delete(
  '/sns/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user has admin role
    if (req.user?.role !== 'admin') {
      throw createError('FORBIDDEN', 'Only admins can delete SNS feeds');
    }

    await contentService.deleteSNSFeed(id);

    return res.json({
      ok: true,
      message: 'SNS feed deleted successfully',
    });
  }),
  autoCacheInvalidation('sns')
);

// ==================== CONTACT INFO ====================

/**
 * Update contact information
 * Requires: admin or editor role
 * Requirements: 4.2
 * Auto-invalidates contact cache on update
 */
router.put(
  '/contact',
  asyncHandler(async (req, res) => {
    const userId = req.user?.username || 'admin';
    const contactData = await contentService.updateContactInfo(req.body, userId);

    return res.json({
      ok: true,
      message: 'Contact information updated successfully',
      data: contactData,
    });
  }),
  autoCacheInvalidation('contact')
);

// ==================== ABOUT SECTION ====================

/**
 * Get about content
 * Requires: admin or editor role
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
      console.warn('[Admin Content API] About content service degraded:', error.message);

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
        warning: 'Service temporarily degraded',
      });
    }
  })
);

/**
 * Update about content
 * Requires: admin or editor role
 * Auto-invalidates about cache on update
 */
router.put(
  '/about',
  asyncHandler(async (req, res) => {
    console.log('[About Update] PUT request received');
    console.log('[About Update] User:', req.user?.username);
    console.log('[About Update] Body:', JSON.stringify(req.body, null, 2));

    try {
      const userId = req.user?.username || 'admin';
      const aboutData = await contentService.updateAboutContent(req.body, userId);

      console.log('[About Update] Save successful');

      return res.json({
        ok: true,
        message: 'About content updated successfully',
        data: aboutData,
      });
    } catch (error) {
      console.error('[About Update] Error:', error);
      throw error;
    }
  }),
  autoCacheInvalidation('about')
);

export default router;
