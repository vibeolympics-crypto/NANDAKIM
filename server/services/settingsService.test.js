import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock fs module
vi.mock('fs/promises');

describe('SettingsService', () => {
  let SettingsService;
  const testSettingsPath = path.join(__dirname, '../data/settings.json');

  const defaultSettings = {
    siteName: 'Test Portfolio',
    siteDescription: 'Test Description',
    contactEmail: 'test@example.com',
    socialMedia: {
      twitter: 'https://twitter.com/test',
      linkedin: 'https://linkedin.com/in/test',
    },
    seo: {
      keywords: ['test', 'portfolio'],
      ogImage: '/images/og-image.jpg',
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock fs.readFile to return default settings
    fs.readFile.mockResolvedValue(JSON.stringify(defaultSettings));

    // Mock fs.writeFile
    fs.writeFile.mockResolvedValue();

    // Mock fs.mkdir
    fs.mkdir.mockResolvedValue();

    // Dynamically import the service
    const module = await import('./settingsService.js');
    SettingsService = module.default || module.SettingsService;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('getSettings', () => {
    it('should read and return settings from file', async () => {
      const settings = await SettingsService.getSettings();

      expect(fs.readFile).toHaveBeenCalledWith(testSettingsPath, 'utf-8');
      expect(settings).toEqual(defaultSettings);
    });

    it('should return default settings if file does not exist', async () => {
      fs.readFile.mockRejectedValue({ code: 'ENOENT' });

      const settings = await SettingsService.getSettings();

      expect(settings).toBeDefined();
      expect(settings.siteName).toBeDefined();
    });

    it('should throw error for other file read errors', async () => {
      fs.readFile.mockRejectedValue(new Error('Permission denied'));

      await expect(SettingsService.getSettings()).rejects.toThrow();
    });
  });

  describe('updateSettings', () => {
    it('should update settings and write to file', async () => {
      const updates = {
        siteName: 'Updated Portfolio',
        contactEmail: 'updated@example.com',
      };

      const result = await SettingsService.updateSettings(updates);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(result.siteName).toBe(updates.siteName);
      expect(result.contactEmail).toBe(updates.contactEmail);
    });

    it('should merge updates with existing settings', async () => {
      const updates = {
        siteName: 'New Name',
      };

      const result = await SettingsService.updateSettings(updates);

      expect(result.siteName).toBe('New Name');
      expect(result.siteDescription).toBe(defaultSettings.siteDescription);
    });

    it('should create directory if it does not exist', async () => {
      fs.writeFile.mockRejectedValueOnce({ code: 'ENOENT' });
      fs.writeFile.mockResolvedValueOnce();

      await SettingsService.updateSettings({ siteName: 'Test' });

      expect(fs.mkdir).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidUpdates = {
        siteName: '',
      };

      await expect(SettingsService.updateSettings(invalidUpdates)).rejects.toThrow();
    });
  });

  describe('resetSettings', () => {
    it('should reset settings to defaults', async () => {
      const result = await SettingsService.resetSettings();

      expect(fs.writeFile).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.siteName).toBeDefined();
    });
  });

  describe('getSetting', () => {
    it('should get a specific setting by key', async () => {
      const siteName = await SettingsService.getSetting('siteName');

      expect(siteName).toBe(defaultSettings.siteName);
    });

    it('should get nested setting by dot notation', async () => {
      const twitter = await SettingsService.getSetting('socialMedia.twitter');

      expect(twitter).toBe(defaultSettings.socialMedia.twitter);
    });

    it('should return undefined for non-existent key', async () => {
      const value = await SettingsService.getSetting('nonExistent');

      expect(value).toBeUndefined();
    });
  });

  describe('updateSetting', () => {
    it('should update a specific setting by key', async () => {
      const newName = 'New Site Name';
      const result = await SettingsService.updateSetting('siteName', newName);

      expect(result.siteName).toBe(newName);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should update nested setting by dot notation', async () => {
      const newTwitter = 'https://twitter.com/newhandle';
      const result = await SettingsService.updateSetting('socialMedia.twitter', newTwitter);

      expect(result.socialMedia.twitter).toBe(newTwitter);
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parse errors', async () => {
      fs.readFile.mockResolvedValue('invalid json');

      await expect(SettingsService.getSettings()).rejects.toThrow();
    });

    it('should handle write errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('Disk full'));

      await expect(SettingsService.updateSettings({ siteName: 'Test' })).rejects.toThrow();
    });
  });
});
