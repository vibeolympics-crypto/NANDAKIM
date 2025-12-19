/**
 * Music Configuration Service
 * Manages playlist configuration with validation and default values
 * Requirements: 2.1, 8.3, 8.4, 8.5
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data/music-playlist.json');

/**
 * Default playlist configuration
 * Provides sensible defaults for all configuration options
 * Requirements: 2.1, 8.3, 8.4, 8.5, 5.1, 5.2
 */
const DEFAULT_CONFIG = {
  enabled: true,
  autoplay: true,
  defaultVolume: 70,
  playbackMode: 'random',
  position: 'bottom-right',
  maxTracks: 50,
  visibility: {
    showOnWeb: true,
    showOnMobile: true,
  },
  attribution: {
    text: 'Music created by the website operator using AI',
    showSunoAI: true,
  },
};

/**
 * Configuration validation rules
 */
const VALIDATION_RULES = {
  enabled: {
    type: 'boolean',
    validate: (value) => typeof value === 'boolean',
    errorMessage: 'Enabled must be a boolean value',
  },
  autoplay: {
    type: 'boolean',
    validate: (value) => typeof value === 'boolean',
    errorMessage: 'Autoplay must be a boolean value',
  },
  defaultVolume: {
    type: 'number',
    validate: (value) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    errorMessage: 'Default volume must be a number between 0 and 100',
  },
  playbackMode: {
    type: 'string',
    validate: (value) => ['random', 'sequential'].includes(value),
    errorMessage: 'Playback mode must be "random" or "sequential"',
  },
  position: {
    type: 'string',
    validate: (value) => {
      const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'floating'];
      return validPositions.includes(value);
    },
    errorMessage:
      'Position must be one of: bottom-right, bottom-left, top-right, top-left, floating',
  },
  maxTracks: {
    type: 'number',
    validate: (value) => {
      const num = Number(value);
      return !isNaN(num) && num > 0 && num <= 50;
    },
    errorMessage: 'Max tracks must be a number between 1 and 50',
  },
  visibility: {
    type: 'object',
    validate: (value) => {
      if (typeof value !== 'object' || value === null) return false;
      if (value.showOnWeb !== undefined && typeof value.showOnWeb !== 'boolean') return false;
      if (value.showOnMobile !== undefined && typeof value.showOnMobile !== 'boolean') return false;
      return true;
    },
    errorMessage:
      'Visibility must be an object with optional showOnWeb (boolean) and showOnMobile (boolean) properties',
  },
  attribution: {
    type: 'object',
    validate: (value) => {
      if (typeof value !== 'object' || value === null) return false;
      if (value.text !== undefined && typeof value.text !== 'string') return false;
      if (value.showSunoAI !== undefined && typeof value.showSunoAI !== 'boolean') return false;
      return true;
    },
    errorMessage:
      'Attribution must be an object with optional text (string) and showSunoAI (boolean) properties',
  },
};

/**
 * Load playlist data from file
 * @returns {Promise<Object>} Playlist data with config and tracks
 */
async function loadPlaylistData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return default structure if file doesn't exist
    return {
      config: { ...DEFAULT_CONFIG },
      tracks: [],
    };
  }
}

/**
 * Save playlist data to file
 * @param {Object} data - Playlist data to save
 * @returns {Promise<void>}
 */
async function savePlaylistData(data) {
  // Ensure data directory exists
  const dataDir = path.dirname(DATA_FILE);
  await fs.mkdir(dataDir, { recursive: true });

  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get default configuration
 * Returns a copy of the default configuration
 * Requirements: 2.1
 * @returns {Object} Default configuration
 */
function getDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

/**
 * Validate a single configuration field
 * Requirements: 8.3, 8.4, 8.5
 * @param {string} field - Configuration field name
 * @param {*} value - Value to validate
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
function validateConfigField(field, value) {
  const rule = VALIDATION_RULES[field];

  if (!rule) {
    return {
      valid: false,
      error: `Unknown configuration field: ${field}`,
    };
  }

  if (!rule.validate(value)) {
    return {
      valid: false,
      error: rule.errorMessage,
    };
  }

  return { valid: true };
}

/**
 * Validate entire configuration object
 * Requirements: 8.3, 8.4, 8.5
 * @param {Object} config - Configuration object to validate
 * @returns {Object} Validation result { valid: boolean, errors?: Array }
 */
function validateConfig(config) {
  const errors = [];

  for (const [field, value] of Object.entries(config)) {
    const result = validateConfigField(field, value);
    if (!result.valid) {
      errors.push({ field, error: result.error });
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return { valid: true };
}

/**
 * Load playlist configuration
 * Returns current configuration or default if not found
 * Requirements: 2.1, 8.3, 8.4, 8.5, 5.1, 5.2
 * @returns {Promise<Object>} Current configuration
 */
async function loadConfig() {
  const playlistData = await loadPlaylistData();

  // Merge with defaults to ensure all fields are present
  return {
    ...DEFAULT_CONFIG,
    ...playlistData.config,
    visibility: {
      ...DEFAULT_CONFIG.visibility,
      ...(playlistData.config?.visibility || {}),
    },
    attribution: {
      ...DEFAULT_CONFIG.attribution,
      ...(playlistData.config?.attribution || {}),
    },
  };
}

/**
 * Save playlist configuration
 * Validates and saves configuration updates
 * Requirements: 8.3, 8.4, 8.5, 5.1, 5.2
 * @param {Object} configUpdates - Configuration fields to update
 * @returns {Promise<Object>} Updated configuration
 */
async function saveConfig(configUpdates) {
  // Validate updates
  const validation = validateConfig(configUpdates);
  if (!validation.valid) {
    const errorMessages = validation.errors.map((e) => `${e.field}: ${e.error}`).join('; ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }

  // Load current data
  const playlistData = await loadPlaylistData();

  // Update configuration fields
  const updatedConfig = {
    ...playlistData.config,
    ...configUpdates,
  };

  // Handle nested visibility object specially
  if (configUpdates.visibility) {
    updatedConfig.visibility = {
      ...playlistData.config.visibility,
      ...configUpdates.visibility,
    };
  }

  // Handle nested attribution object specially
  if (configUpdates.attribution) {
    updatedConfig.attribution = {
      ...playlistData.config.attribution,
      ...configUpdates.attribution,
    };
  }

  // Save updated data
  playlistData.config = updatedConfig;
  await savePlaylistData(playlistData);

  return updatedConfig;
}

/**
 * Reset configuration to defaults
 * Requirements: 2.1
 * @returns {Promise<Object>} Default configuration
 */
async function resetConfig() {
  const playlistData = await loadPlaylistData();
  playlistData.config = { ...DEFAULT_CONFIG };
  await savePlaylistData(playlistData);
  return playlistData.config;
}

/**
 * Update a single configuration field
 * Convenience method for updating individual fields
 * Requirements: 8.3, 8.4, 8.5
 * @param {string} field - Configuration field name
 * @param {*} value - New value
 * @returns {Promise<Object>} Updated configuration
 */
async function updateConfigField(field, value) {
  // Validate single field
  const validation = validateConfigField(field, value);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Update using saveConfig
  return await saveConfig({ [field]: value });
}

export {
  DEFAULT_CONFIG,
  VALIDATION_RULES,
  getDefaultConfig,
  validateConfigField,
  validateConfig,
  loadConfig,
  saveConfig,
  resetConfig,
  updateConfigField,
};
