/**
 * Configuration Loader
 * Loads appropriate configuration based on NODE_ENV
 */

import developmentConfig from './development.js';
import { productionConfig, validateProductionConfig } from './production.js';

const env = process.env.NODE_ENV || 'development';

/**
 * Get configuration for current environment
 * @returns {Object} Configuration object
 */
export function getConfig() {
  const config = env === 'production' ? productionConfig : developmentConfig;

  console.log(`📦 Loading ${env} configuration`);

  // Validate production config
  if (env === 'production') {
    try {
      validateProductionConfig();
    } catch (error) {
      console.error('❌ Production configuration validation failed:', error.message);
      process.exit(1);
    }
  }

  return config;
}

/**
 * Get specific configuration section
 * @param {string} section - Configuration section name
 * @returns {Object} Configuration section
 */
export function getConfigSection(section) {
  const config = getConfig();
  return config[section];
}

/**
 * Check if running in production
 * @returns {boolean}
 */
export function isProduction() {
  return env === 'production';
}

/**
 * Check if running in development
 * @returns {boolean}
 */
export function isDevelopment() {
  return env === 'development';
}

/**
 * Check if running in test
 * @returns {boolean}
 */
export function isTest() {
  return env === 'test';
}

// Export default config
export default getConfig();
