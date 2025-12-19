import { describe, it, expect, beforeEach } from 'vitest';
import * as twoFactorService from './twoFactorService.js';
import speakeasy from 'speakeasy';

describe('Two-Factor Authentication Service', () => {
  const testUserId = 'test-user-123';
  const testUsername = 'testuser';

  beforeEach(() => {
    // Clear any existing 2FA data
    twoFactorService.disable2FA(testUserId);
  });

  describe('setup2FA', () => {
    it('should generate secret, QR code, and backup codes', async () => {
      const result = await twoFactorService.setup2FA(testUserId, testUsername);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('backupCodes');
      expect(result.secret).toBeTruthy();
      expect(result.qrCodeUrl).toContain('data:image/png;base64');
      expect(result.backupCodes).toHaveLength(10);
    });

    it('should generate unique backup codes', async () => {
      const result = await twoFactorService.setup2FA(testUserId, testUsername);
      const uniqueCodes = new Set(result.backupCodes);

      expect(uniqueCodes.size).toBe(10);
    });
  });

  describe('verify2FACode', () => {
    it('should verify valid TOTP code', async () => {
      // Setup 2FA
      const setup = await twoFactorService.setup2FA(testUserId, testUsername);

      // Generate valid token
      const token = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });

      // Verify token
      const result = twoFactorService.verify2FACode(testUserId, token);

      expect(result.valid).toBe(true);
      expect(result.message).toContain('verified successfully');
    });

    it('should reject invalid TOTP code', async () => {
      // Setup 2FA
      await twoFactorService.setup2FA(testUserId, testUsername);

      // Try invalid token
      const result = twoFactorService.verify2FACode(testUserId, '000000');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should enable 2FA on first successful verification', async () => {
      // Setup 2FA
      const setup = await twoFactorService.setup2FA(testUserId, testUsername);

      // Initially not enabled
      expect(twoFactorService.is2FAEnabled(testUserId)).toBe(false);

      // Generate and verify valid token
      const token = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });
      twoFactorService.verify2FACode(testUserId, token);

      // Now should be enabled
      expect(twoFactorService.is2FAEnabled(testUserId)).toBe(true);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid unused backup code', async () => {
      // Setup 2FA and enable it
      const setup = await twoFactorService.setup2FA(testUserId, testUsername);
      const token = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });
      twoFactorService.verify2FACode(testUserId, token);

      // Verify backup code
      const backupCode = setup.backupCodes[0];
      const result = twoFactorService.verifyBackupCode(testUserId, backupCode);

      expect(result.valid).toBe(true);
      expect(result.message).toContain('verified successfully');
      expect(result.remainingCodes).toBe(9);
    });

    it('should reject already used backup code', async () => {
      // Setup 2FA and enable it
      const setup = await twoFactorService.setup2FA(testUserId, testUsername);
      const token = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });
      twoFactorService.verify2FACode(testUserId, token);

      // Use backup code once
      const backupCode = setup.backupCodes[0];
      twoFactorService.verifyBackupCode(testUserId, backupCode);

      // Try to use same code again
      const result = twoFactorService.verifyBackupCode(testUserId, backupCode);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('already used');
    });

    it('should reject invalid backup code', async () => {
      // Setup 2FA and enable it
      const setup = await twoFactorService.setup2FA(testUserId, testUsername);
      const token = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });
      twoFactorService.verify2FACode(testUserId, token);

      // Try invalid backup code
      const result = twoFactorService.verifyBackupCode(testUserId, 'INVALID123');

      expect(result.valid).toBe(false);
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA and remove data', async () => {
      // Setup and enable 2FA
      const setup = await twoFactorService.setup2FA(testUserId, testUsername);
      const token = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });
      twoFactorService.verify2FACode(testUserId, token);

      expect(twoFactorService.is2FAEnabled(testUserId)).toBe(true);

      // Disable 2FA
      const result = twoFactorService.disable2FA(testUserId);

      expect(result).toBe(true);
      expect(twoFactorService.is2FAEnabled(testUserId)).toBe(false);
    });
  });

  describe('get2FAStatus', () => {
    it('should return null for user without 2FA', () => {
      const status = twoFactorService.get2FAStatus(testUserId);
      expect(status).toBeNull();
    });

    it('should return status for user with 2FA', async () => {
      // Setup 2FA
      await twoFactorService.setup2FA(testUserId, testUsername);

      const status = twoFactorService.get2FAStatus(testUserId);

      expect(status).not.toBeNull();
      expect(status.enabled).toBe(false);
      expect(status.backupCodesRemaining).toBe(10);
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should generate new backup codes', async () => {
      // Setup and enable 2FA
      const setup = await twoFactorService.setup2FA(testUserId, testUsername);
      const token = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });
      twoFactorService.verify2FACode(testUserId, token);

      const oldCodes = setup.backupCodes;

      // Regenerate codes
      const newCodes = twoFactorService.regenerateBackupCodes(testUserId);

      expect(newCodes).toHaveLength(10);
      expect(newCodes).not.toEqual(oldCodes);
    });

    it('should return null if 2FA not enabled', () => {
      const result = twoFactorService.regenerateBackupCodes(testUserId);
      expect(result).toBeNull();
    });
  });
});
