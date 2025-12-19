/**
 * Data Directory Initialization Utility
 *
 * Ensures all required data files exist with valid default structures
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory paths
const SRC_DATA_DIR = path.join(__dirname, '../../src/data');
const SERVER_DATA_DIR = path.join(__dirname, '../data');
const MUSIC_DIR = path.join(__dirname, '../../public/music');

// Default data structures for all required JSON files
const DEFAULT_DATA = {
  // src/data files
  'blog.json': {
    posts: [],
  },
  'sns.json': {
    feeds: [],
  },
  'projects.json': {
    projects: [],
  },
  'config.json': {
    site: {
      title: 'Won Kim Portfolio',
      description: 'Portfolio showcasing projects and activities',
    },
  },
  'events.json': {
    events: [],
  },
  'news.json': {
    news: [],
  },
};

// Default server data structures
const DEFAULT_SERVER_DATA = {
  'music-playlist.json': {
    config: {
      enabled: false,
      autoplay: false,
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
    },
    tracks: [],
  },
  'settings.json': {
    fonts: {
      family: 'Inter',
      baseSize: 16,
      headingScale: 1.5,
      lineHeight: 1.6,
      source: 'google',
    },
    colors: {
      light: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        background: '#ffffff',
        text: '#1f2937',
      },
      dark: {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        background: '#1f2937',
        text: '#f9fafb',
      },
    },
    layout: {
      sidebarWidth: 280,
      containerMaxWidth: 1200,
      sectionSpacing: 80,
      buttonStyle: 'rounded',
    },
  },
};

/**
 * Check if a file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} - True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate JSON file structure
 * @param {string} filePath - Path to JSON file
 * @param {object} expectedStructure - Expected structure
 * @returns {Promise<boolean>} - True if valid
 */
async function validateJSONFile(filePath, expectedStructure) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Check if all expected top-level keys exist
    const expectedKeys = Object.keys(expectedStructure);
    const actualKeys = Object.keys(data);

    const hasAllKeys = expectedKeys.every((key) => actualKeys.includes(key));

    if (!hasAllKeys) {
      console.log(`[Init] File ${path.basename(filePath)} is missing expected keys`);
      return false;
    }

    return true;
  } catch (error) {
    console.log(`[Init] File ${path.basename(filePath)} is invalid: ${error.message}`);
    return false;
  }
}

/**
 * Create or validate a data file
 * @param {string} directory - Directory path
 * @param {string} filename - File name
 * @param {object} defaultData - Default data structure
 * @returns {Promise<void>}
 */
async function ensureDataFile(directory, filename, defaultData) {
  const filePath = path.join(directory, filename);
  const exists = await fileExists(filePath);

  if (!exists) {
    console.log(`[Init] Creating missing file: ${filename}`);
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    console.log(`[Init] ✓ Created ${filename} with default structure`);
  } else {
    // Validate existing file
    const isValid = await validateJSONFile(filePath, defaultData);
    if (!isValid) {
      console.log(`[Init] ⚠ File ${filename} exists but has invalid structure`);
      console.log(`[Init] Creating backup and resetting to defaults`);

      // Create backup
      const backupPath = filePath + '.backup.' + Date.now();
      await fs.copyFile(filePath, backupPath);
      console.log(`[Init] Backup created: ${path.basename(backupPath)}`);

      // Reset to defaults
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      console.log(`[Init] ✓ Reset ${filename} to default structure`);
    } else {
      console.log(`[Init] ✓ Validated ${filename}`);
    }
  }
}

/**
 * Initialize data directory and all required files
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * @returns {Promise<object>} - Initialization status
 */
export async function initializeDataDirectory() {
  console.log('[Init] Starting data directory initialization...');

  const results = {
    success: true,
    created: [],
    validated: [],
    errors: [],
  };

  try {
    // Ensure src/data directory exists
    console.log('[Init] Checking src/data directory...');
    await fs.mkdir(SRC_DATA_DIR, { recursive: true });
    console.log('[Init] ✓ src/data directory ready');

    // Ensure server/data directory exists
    console.log('[Init] Checking server/data directory...');
    await fs.mkdir(SERVER_DATA_DIR, { recursive: true });
    console.log('[Init] ✓ server/data directory ready');

    // Ensure public/music directory exists
    console.log('[Init] Checking public/music directory...');
    await fs.mkdir(MUSIC_DIR, { recursive: true });
    console.log('[Init] ✓ public/music directory ready');

    // Create/validate src/data files
    console.log('[Init] Processing src/data files...');
    for (const [filename, defaultData] of Object.entries(DEFAULT_DATA)) {
      try {
        const filePath = path.join(SRC_DATA_DIR, filename);
        const existed = await fileExists(filePath);

        await ensureDataFile(SRC_DATA_DIR, filename, defaultData);

        if (!existed) {
          results.created.push(`src/data/${filename}`);
        } else {
          results.validated.push(`src/data/${filename}`);
        }
      } catch (error) {
        console.error(`[Init] ✗ Error processing ${filename}:`, error.message);
        results.errors.push({ file: filename, error: error.message });
        results.success = false;
      }
    }

    // Create/validate server/data files
    console.log('[Init] Processing server/data files...');
    for (const [filename, defaultData] of Object.entries(DEFAULT_SERVER_DATA)) {
      try {
        const filePath = path.join(SERVER_DATA_DIR, filename);
        const existed = await fileExists(filePath);

        await ensureDataFile(SERVER_DATA_DIR, filename, defaultData);

        if (!existed) {
          results.created.push(`server/data/${filename}`);
        } else {
          results.validated.push(`server/data/${filename}`);
        }
      } catch (error) {
        console.error(`[Init] ✗ Error processing ${filename}:`, error.message);
        results.errors.push({ file: filename, error: error.message });
        results.success = false;
      }
    }

    console.log('[Init] Data directory initialization complete');
    console.log(`[Init] Created: ${results.created.length} files`);
    console.log(`[Init] Validated: ${results.validated.length} files`);
    console.log(`[Init] Errors: ${results.errors.length}`);

    return results;
  } catch (error) {
    console.error('[Init] ✗ Fatal error during initialization:', error);
    results.success = false;
    results.errors.push({ file: 'initialization', error: error.message });
    return results;
  }
}

/**
 * Get initialization status
 * @returns {Promise<object>} - Status of all data files
 */
export async function getInitializationStatus() {
  const status = {
    srcData: {},
    serverData: {},
    directories: {},
  };

  // Check directories
  status.directories.srcData = await fileExists(SRC_DATA_DIR);
  status.directories.serverData = await fileExists(SERVER_DATA_DIR);
  status.directories.music = await fileExists(MUSIC_DIR);

  // Check src/data files
  for (const filename of Object.keys(DEFAULT_DATA)) {
    const filePath = path.join(SRC_DATA_DIR, filename);
    status.srcData[filename] = await fileExists(filePath);
  }

  // Check server/data files
  for (const filename of Object.keys(DEFAULT_SERVER_DATA)) {
    const filePath = path.join(SERVER_DATA_DIR, filename);
    status.serverData[filename] = await fileExists(filePath);
  }

  return status;
}

export default {
  initializeDataDirectory,
  getInitializationStatus,
};
