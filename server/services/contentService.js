import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// Import shared validation schemas
import {
  HeroContentSchema,
  BlogPostSchema,
  ProjectSchema,
  SNSFeedSchema,
} from '../lib/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ContentService - Manages all content CRUD operations with validation and caching
 *
 * Cache Strategy:
 * - In-memory cache with TTL (Time To Live)
 * - Automatic invalidation on updates
 * - Configurable TTL per content type
 * - Cache warming on server start
 * - Manual cache invalidation support
 */
class ContentService {
  constructor() {
    // In-memory cache
    this.cache = {
      hero: null,
      blog: null,
      projects: null,
      sns: null,
      about: null,
      contact: null,
    };

    // Cache timestamps for TTL
    this.cacheTimestamps = {
      hero: null,
      blog: null,
      projects: null,
      sns: null,
      about: null,
      contact: null,
    };

    // Cache TTL in milliseconds - configurable per content type
    this.cacheTTLs = {
      hero: 10 * 60 * 1000, // 10 minutes (rarely changes)
      blog: 5 * 60 * 1000, // 5 minutes
      projects: 5 * 60 * 1000, // 5 minutes
      sns: 2 * 60 * 1000, // 2 minutes (more dynamic)
      about: 10 * 60 * 1000, // 10 minutes (rarely changes)
      contact: 10 * 60 * 1000, // 10 minutes (rarely changes)
    };

    // Default TTL fallback
    this.cacheTTL = 5 * 60 * 1000;

    // Data file paths
    this.dataDir = path.join(__dirname, '../data');

    // Cache statistics for monitoring
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
    };
  }

  /**
   * Check if cache is valid
   * @param {string} key - Cache key (hero, blog, projects, sns)
   * @returns {boolean} - True if cache is valid
   */
  isCacheValid(key) {
    if (!this.cache[key] || !this.cacheTimestamps[key]) {
      this.cacheStats.misses++;
      return false;
    }
    const now = Date.now();
    const ttl = this.cacheTTLs[key] || this.cacheTTL;
    const isValid = now - this.cacheTimestamps[key] < ttl;

    if (isValid) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }

    return isValid;
  }

  /**
   * Set cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCache(key, data) {
    this.cache[key] = data;
    this.cacheTimestamps[key] = Date.now();
  }

  /**
   * Invalidate cache for specific key
   * @param {string} key - Cache key to invalidate
   */
  invalidateCache(key) {
    this.cache[key] = null;
    this.cacheTimestamps[key] = null;
    this.cacheStats.invalidations++;
  }

  /**
   * Invalidate all caches
   * Useful when making system-wide changes
   */
  invalidateAllCaches() {
    Object.keys(this.cache).forEach((key) => {
      this.invalidateCache(key);
    });
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache hit/miss statistics
   */
  getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? ((this.cacheStats.hits / total) * 100).toFixed(2) : 0;

    return {
      ...this.cacheStats,
      total,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Reset cache statistics
   */
  resetCacheStats() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
    };
  }

  /**
   * Warm up cache by pre-loading all content
   * Call this on server startup for better initial performance
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async warmCache() {
    console.log('[ContentService] Warming cache...');
    const results = {
      hero: false,
      blog: false,
      projects: false,
      sns: false,
      about: false,
      contact: false,
    };

    // Load each content type individually, continuing on failures
    // This ensures one failure doesn't prevent other content from loading

    try {
      await this.getHeroContent();
      results.hero = true;
      console.log('[ContentService] ✓ Hero content cached');
    } catch (error) {
      console.warn('[ContentService] ⚠ Failed to cache hero content:', error.message);
    }

    try {
      await this.getBlogPosts();
      results.blog = true;
      console.log('[ContentService] ✓ Blog posts cached');
    } catch (error) {
      console.warn('[ContentService] ⚠ Failed to cache blog posts:', error.message);
    }

    try {
      await this.getProjects();
      results.projects = true;
      console.log('[ContentService] ✓ Projects cached');
    } catch (error) {
      console.warn('[ContentService] ⚠ Failed to cache projects:', error.message);
    }

    try {
      await this.getSNSFeeds();
      results.sns = true;
      console.log('[ContentService] ✓ SNS feeds cached');
    } catch (error) {
      console.warn('[ContentService] ⚠ Failed to cache SNS feeds:', error.message);
    }

    try {
      await this.getAboutContent();
      results.about = true;
      console.log('[ContentService] ✓ About content cached');
    } catch (error) {
      console.warn('[ContentService] ⚠ Failed to cache about content:', error.message);
    }

    try {
      await this.getContactInfo();
      results.contact = true;
      console.log('[ContentService] ✓ Contact info cached');
    } catch (error) {
      console.warn('[ContentService] ⚠ Failed to cache contact info:', error.message);
    }

    // Report overall status
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    if (successCount === totalCount) {
      console.log(
        `[ContentService] ✓ Content cache warmed successfully (${totalCount}/${totalCount})`
      );
    } else if (successCount > 0) {
      console.log(
        `[ContentService] ⚠ Content cache partially warmed (${successCount}/${totalCount})`
      );
    } else {
      console.warn('[ContentService] ✗ Failed to warm cache for any content type');
    }

    return results;
  }

  /**
   * Get cache status for monitoring
   * @returns {object} - Current cache status
   */
  getCacheStatus() {
    const status = {};
    Object.keys(this.cache).forEach((key) => {
      status[key] = {
        cached: !!this.cache[key],
        timestamp: this.cacheTimestamps[key],
        age: this.cacheTimestamps[key] ? Date.now() - this.cacheTimestamps[key] : null,
        ttl: this.cacheTTLs[key] || this.cacheTTL,
        valid: this.isCacheValid(key),
      };
    });
    return status;
  }

  /**
   * Get default data structure for a file
   * @param {string} filename - File name
   * @returns {object} - Default data structure
   */
  getDefaultData(filename) {
    const defaults = {
      'blog.json': { posts: [] },
      'sns.json': { feeds: [] },
      'projects.json': { projects: [] },
      'config.json': {
        site: {
          title: 'Won Kim Portfolio',
          description: 'Portfolio showcasing projects and activities',
        },
      },
      'events.json': { events: [] },
      'news.json': { news: [] },
    };

    return defaults[filename] || {};
  }

  /**
   * Ensure data file exists, create with defaults if missing
   * Requirements: 2.1
   * @param {string} filename - File name
   * @returns {Promise<string>} - File path
   */
  async ensureDataFile(filename) {
    const filePath = path.join(this.dataDir, filename);

    try {
      // Check if file exists
      await fs.access(filePath);
      return filePath;
    } catch (error) {
      // File doesn't exist, create it with defaults
      console.log(`[ContentService] Creating missing file: ${filename}`);
      const defaultData = this.getDefaultData(filename);

      try {
        // Ensure directory exists
        await fs.mkdir(this.dataDir, { recursive: true });

        // Create file with default data
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        console.log(`[ContentService] ✓ Created ${filename} with default structure`);

        return filePath;
      } catch (writeError) {
        console.error(`[ContentService] ✗ Failed to create ${filename}:`, writeError.message);
        throw writeError;
      }
    }
  }

  /**
   * Read JSON file with error handling
   * Requirements: 2.1, 2.2, 8.1, 8.2, 8.3
   * @param {string} filename - File name
   * @returns {Promise<object>} - Parsed JSON data
   * @throws {Error} - If file cannot be read or parsed
   */
  async readJSONFile(filename) {
    try {
      // Ensure file exists first
      const filePath = await this.ensureDataFile(filename);

      // Read and parse file
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Log as warning - service degradation
      console.warn(`[ContentService] Failed to read ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Read JSON file safely, returning defaults if file is missing or invalid
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   * @param {string} filename - File name
   * @returns {Promise<object>} - Parsed JSON data or defaults
   */
  async readJSONFileSafe(filename) {
    try {
      // Try to read file normally
      return await this.readJSONFile(filename);
    } catch (error) {
      // If any error occurs, return defaults
      console.warn(`[ContentService] Using defaults for ${filename} due to error:`, error.message);
      return this.getDefaultData(filename);
    }
  }

  /**
   * Write JSON file
   * Requirements: 8.1, 8.2, 8.3
   */
  async writeJSONFile(filename, data) {
    try {
      const filePath = path.join(this.dataDir, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      // Log as warning - service degradation
      console.warn(`[ContentService] Failed to write ${filename}:`, error.message);
      throw error;
    }
  }

  // ==================== HERO SECTION ====================

  /**
   * Get hero content
   */
  async getHeroContent() {
    // Check cache first
    if (this.isCacheValid('hero')) {
      return this.cache.hero;
    }

    const config = await this.readJSONFile('config.json');
    const heroData = {
      title: config.site?.title || 'Won Kim Portfolio',
      subtitle: config.site?.description || 'Portfolio showcasing projects and activities',
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
    };

    // Validate
    const validated = HeroContentSchema.parse(heroData);

    // Cache and return
    this.setCache('hero', validated);
    return validated;
  }

  /**
   * Update hero content
   */
  async updateHeroContent(data, userId = 'admin') {
    // Validate input
    const validated = HeroContentSchema.parse({
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });

    // Read current config
    const config = await this.readJSONFile('config.json');

    // Update config with hero data
    config.site = config.site || {};
    config.site.title = validated.title;
    config.site.description = validated.subtitle;

    // Store hero-specific data (for future use)
    config.hero = validated;

    // Write back to file
    await this.writeJSONFile('config.json', config);

    // Invalidate cache
    this.invalidateCache('hero');

    return validated;
  }

  // ==================== BLOG POSTS ====================

  /**
   * Get all blog posts with optional filters
   */
  async getBlogPosts(filters = {}) {
    // Check cache first
    if (this.isCacheValid('blog') && !filters.status && !filters.tag) {
      return this.cache.blog;
    }

    const data = await this.readJSONFile('blog.json');
    let posts = data.posts || [];

    // Validate all posts
    posts = posts.map((post) => BlogPostSchema.parse(post));

    // Apply filters
    if (filters.status) {
      posts = posts.filter((post) => post.status === filters.status);
    }
    if (filters.tag) {
      posts = posts.filter((post) => post.tags?.includes(filters.tag));
    }

    // Cache if no filters
    if (!filters.status && !filters.tag) {
      this.setCache('blog', posts);
    }

    return posts;
  }

  /**
   * Get single blog post by ID
   */
  async getBlogPost(id) {
    const posts = await this.getBlogPosts();
    const post = posts.find((p) => p.id === id);

    if (!post) {
      throw new Error(`Blog post with ID ${id} not found`);
    }

    return post;
  }

  /**
   * Create new blog post
   */
  async createBlogPost(data, userId = 'admin') {
    const data_file = await this.readJSONFile('blog.json');
    const posts = data_file.posts || [];

    // Generate ID if not provided
    const newId = data.id || String(Math.max(0, ...posts.map((p) => parseInt(p.id) || 0)) + 1);

    // Validate and create post
    const newPost = BlogPostSchema.parse({
      ...data,
      id: newId,
      publishedAt: data.status === 'published' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });

    // Add to posts array
    posts.push(newPost);

    // Write back to file
    await this.writeJSONFile('blog.json', { posts });

    // Invalidate cache
    this.invalidateCache('blog');

    return newPost;
  }

  /**
   * Update existing blog post
   */
  async updateBlogPost(id, data, userId = 'admin') {
    const data_file = await this.readJSONFile('blog.json');
    const posts = data_file.posts || [];

    const index = posts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Blog post with ID ${id} not found`);
    }

    // Merge with existing data
    const updatedPost = BlogPostSchema.parse({
      ...posts[index],
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    });

    // Update in array
    posts[index] = updatedPost;

    // Write back to file
    await this.writeJSONFile('blog.json', { posts });

    // Invalidate cache
    this.invalidateCache('blog');

    return updatedPost;
  }

  /**
   * Delete blog post
   */
  async deleteBlogPost(id) {
    const data_file = await this.readJSONFile('blog.json');
    let posts = data_file.posts || [];

    const initialLength = posts.length;
    posts = posts.filter((p) => p.id !== id);

    if (posts.length === initialLength) {
      throw new Error(`Blog post with ID ${id} not found`);
    }

    // Write back to file
    await this.writeJSONFile('blog.json', { posts });

    // Invalidate cache
    this.invalidateCache('blog');
  }

  // ==================== PROJECTS ====================

  /**
   * Get all projects
   */
  async getProjects() {
    // Check cache first
    if (this.isCacheValid('projects')) {
      return this.cache.projects;
    }

    const data = await this.readJSONFile('projects.json');
    let projects = data.projects || [];

    // Validate all projects
    projects = projects.map((project) => ProjectSchema.parse(project));

    // Sort by order
    projects.sort((a, b) => a.order - b.order);

    // Cache and return
    this.setCache('projects', projects);
    return projects;
  }

  /**
   * Get single project by ID
   */
  async getProject(id) {
    const projects = await this.getProjects();
    const project = projects.find((p) => p.id === id);

    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    return project;
  }

  /**
   * Create new project
   */
  async createProject(data, userId = 'admin') {
    const data_file = await this.readJSONFile('projects.json');
    const projects = data_file.projects || [];

    // Generate ID if not provided
    const newId = data.id || String(Math.max(0, ...projects.map((p) => parseInt(p.id) || 0)) + 1);

    // Validate and create project
    const newProject = ProjectSchema.parse({
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Add to projects array
    projects.push(newProject);

    // Write back to file
    await this.writeJSONFile('projects.json', { projects });

    // Invalidate cache
    this.invalidateCache('projects');

    return newProject;
  }

  /**
   * Update existing project
   */
  async updateProject(id, data, userId = 'admin') {
    const data_file = await this.readJSONFile('projects.json');
    const projects = data_file.projects || [];

    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Merge with existing data
    const updatedProject = ProjectSchema.parse({
      ...projects[index],
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    });

    // Update in array
    projects[index] = updatedProject;

    // Write back to file
    await this.writeJSONFile('projects.json', { projects });

    // Invalidate cache
    this.invalidateCache('projects');

    return updatedProject;
  }

  /**
   * Delete project
   */
  async deleteProject(id) {
    const data_file = await this.readJSONFile('projects.json');
    let projects = data_file.projects || [];

    const initialLength = projects.length;
    projects = projects.filter((p) => p.id !== id);

    if (projects.length === initialLength) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Write back to file
    await this.writeJSONFile('projects.json', { projects });

    // Invalidate cache
    this.invalidateCache('projects');
  }

  // ==================== SNS FEEDS ====================

  /**
   * Get all SNS feeds
   */
  async getSNSFeeds(filters = {}) {
    // Check cache first
    if (this.isCacheValid('sns') && !filters.platform) {
      return this.cache.sns;
    }

    const data = await this.readJSONFile('sns.json');
    let feeds = data.feeds || [];

    // Validate all feeds
    feeds = feeds.map((feed) => SNSFeedSchema.parse(feed));

    // Apply filters
    if (filters.platform) {
      feeds = feeds.filter((feed) => feed.platform === filters.platform);
    }

    // Sort by timestamp (newest first)
    feeds.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Cache if no filters
    if (!filters.platform) {
      this.setCache('sns', feeds);
    }

    return feeds;
  }

  /**
   * Get single SNS feed by ID
   */
  async getSNSFeed(id) {
    const feeds = await this.getSNSFeeds();
    const feed = feeds.find((f) => f.id === id);

    if (!feed) {
      throw new Error(`SNS feed with ID ${id} not found`);
    }

    return feed;
  }

  /**
   * Create new SNS feed
   */
  async createSNSFeed(data, userId = 'admin') {
    const data_file = await this.readJSONFile('sns.json');
    const feeds = data_file.feeds || [];

    // Generate ID if not provided
    const newId = data.id || String(Math.max(0, ...feeds.map((f) => parseInt(f.id) || 0)) + 1);

    // Validate and create feed
    const newFeed = SNSFeedSchema.parse({
      ...data,
      id: newId,
      timestamp: data.timestamp || new Date().toISOString(),
    });

    // Add to feeds array
    feeds.push(newFeed);

    // Write back to file
    await this.writeJSONFile('sns.json', { feeds });

    // Invalidate cache
    this.invalidateCache('sns');

    return newFeed;
  }

  /**
   * Update existing SNS feed
   */
  async updateSNSFeed(id, data, userId = 'admin') {
    const data_file = await this.readJSONFile('sns.json');
    const feeds = data_file.feeds || [];

    const index = feeds.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`SNS feed with ID ${id} not found`);
    }

    // Merge with existing data
    const updatedFeed = SNSFeedSchema.parse({
      ...feeds[index],
      ...data,
      id, // Ensure ID doesn't change
    });

    // Update in array
    feeds[index] = updatedFeed;

    // Write back to file
    await this.writeJSONFile('sns.json', { feeds });

    // Invalidate cache
    this.invalidateCache('sns');

    return updatedFeed;
  }

  /**
   * Delete SNS feed
   */
  async deleteSNSFeed(id) {
    const data_file = await this.readJSONFile('sns.json');
    let feeds = data_file.feeds || [];

    const initialLength = feeds.length;
    feeds = feeds.filter((f) => f.id !== id);

    if (feeds.length === initialLength) {
      throw new Error(`SNS feed with ID ${id} not found`);
    }

    // Write back to file
    await this.writeJSONFile('sns.json', { feeds });

    // Invalidate cache
    this.invalidateCache('sns');
  }

  // ==================== CONTACT INFO ====================

  /**
   * Get contact information
   */
  async getContactInfo() {
    // Check cache first
    if (this.isCacheValid('contact')) {
      return this.cache.contact;
    }

    try {
      const data = await this.readJSONFile('contact.json');

      // Cache and return
      this.setCache('contact', data);
      return data;
    } catch (error) {
      // Return default contact info if file doesn't exist
      const defaultData = {
        contact: {
          email: 'hello@example.com',
          phone: '+1 234 567 8900',
          address: 'City, Country',
          socialMedia: {},
        },
      };

      // Cache default data
      this.setCache('contact', defaultData);
      return defaultData;
    }
  }

  /**
   * Update contact information
   */
  async updateContactInfo(data, userId = 'admin') {
    const contactData = {
      contact: data.contact,
      footer: data.footer,
      map: data.map,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    await this.writeJSONFile('contact.json', contactData);

    // Invalidate cache
    this.invalidateCache('contact');

    return contactData;
  }

  /**
   * Get about content
   */
  async getAboutContent() {
    // Check cache first
    if (this.isCacheValid('about')) {
      return this.cache.about;
    }

    try {
      const aboutData = await this.readJSONFile('about.json');

      // Cache and return
      this.setCache('about', aboutData);
      return aboutData;
    } catch (error) {
      // Return default about content if file doesn't exist
      const defaultData = {
        profileImage: '',
        name: '',
        title: '',
        biography: '',
        certifications: [],
        careerTimeline: [],
      };

      // Cache default data
      this.setCache('about', defaultData);
      return defaultData;
    }
  }

  /**
   * Update about content
   */
  async updateAboutContent(data, userId = 'admin') {
    const aboutData = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    await this.writeJSONFile('about.json', aboutData);

    // Invalidate cache
    this.invalidateCache('about');

    return aboutData;
  }
}

// Export singleton instance
export default new ContentService();
