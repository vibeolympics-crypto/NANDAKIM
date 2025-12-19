/**
 * Tests for Content Service safe file operations
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ContentService from './contentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, '../../src/data-test');

describe('ContentService Safe File Operations', () => {
  let originalDataDir;

  beforeEach(async () => {
    // Save original data directory
    originalDataDir = ContentService.dataDir;

    // Use test directory
    ContentService.dataDir = TEST_DATA_DIR;

    // Create test directory
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });

    // Clear cache
    ContentService.invalidateAllCaches();
  });

  afterEach(async () => {
    // Restore original data directory
    ContentService.dataDir = originalDataDir;

    // Clean up test directory
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('ensureDataFile', () => {
    it('should create missing file with defaults', async () => {
      const filename = 'blog.json';
      const filePath = await ContentService.ensureDataFile(filename);

      // Check file was created
      expect(filePath).toBe(path.join(TEST_DATA_DIR, filename));

      // Check file exists
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      // Check file has default structure
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      expect(data).toEqual({ posts: [] });
    });

    it('should return existing file path without modification', async () => {
      const filename = 'projects.json';
      const testData = { projects: [{ id: '1', title: 'Test' }] };

      // Create file first
      await fs.writeFile(path.join(TEST_DATA_DIR, filename), JSON.stringify(testData), 'utf-8');

      // Ensure file
      const filePath = await ContentService.ensureDataFile(filename);

      // Check file wasn't modified
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      expect(data).toEqual(testData);
    });

    it('should create directory if it does not exist', async () => {
      // Remove test directory
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });

      const filename = 'sns.json';
      await ContentService.ensureDataFile(filename);

      // Check directory was created
      const dirExists = await fs
        .access(TEST_DATA_DIR)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });
  });

  describe('readJSONFile', () => {
    it('should read existing file', async () => {
      const filename = 'blog.json';
      const testData = { posts: [{ id: '1', title: 'Test Post' }] };

      // Create file
      await fs.writeFile(path.join(TEST_DATA_DIR, filename), JSON.stringify(testData), 'utf-8');

      // Read file
      const data = await ContentService.readJSONFile(filename);
      expect(data).toEqual(testData);
    });

    it('should create and read missing file with defaults', async () => {
      const filename = 'projects.json';

      // Read missing file
      const data = await ContentService.readJSONFile(filename);

      // Should return default structure
      expect(data).toEqual({ projects: [] });

      // File should now exist
      const exists = await fs
        .access(path.join(TEST_DATA_DIR, filename))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should throw error for invalid JSON', async () => {
      const filename = 'invalid.json';

      // Create invalid JSON file
      await fs.writeFile(path.join(TEST_DATA_DIR, filename), 'invalid json content', 'utf-8');

      // Should throw error
      await expect(ContentService.readJSONFile(filename)).rejects.toThrow();
    });
  });

  describe('readJSONFileSafe', () => {
    it('should read existing valid file', async () => {
      const filename = 'sns.json';
      const testData = { feeds: [{ id: '1', platform: 'twitter' }] };

      // Create file
      await fs.writeFile(path.join(TEST_DATA_DIR, filename), JSON.stringify(testData), 'utf-8');

      // Read file safely
      const data = await ContentService.readJSONFileSafe(filename);
      expect(data).toEqual(testData);
    });

    it('should return defaults for missing file', async () => {
      const filename = 'blog.json';

      // Read missing file safely
      const data = await ContentService.readJSONFileSafe(filename);

      // Should return defaults without throwing
      expect(data).toEqual({ posts: [] });
    });

    it('should return defaults for invalid JSON', async () => {
      const filename = 'config.json';

      // Create invalid JSON file
      await fs.writeFile(path.join(TEST_DATA_DIR, filename), 'invalid json', 'utf-8');

      // Should return defaults without throwing
      const data = await ContentService.readJSONFileSafe(filename);
      expect(data).toEqual({
        site: {
          title: 'Won Kim Portfolio',
          description: 'Portfolio showcasing projects and activities',
        },
      });
    });
  });

  describe('warmCache', () => {
    it('should warm cache successfully when all files exist', async () => {
      // Create all required files
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'blog.json'),
        JSON.stringify({ posts: [] }),
        'utf-8'
      );
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'projects.json'),
        JSON.stringify({ projects: [] }),
        'utf-8'
      );
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'sns.json'),
        JSON.stringify({ feeds: [] }),
        'utf-8'
      );
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'config.json'),
        JSON.stringify({ site: { title: 'Test', description: 'Test' } }),
        'utf-8'
      );

      // Warm cache
      const results = await ContentService.warmCache();

      // All should succeed
      expect(results.hero).toBe(true);
      expect(results.blog).toBe(true);
      expect(results.projects).toBe(true);
      expect(results.sns).toBe(true);
    });

    it('should continue warming cache even if one file fails', async () => {
      // Create only some files
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'blog.json'),
        JSON.stringify({ posts: [] }),
        'utf-8'
      );
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'projects.json'),
        JSON.stringify({ projects: [] }),
        'utf-8'
      );

      // Create invalid config file
      await fs.writeFile(path.join(TEST_DATA_DIR, 'config.json'), 'invalid json', 'utf-8');

      // Warm cache - should not throw
      const results = await ContentService.warmCache();

      // Some should succeed, hero might fail due to invalid config
      expect(results.blog).toBe(true);
      expect(results.projects).toBe(true);
    });

    it('should return results object with status for each content type', async () => {
      // Create all files
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'blog.json'),
        JSON.stringify({ posts: [] }),
        'utf-8'
      );
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'projects.json'),
        JSON.stringify({ projects: [] }),
        'utf-8'
      );
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'sns.json'),
        JSON.stringify({ feeds: [] }),
        'utf-8'
      );
      await fs.writeFile(
        path.join(TEST_DATA_DIR, 'config.json'),
        JSON.stringify({ site: { title: 'Test', description: 'Test' } }),
        'utf-8'
      );

      const results = await ContentService.warmCache();

      // Check results structure
      expect(results).toHaveProperty('hero');
      expect(results).toHaveProperty('blog');
      expect(results).toHaveProperty('projects');
      expect(results).toHaveProperty('sns');
      expect(typeof results.hero).toBe('boolean');
      expect(typeof results.blog).toBe('boolean');
      expect(typeof results.projects).toBe('boolean');
      expect(typeof results.sns).toBe('boolean');
    });
  });

  describe('getDefaultData', () => {
    it('should return correct defaults for blog.json', () => {
      const defaults = ContentService.getDefaultData('blog.json');
      expect(defaults).toEqual({ posts: [] });
    });

    it('should return correct defaults for sns.json', () => {
      const defaults = ContentService.getDefaultData('sns.json');
      expect(defaults).toEqual({ feeds: [] });
    });

    it('should return correct defaults for projects.json', () => {
      const defaults = ContentService.getDefaultData('projects.json');
      expect(defaults).toEqual({ projects: [] });
    });

    it('should return correct defaults for config.json', () => {
      const defaults = ContentService.getDefaultData('config.json');
      expect(defaults).toEqual({
        site: {
          title: 'Won Kim Portfolio',
          description: 'Portfolio showcasing projects and activities',
        },
      });
    });

    it('should return empty object for unknown file', () => {
      const defaults = ContentService.getDefaultData('unknown.json');
      expect(defaults).toEqual({});
    });
  });
});
