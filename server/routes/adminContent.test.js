import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the content service
vi.mock('../services/contentService.js', () => ({
  default: {
    getHeroContent: vi.fn(),
    updateHeroContent: vi.fn(),
    getBlogPosts: vi.fn(),
    getBlogPost: vi.fn(),
    createBlogPost: vi.fn(),
    updateBlogPost: vi.fn(),
    deleteBlogPost: vi.fn(),
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getSNSFeeds: vi.fn(),
    createSNSFeed: vi.fn(),
    deleteSNSFeed: vi.fn(),
  },
}));

describe('Admin Content Routes', () => {
  let app;
  let contentService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create express app
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { id: 'test-user', role: 'admin' };
      next();
    });

    // Import and use routes
    const { default: adminContentRoutes } = await import('./adminContent.js');
    app.use('/api/admin/content', adminContentRoutes);

    // Import mocked service
    const { default: ContentService } = await import('../services/contentService.js');
    contentService = ContentService;
  });

  describe('PUT /hero', () => {
    it('should update hero content', async () => {
      const heroData = {
        title: 'New Hero Title',
        subtitle: 'New Subtitle',
      };

      contentService.updateHeroContent.mockResolvedValue(heroData);

      const response = await request(app).put('/api/admin/content/hero').send(heroData);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(contentService.updateHeroContent).toHaveBeenCalledWith(heroData);
    });

    it('should handle validation errors', async () => {
      const response = await request(app).put('/api/admin/content/hero').send({});

      expect(response.status).toBe(400);
    });

    it('should handle service errors', async () => {
      contentService.updateHeroContent.mockRejectedValue(new Error('Service error'));

      const response = await request(app).put('/api/admin/content/hero').send({ title: 'Test' });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /blog', () => {
    it('should create a new blog post', async () => {
      const blogPost = {
        title: 'New Post',
        content: 'Post content',
        author: 'Test Author',
      };

      const createdPost = { ...blogPost, id: 'post-123' };
      contentService.createBlogPost.mockResolvedValue(createdPost);

      const response = await request(app).post('/api/admin/content/blog').send(blogPost);

      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.id).toBe('post-123');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/content/blog')
        .send({ title: 'Only Title' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /blog/:id', () => {
    it('should update an existing blog post', async () => {
      const postId = 'post-123';
      const updates = { title: 'Updated Title' };
      const updatedPost = { id: postId, ...updates };

      contentService.updateBlogPost.mockResolvedValue(updatedPost);

      const response = await request(app).put(`/api/admin/content/blog/${postId}`).send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(contentService.updateBlogPost).toHaveBeenCalledWith(postId, updates);
    });

    it('should handle non-existent posts', async () => {
      contentService.updateBlogPost.mockRejectedValue(new Error('Post not found'));

      const response = await request(app)
        .put('/api/admin/content/blog/nonexistent')
        .send({ title: 'Test' });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /blog/:id', () => {
    it('should delete a blog post', async () => {
      const postId = 'post-123';
      contentService.deleteBlogPost.mockResolvedValue();

      const response = await request(app).delete(`/api/admin/content/blog/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(contentService.deleteBlogPost).toHaveBeenCalledWith(postId);
    });

    it('should handle deletion errors', async () => {
      contentService.deleteBlogPost.mockRejectedValue(new Error('Deletion failed'));

      const response = await request(app).delete('/api/admin/content/blog/post-123');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /projects', () => {
    it('should create a new project', async () => {
      const project = {
        title: 'New Project',
        description: 'Project description',
      };

      const createdProject = { ...project, id: 'proj-123' };
      contentService.createProject.mockResolvedValue(createdProject);

      const response = await request(app).post('/api/admin/content/projects').send(project);

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('proj-123');
    });
  });

  describe('PUT /projects/:id', () => {
    it('should update a project', async () => {
      const projectId = 'proj-123';
      const updates = { title: 'Updated Project' };
      const updatedProject = { id: projectId, ...updates };

      contentService.updateProject.mockResolvedValue(updatedProject);

      const response = await request(app)
        .put(`/api/admin/content/projects/${projectId}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Project');
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete a project', async () => {
      const projectId = 'proj-123';
      contentService.deleteProject.mockResolvedValue();

      const response = await request(app).delete(`/api/admin/content/projects/${projectId}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe('POST /sns', () => {
    it('should create a new SNS feed', async () => {
      const snsFeed = {
        platform: 'twitter',
        content: 'Test tweet',
        url: 'https://twitter.com/test/status/123',
      };

      const createdFeed = { ...snsFeed, id: 'sns-123' };
      contentService.createSNSFeed.mockResolvedValue(createdFeed);

      const response = await request(app).post('/api/admin/content/sns').send(snsFeed);

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('sns-123');
    });
  });

  describe('DELETE /sns/:id', () => {
    it('should delete an SNS feed', async () => {
      const feedId = 'sns-123';
      contentService.deleteSNSFeed.mockResolvedValue();

      const response = await request(app).delete(`/api/admin/content/sns/${feedId}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .put('/api/admin/content/hero')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle missing content-type', async () => {
      const response = await request(app).put('/api/admin/content/hero').send('data');

      expect(response.status).toBe(400);
    });
  });
});
