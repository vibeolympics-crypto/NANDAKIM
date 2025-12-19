/**
 * Unit Tests for Session Service
 * Tests multi-device session management
 */

const { describe, it, expect, beforeEach } = require('@jest/globals');
const sessionService = require('./sessionService');

describe('SessionService', () => {
  beforeEach(() => {
    // Clean up all sessions before each test
    sessionService.cleanupExpiredSessions(0);
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        refreshToken: 'token123',
      });

      expect(session).toHaveProperty('sessionId');
      expect(session.userId).toBe('user1');
      expect(session.username).toBe('testuser');
      expect(session.role).toBe('admin');
      expect(session.deviceInfo).toBe('Chrome on Windows');
      expect(session.ipAddress).toBe('127.0.0.1');
      expect(session.refreshToken).toBe('token123');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('lastActivity');
    });

    it('should generate unique session IDs', () => {
      const session1 = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 1',
        ipAddress: '127.0.0.1',
        refreshToken: 'token1',
      });

      const session2 = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 2',
        ipAddress: '127.0.0.1',
        refreshToken: 'token2',
      });

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('getSession', () => {
    it('should retrieve session by ID', () => {
      const created = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Chrome',
        ipAddress: '127.0.0.1',
        refreshToken: 'token123',
      });

      const retrieved = sessionService.getSession(created.sessionId);
      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent session', () => {
      const session = sessionService.getSession('nonexistent');
      expect(session).toBeNull();
    });
  });

  describe('getUserSessions', () => {
    it('should retrieve all sessions for a user', () => {
      sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 1',
        ipAddress: '127.0.0.1',
        refreshToken: 'token1',
      });

      sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 2',
        ipAddress: '127.0.0.2',
        refreshToken: 'token2',
      });

      sessionService.createSession({
        userId: 'user2',
        username: 'otheruser',
        role: 'editor',
        deviceInfo: 'Device 3',
        ipAddress: '127.0.0.3',
        refreshToken: 'token3',
      });

      const user1Sessions = sessionService.getUserSessions('user1');
      expect(user1Sessions).toHaveLength(2);
      expect(user1Sessions.every((s) => s.userId === 'user1')).toBe(true);
    });

    it('should return empty array for user with no sessions', () => {
      const sessions = sessionService.getUserSessions('nonexistent');
      expect(sessions).toEqual([]);
    });
  });

  describe('updateSessionActivity', () => {
    it('should update last activity timestamp', () => {
      const session = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Chrome',
        ipAddress: '127.0.0.1',
        refreshToken: 'token123',
      });

      const originalActivity = session.lastActivity;

      // Wait a bit
      setTimeout(() => {
        const updated = sessionService.updateSessionActivity(session.sessionId);
        expect(updated).toBe(true);

        const retrieved = sessionService.getSession(session.sessionId);
        expect(retrieved.lastActivity).toBeGreaterThan(originalActivity);
      }, 10);
    });

    it('should return false for non-existent session', () => {
      const updated = sessionService.updateSessionActivity('nonexistent');
      expect(updated).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', () => {
      const session = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Chrome',
        ipAddress: '127.0.0.1',
        refreshToken: 'token123',
      });

      const deleted = sessionService.deleteSession(session.sessionId);
      expect(deleted).toBe(true);

      const retrieved = sessionService.getSession(session.sessionId);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const deleted = sessionService.deleteSession('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteUserSessions', () => {
    it('should delete all sessions for a user', () => {
      sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 1',
        ipAddress: '127.0.0.1',
        refreshToken: 'token1',
      });

      sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 2',
        ipAddress: '127.0.0.2',
        refreshToken: 'token2',
      });

      const count = sessionService.deleteUserSessions('user1');
      expect(count).toBe(2);

      const sessions = sessionService.getUserSessions('user1');
      expect(sessions).toHaveLength(0);
    });

    it('should return 0 for user with no sessions', () => {
      const count = sessionService.deleteUserSessions('nonexistent');
      expect(count).toBe(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', (done) => {
      const session1 = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 1',
        ipAddress: '127.0.0.1',
        refreshToken: 'token1',
      });

      // Wait a bit then create another session
      setTimeout(() => {
        const session2 = sessionService.createSession({
          userId: 'user2',
          username: 'otheruser',
          role: 'editor',
          deviceInfo: 'Device 2',
          ipAddress: '127.0.0.2',
          refreshToken: 'token2',
        });

        // Clean up sessions older than 50ms
        const cleaned = sessionService.cleanupExpiredSessions(50);
        expect(cleaned).toBe(1);

        // session1 should be gone
        expect(sessionService.getSession(session1.sessionId)).toBeNull();
        // session2 should still exist
        expect(sessionService.getSession(session2.sessionId)).not.toBeNull();

        done();
      }, 100);
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate correct refresh token', () => {
      const session = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Chrome',
        ipAddress: '127.0.0.1',
        refreshToken: 'token123',
      });

      const valid = sessionService.validateRefreshToken(session.sessionId, 'token123');
      expect(valid).toBe(true);
    });

    it('should reject incorrect refresh token', () => {
      const session = sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Chrome',
        ipAddress: '127.0.0.1',
        refreshToken: 'token123',
      });

      const valid = sessionService.validateRefreshToken(session.sessionId, 'wrongtoken');
      expect(valid).toBe(false);
    });

    it('should return false for non-existent session', () => {
      const valid = sessionService.validateRefreshToken('nonexistent', 'token123');
      expect(valid).toBe(false);
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', () => {
      sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 1',
        ipAddress: '127.0.0.1',
        refreshToken: 'token1',
      });

      sessionService.createSession({
        userId: 'user1',
        username: 'testuser',
        role: 'admin',
        deviceInfo: 'Device 2',
        ipAddress: '127.0.0.2',
        refreshToken: 'token2',
      });

      sessionService.createSession({
        userId: 'user2',
        username: 'otheruser',
        role: 'editor',
        deviceInfo: 'Device 3',
        ipAddress: '127.0.0.3',
        refreshToken: 'token3',
      });

      const stats = sessionService.getSessionStats();
      expect(stats.totalSessions).toBe(3);
      expect(stats.activeSessions).toBe(3);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.averageSessionsPerUser).toBe(1.5);
    });
  });
});
