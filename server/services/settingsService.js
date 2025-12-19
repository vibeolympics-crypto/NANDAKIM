/**
 * Settings Service
 * Manages global settings for fonts, colors, and layout
 * Requirements: 5.1-5.5, 6.1-6.5, 7.1-7.5
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

/**
 * Load settings from JSON file
 * @returns {Promise<Object>} Settings object
 */
export async function loadSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    // Return default settings if file doesn't exist
    return getDefaultSettings();
  }
}

/**
 * Save settings to JSON file
 * @param {Object} settings - Settings object to save
 * @param {string} username - Username of user making the change
 * @returns {Promise<Object>} Saved settings
 */
export async function saveSettings(settings, username = 'system') {
  try {
    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: username,
    };

    await fs.writeFile(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf-8');
    return updatedSettings;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Update font settings
 * Requirement 5.1-5.5: Font settings management
 * @param {Object} fontSettings - Font configuration
 * @param {string} username - Username of user making the change
 * @returns {Promise<Object>} Updated settings
 */
export async function updateFontSettings(fontSettings, username) {
  const settings = await loadSettings();
  settings.fonts = {
    ...settings.fonts,
    ...fontSettings,
  };
  return await saveSettings(settings, username);
}

/**
 * Update color settings
 * Requirement 6.1-6.5: Color theme management
 * @param {Object} colorSettings - Color configuration
 * @param {string} username - Username of user making the change
 * @returns {Promise<Object>} Updated settings
 */
export async function updateColorSettings(colorSettings, username) {
  const settings = await loadSettings();
  settings.colors = {
    ...settings.colors,
    ...colorSettings,
  };
  return await saveSettings(settings, username);
}

/**
 * Update layout settings
 * Requirement 7.1-7.5: Layout settings management
 * @param {Object} layoutSettings - Layout configuration
 * @param {string} username - Username of user making the change
 * @returns {Promise<Object>} Updated settings
 */
export async function updateLayoutSettings(layoutSettings, username) {
  const settings = await loadSettings();
  settings.layout = {
    ...settings.layout,
    ...layoutSettings,
  };
  return await saveSettings(settings, username);
}

/**
 * Reset settings to defaults
 * @param {string} username - Username of user making the change
 * @returns {Promise<Object>} Default settings
 */
export async function resetSettings(username) {
  const defaultSettings = getDefaultSettings();
  return await saveSettings(defaultSettings, username);
}

/**
 * Update email settings
 * Requirement 29.1-29.5: Email configuration
 * @param {Object} emailSettings - Email configuration
 * @param {string} username - Username of user making the change
 * @returns {Promise<Object>} Updated settings
 */
export async function updateEmailSettings(emailSettings, username) {
  const settings = await loadSettings();
  settings.email = {
    ...settings.email,
    ...emailSettings,
  };
  return await saveSettings(settings, username);
}

/**
 * Update settings (generic)
 * @param {Object} updates - Settings updates
 * @param {string} username - Username of user making the change
 * @returns {Promise<Object>} Updated settings
 */
export async function updateSettings(updates, username = 'system') {
  const settings = await loadSettings();
  const updatedSettings = {
    ...settings,
    ...updates,
  };
  return await saveSettings(updatedSettings, username);
}

/**
 * Get settings (alias for loadSettings)
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings() {
  return await loadSettings();
}

/**
 * Get default settings
 * @returns {Object} Default settings object
 */
function getDefaultSettings() {
  return {
    fonts: {
      family: 'system-ui, -apple-system, sans-serif',
      baseSize: 16,
      headingScale: 1.5,
      lineHeight: 1.6,
      source: 'system',
    },
    colors: {
      light: {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e74c3c',
        background: '#ffffff',
        foreground: '#1a1a1a',
        muted: '#f5f5f5',
        border: '#e0e0e0',
      },
      dark: {
        primary: '#5dade2',
        secondary: '#58d68d',
        accent: '#ec7063',
        background: '#1a1a1a',
        foreground: '#ffffff',
        muted: '#2a2a2a',
        border: '#3a3a3a',
      },
    },
    layout: {
      sidebarWidth: 250,
      containerMaxWidth: 1200,
      sectionSpacing: 80,
      buttonStyle: 'rounded',
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: 'Portfolio Admin',
    },
    socialMedia: {
      youtube: {
        channelUrl: '',
        videoEmbeds: [],
      },
      twitter: {
        profileUrl: '',
        autoRefresh: false,
        refreshInterval: 3600,
      },
      linkedin: {
        profileUrl: '',
        autoRefresh: false,
      },
      instagram: {
        profileUrl: '',
        autoRefresh: false,
      },
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
}

/**
 * Convert settings to CSS variables
 * @param {Object} settings - Settings object
 * @param {string} theme - 'light' or 'dark'
 * @returns {Object} CSS variables object
 */
export function settingsToCSSVariables(settings, theme = 'light') {
  const colors = settings.colors[theme] || settings.colors.light;

  return {
    // Font variables
    '--font-family': settings.fonts.family,
    '--font-size-base': `${settings.fonts.baseSize}px`,
    '--font-size-heading': `${settings.fonts.baseSize * settings.fonts.headingScale}px`,
    '--line-height': settings.fonts.lineHeight,

    // Color variables
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-background': colors.background,
    '--color-foreground': colors.foreground,
    '--color-muted': colors.muted,
    '--color-border': colors.border,

    // Layout variables
    '--sidebar-width': `${settings.layout.sidebarWidth}px`,
    '--container-max-width': `${settings.layout.containerMaxWidth}px`,
    '--section-spacing': `${settings.layout.sectionSpacing}px`,
    '--button-radius':
      settings.layout.buttonStyle === 'rounded'
        ? '8px'
        : settings.layout.buttonStyle === 'pill'
          ? '9999px'
          : '0px',
  };
}
