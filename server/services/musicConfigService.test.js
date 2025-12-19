/**
 * Music Configuration Service Tests
 * Tests configuration loading, saving, validation, and default values
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as configService from './musicConfigService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DATA_FILE = path.join(__dirname, '../data/music-playlist-test.json');
const ORIGINAL_DATA_FILE = path.join(__dirname, '../data/music-playlist.json');

// Mock the DATA_FILE path for testing
let originalDataFile;

describe('Music Configuration Service', () => {
  beforeEach(async () => {
    // Backup original file if it exists
    try {
      const data = await fs.readFile(ORIGINAL_DATA_FILE, 'utf-8');
      originalDataFile = data;
    } catch (error) {
      originalDataFile = null;
    }
  });

  afterEach(async () => {
    // Restore original file
    if (originalDataFile) {
      await fs.writeFile(ORIGINAL_DATA_FILE, originalDataFile, 'utf-8');
    }

    // Clean up test file
    try {
      await fs.unlink(TEST_DATA_FILE);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = configService.getDefaultConfig();

      expect(config).toHaveProperty('enabled', true);
      expect(config).toHaveProperty('autoplay', true);
      expect(config).toHaveProperty('defaultVolume', 70);
      expect(config).toHaveProperty('playbackMode', 'random');
      expect(config).toHaveProperty('position', 'bottom-right');
      expect(config).toHaveProperty('maxTracks', 50);
      expect(config).toHaveProperty('attribution');
      expect(config.attribution).toHaveProperty('text');
      expect(config.attribution).toHaveProperty('showSunoAI', true);
    });

    it('should return a copy, not reference', () => {
      const config1 = configService.getDefaultConfig();
      const config2 = configService.getDefaultConfig();

      config1.enabled = false;
      expect(config2.enabled).toBe(true);
    });
  });

  describe('validateConfigField', () => {
    it('should validate enabled field', () => {
      expect(configService.validateConfigField('enabled', true).valid).toBe(true);
      expect(configService.validateConfigField('enabled', false).valid).toBe(true);
      expect(configService.validateConfigField('enabled', 'true').valid).toBe(false);
      expect(configService.validateConfigField('enabled', 1).valid).toBe(false);
    });

    it('should validate autoplay field', () => {
      expect(configService.validateConfigField('autoplay', true).valid).toBe(true);
      expect(configService.validateConfigField('autoplay', false).valid).toBe(true);
      expect(configService.validateConfigField('autoplay', 'false').valid).toBe(false);
    });

    it('should validate defaultVolume field', () => {
      expect(configService.validateConfigField('defaultVolume', 0).valid).toBe(true);
      expect(configService.validateConfigField('defaultVolume', 50).valid).toBe(true);
      expect(configService.validateConfigField('defaultVolume', 100).valid).toBe(true);
      expect(configService.validateConfigField('defaultVolume', -1).valid).toBe(false);
      expect(configService.validateConfigField('defaultVolume', 101).valid).toBe(false);
      expect(configService.validateConfigField('defaultVolume', 'fifty').valid).toBe(false);
    });

    it('should validate playbackMode field', () => {
      expect(configService.validateConfigField('playbackMode', 'random').valid).toBe(true);
      expect(configService.validateConfigField('playbackMode', 'sequential').valid).toBe(true);
      expect(configService.validateConfigField('playbackMode', 'shuffle').valid).toBe(false);
      expect(configService.validateConfigField('playbackMode', '').valid).toBe(false);
    });

    it('should validate position field', () => {
      expect(configService.validateConfigField('position', 'bottom-right').valid).toBe(true);
      expect(configService.validateConfigField('position', 'bottom-left').valid).toBe(true);
      expect(configService.validateConfigField('position', 'top-right').valid).toBe(true);
      expect(configService.validateConfigField('position', 'top-left').valid).toBe(true);
      expect(configService.validateConfigField('position', 'floating').valid).toBe(true);
      expect(configService.validateConfigField('position', 'center').valid).toBe(false);
      expect(configService.validateConfigField('position', '').valid).toBe(false);
    });

    it('should validate maxTracks field', () => {
      expect(configService.validateConfigField('maxTracks', 1).valid).toBe(true);
      expect(configService.validateConfigField('maxTracks', 25).valid).toBe(true);
      expect(configService.validateConfigField('maxTracks', 50).valid).toBe(true);
      expect(configService.validateConfigField('maxTracks', 0).valid).toBe(false);
      expect(configService.validateConfigField('maxTracks', 51).valid).toBe(false);
      expect(configService.validateConfigField('maxTracks', -5).valid).toBe(false);
    });

    it('should validate attribution field', () => {
      expect(
        configService.validateConfigField('attribution', {
          text: 'Custom text',
          showSunoAI: true,
        }).valid
      ).toBe(true);

      expect(
        configService.validateConfigField('attribution', {
          text: 'Custom text',
        }).valid
      ).toBe(true);

      expect(
        configService.validateConfigField('attribution', {
          showSunoAI: false,
        }).valid
      ).toBe(true);

      expect(configService.validateConfigField('attribution', {}).valid).toBe(true);

      expect(
        configService.validateConfigField('attribution', {
          text: 123,
        }).valid
      ).toBe(false);

      expect(
        configService.validateConfigField('attribution', {
          showSunoAI: 'yes',
        }).valid
      ).toBe(false);

      expect(configService.validateConfigField('attribution', null).valid).toBe(false);
      expect(configService.validateConfigField('attribution', 'string').valid).toBe(false);
    });

    it('should reject unknown fields', () => {
      const result = configService.validateConfigField('unknownField', 'value');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown configuration field');
    });
  });

  describe('validateConfig', () => {
    it('should validate complete valid configuration', () => {
      const config = {
        enabled: true,
        autoplay: false,
        defaultVolume: 80,
        playbackMode: 'sequential',
        position: 'top-left',
        maxTracks: 30,
        attribution: {
          text: 'Test attribution',
          showSunoAI: false,
        },
      };

      const result = configService.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should detect multiple validation errors', () => {
      const config = {
        enabled: 'yes',
        defaultVolume: 150,
        playbackMode: 'invalid',
        position: 'center',
      };

      const result = configService.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });

    it('should validate partial configuration updates', () => {
      const config = {
        defaultVolume: 75,
        playbackMode: 'random',
      };

      const result = configService.validateConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('should load existing configuration', async () => {
      // Create test data
      const testData = {
        config: {
          enabled: false,
          autoplay: false,
          defaultVolume: 50,
          playbackMode: 'sequential',
          position: 'top-right',
          maxTracks: 25,
          attribution: {
            text: 'Test text',
            showSunoAI: false,
          },
        },
        tracks: [],
      };

      await fs.writeFile(ORIGINAL_DATA_FILE, JSON.stringify(testData, null, 2), 'utf-8');

      const config = await configService.loadConfig();

      expect(config.enabled).toBe(false);
      expect(config.autoplay).toBe(false);
      expect(config.defaultVolume).toBe(50);
      expect(config.playbackMode).toBe('sequential');
      expect(config.position).toBe('top-right');
    });

    it('should return defaults when file does not exist', async () => {
      // Remove file if it exists
      try {
        await fs.unlink(ORIGINAL_DATA_FILE);
      } catch (error) {
        // Ignore
      }

      const config = await configService.loadConfig();
      const defaults = configService.getDefaultConfig();

      expect(config).toEqual(defaults);
    });

    it('should merge with defaults for missing fields', async () => {
      // Create partial config
      const testData = {
        config: {
          enabled: false,
          defaultVolume: 60,
        },
        tracks: [],
      };

      await fs.writeFile(ORIGINAL_DATA_FILE, JSON.stringify(testData, null, 2), 'utf-8');

      const config = await configService.loadConfig();

      expect(config.enabled).toBe(false);
      expect(config.defaultVolume).toBe(60);
      expect(config.autoplay).toBe(true); // From defaults
      expect(config.playbackMode).toBe('random'); // From defaults
    });
  });

  describe('saveConfig', () => {
    it('should save valid configuration updates', async () => {
      const updates = {
        enabled: false,
        defaultVolume: 85,
        playbackMode: 'sequential',
      };

      const savedConfig = await configService.saveConfig(updates);

      expect(savedConfig.enabled).toBe(false);
      expect(savedConfig.defaultVolume).toBe(85);
      expect(savedConfig.playbackMode).toBe('sequential');

      // Verify persistence
      const loadedConfig = await configService.loadConfig();
      expect(loadedConfig.enabled).toBe(false);
      expect(loadedConfig.defaultVolume).toBe(85);
      expect(loadedConfig.playbackMode).toBe('sequential');
    });

    it('should reject invalid configuration', async () => {
      const updates = {
        defaultVolume: 150,
      };

      await expect(configService.saveConfig(updates)).rejects.toThrow('validation failed');
    });

    it('should handle attribution updates', async () => {
      const updates = {
        attribution: {
          text: 'New attribution text',
          showSunoAI: false,
        },
      };

      const savedConfig = await configService.saveConfig(updates);

      expect(savedConfig.attribution.text).toBe('New attribution text');
      expect(savedConfig.attribution.showSunoAI).toBe(false);
    });

    it('should preserve existing config when updating partial fields', async () => {
      // Set initial config
      await configService.saveConfig({
        enabled: false,
        defaultVolume: 60,
        playbackMode: 'sequential',
      });

      // Update only one field
      await configService.saveConfig({
        defaultVolume: 80,
      });

      const config = await configService.loadConfig();
      expect(config.enabled).toBe(false);
      expect(config.defaultVolume).toBe(80);
      expect(config.playbackMode).toBe('sequential');
    });
  });

  describe('resetConfig', () => {
    it('should reset configuration to defaults', async () => {
      // Set custom config
      await configService.saveConfig({
        enabled: false,
        defaultVolume: 30,
        playbackMode: 'sequential',
      });

      // Reset
      const resetConfig = await configService.resetConfig();
      const defaults = configService.getDefaultConfig();

      expect(resetConfig).toEqual(defaults);

      // Verify persistence
      const loadedConfig = await configService.loadConfig();
      expect(loadedConfig).toEqual(defaults);
    });
  });

  describe('updateConfigField', () => {
    it('should update single field', async () => {
      const config = await configService.updateConfigField('defaultVolume', 90);

      expect(config.defaultVolume).toBe(90);
    });

    it('should reject invalid field value', async () => {
      await expect(configService.updateConfigField('defaultVolume', 150)).rejects.toThrow(
        'between 0 and 100'
      );
    });

    it('should reject invalid playback mode', async () => {
      await expect(configService.updateConfigField('playbackMode', 'invalid')).rejects.toThrow(
        'random'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle volume at boundaries', async () => {
      await configService.updateConfigField('defaultVolume', 0);
      let config = await configService.loadConfig();
      expect(config.defaultVolume).toBe(0);

      await configService.updateConfigField('defaultVolume', 100);
      config = await configService.loadConfig();
      expect(config.defaultVolume).toBe(100);
    });

    it('should handle maxTracks at boundaries', async () => {
      await configService.updateConfigField('maxTracks', 1);
      let config = await configService.loadConfig();
      expect(config.maxTracks).toBe(1);

      await configService.updateConfigField('maxTracks', 50);
      config = await configService.loadConfig();
      expect(config.maxTracks).toBe(50);
    });

    it('should handle empty attribution updates', async () => {
      const config = await configService.saveConfig({
        attribution: {},
      });

      expect(config.attribution).toBeDefined();
      expect(config.attribution.text).toBeDefined();
      expect(config.attribution.showSunoAI).toBeDefined();
    });
  });
});
