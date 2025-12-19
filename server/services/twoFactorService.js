import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

/**
 * Two-Factor Authentication Service
 * Handles 2FA setup, verification, and backup code management
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

// In-memory storage for 2FA data (in production, use database)
const twoFactorData = new Map();

/**
 * Generate a new 2FA secret and QR code for a user
 * Requirement 3.1: Generate QR code for authenticator app setup
 *
 * @param {string} userId - User identifier
 * @param {string} username - Username for display in authenticator app
 * @returns {Promise<Object>} Object containing secret, QR code URL, and backup codes
 */
export async function setup2FA(userId, username) {
  const appName = process.env.TWO_FACTOR_APP_NAME || 'Portfolio Admin';

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${appName} (${username})`,
    length: 32,
  });

  // Generate QR code
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  // Generate backup codes (Requirement 3.5)
  const backupCodes = generateBackupCodes(10);

  // Store 2FA data (in production, save to database)
  twoFactorData.set(userId, {
    secret: secret.base32,
    backupCodes: backupCodes.map((code) => ({
      code: hashBackupCode(code),
      used: false,
    })),
    enabled: false, // Not enabled until first successful verification
    createdAt: new Date().toISOString(),
  });

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes, // Return plain codes to user (only shown once)
  };
}

/**
 * Verify a 2FA code and enable 2FA if first verification
 * Requirement 3.2: Require valid 6-digit code after password verification
 * Requirement 3.3: Reject invalid codes and allow retry
 *
 * @param {string} userId - User identifier
 * @param {string} token - 6-digit TOTP code
 * @returns {Object} Verification result
 */
export function verify2FACode(userId, token) {
  const userData = twoFactorData.get(userId);

  if (!userData) {
    return {
      valid: false,
      message: '2FA not set up for this user',
    };
  }

  // Verify TOTP token
  const verified = speakeasy.totp.verify({
    secret: userData.secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow 2 time steps before/after for clock skew
  });

  if (verified) {
    // Enable 2FA on first successful verification
    if (!userData.enabled) {
      userData.enabled = true;
      userData.enabledAt = new Date().toISOString();
    }

    return {
      valid: true,
      message: '2FA code verified successfully',
    };
  }

  return {
    valid: false,
    message: 'Invalid 2FA code',
  };
}

/**
 * Verify a backup code
 * Requirement 3.5: Provide backup codes for recovery
 *
 * @param {string} userId - User identifier
 * @param {string} backupCode - Backup code to verify
 * @returns {Object} Verification result
 */
export function verifyBackupCode(userId, backupCode) {
  const userData = twoFactorData.get(userId);

  if (!userData || !userData.enabled) {
    return {
      valid: false,
      message: '2FA not enabled for this user',
    };
  }

  const hashedCode = hashBackupCode(backupCode);
  const codeEntry = userData.backupCodes.find((entry) => entry.code === hashedCode && !entry.used);

  if (codeEntry) {
    // Mark code as used
    codeEntry.used = true;
    codeEntry.usedAt = new Date().toISOString();

    return {
      valid: true,
      message: 'Backup code verified successfully',
      remainingCodes: userData.backupCodes.filter((entry) => !entry.used).length,
    };
  }

  return {
    valid: false,
    message: 'Invalid or already used backup code',
  };
}

/**
 * Disable 2FA for a user
 * Requirement 3.4: Require password confirmation before disabling
 *
 * @param {string} userId - User identifier
 * @returns {boolean} Success status
 */
export function disable2FA(userId) {
  const userData = twoFactorData.get(userId);

  if (!userData) {
    return false;
  }

  // Remove 2FA data
  twoFactorData.delete(userId);

  return true;
}

/**
 * Check if 2FA is enabled for a user
 *
 * @param {string} userId - User identifier
 * @returns {boolean} Whether 2FA is enabled
 */
export function is2FAEnabled(userId) {
  const userData = twoFactorData.get(userId);
  return userData ? userData.enabled : false;
}

/**
 * Get 2FA status for a user
 *
 * @param {string} userId - User identifier
 * @returns {Object|null} 2FA status information
 */
export function get2FAStatus(userId) {
  const userData = twoFactorData.get(userId);

  if (!userData) {
    return null;
  }

  return {
    enabled: userData.enabled,
    createdAt: userData.createdAt,
    enabledAt: userData.enabledAt,
    backupCodesRemaining: userData.backupCodes.filter((entry) => !entry.used).length,
  };
}

/**
 * Generate new backup codes (regenerate)
 *
 * @param {string} userId - User identifier
 * @returns {Array<string>|null} New backup codes or null if 2FA not enabled
 */
export function regenerateBackupCodes(userId) {
  const userData = twoFactorData.get(userId);

  if (!userData || !userData.enabled) {
    return null;
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes(10);

  // Replace old backup codes
  userData.backupCodes = backupCodes.map((code) => ({
    code: hashBackupCode(code),
    used: false,
  }));
  userData.backupCodesRegeneratedAt = new Date().toISOString();

  return backupCodes;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate backup codes
 *
 * @param {number} count - Number of codes to generate
 * @returns {Array<string>} Array of backup codes
 */
function generateBackupCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash a backup code for secure storage
 *
 * @param {string} code - Backup code to hash
 * @returns {string} Hashed code
 */
function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Export data for persistence (for production use)
 *
 * @returns {Object} All 2FA data
 */
export function exportData() {
  return Object.fromEntries(twoFactorData);
}

/**
 * Import data from persistence (for production use)
 *
 * @param {Object} data - 2FA data to import
 */
export function importData(data) {
  twoFactorData.clear();
  Object.entries(data).forEach(([userId, userData]) => {
    twoFactorData.set(userId, userData);
  });
}
