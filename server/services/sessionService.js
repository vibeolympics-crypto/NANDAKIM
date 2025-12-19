/**
 * Session Service
 * Manages multi-device sessions and session tracking
 * Requirements: 26.4, 26.5
 */

import crypto from 'crypto';

// In-memory session store (in production, use Redis or database)
const sessions = new Map();

/**
 * Session data structure
 * @typedef {Object} Session
 * @property {string} sessionId - Unique session identifier
 * @property {string} userId - User identifier
 * @property {string} username - Username
 * @property {string} role - User role
 * @property {string} deviceInfo - Device information
 * @property {string} ipAddress - IP address
 * @property {number} createdAt - Session creation timestamp
 * @property {number} lastActivity - Last activity timestamp
 * @property {string} refreshToken - Refresh token
 */

/**
 * Generate unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create new session
 * @param {Object} params - Session parameters
 * @param {string} params.userId - User ID
 * @param {string} params.username - Username
 * @param {string} params.role - User role
 * @param {string} params.deviceInfo - Device information
 * @param {string} params.ipAddress - IP address
 * @param {string} params.refreshToken - Refresh token
 * @returns {Session} Created session
 */
function createSession({ userId, username, role, deviceInfo, ipAddress, refreshToken }) {
  const sessionId = generateSessionId();
  const now = Date.now();

  const session = {
    sessionId,
    userId,
    username,
    role,
    deviceInfo,
    ipAddress,
    createdAt: now,
    lastActivity: now,
    refreshToken,
  };

  sessions.set(sessionId, session);
  return session;
}

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Session|null} Session or null if not found
 */
function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Get all sessions for a user
 * @param {string} userId - User ID
 * @returns {Session[]} Array of sessions
 */
function getUserSessions(userId) {
  const userSessions = [];
  for (const session of sessions.values()) {
    if (session.userId === userId) {
      userSessions.push(session);
    }
  }
  return userSessions;
}

/**
 * Update session activity
 * @param {string} sessionId - Session ID
 * @returns {boolean} True if updated, false if not found
 */
function updateSessionActivity(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
    return true;
  }
  return false;
}

/**
 * Delete session
 * @param {string} sessionId - Session ID
 * @returns {boolean} True if deleted, false if not found
 */
function deleteSession(sessionId) {
  return sessions.delete(sessionId);
}

/**
 * Delete all sessions for a user
 * @param {string} userId - User ID
 * @returns {number} Number of sessions deleted
 */
function deleteUserSessions(userId) {
  let count = 0;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(sessionId);
      count++;
    }
  }
  return count;
}

/**
 * Clean up expired sessions
 * @param {number} maxAge - Maximum session age in milliseconds
 * @returns {number} Number of sessions cleaned up
 */
function cleanupExpiredSessions(maxAge = 30 * 60 * 1000) {
  const now = Date.now();
  let count = 0;

  for (const [sessionId, session] of sessions.entries()) {
    const age = now - session.lastActivity;
    if (age > maxAge) {
      sessions.delete(sessionId);
      count++;
    }
  }

  return count;
}

/**
 * Get session statistics
 * @returns {Object} Session statistics
 */
function getSessionStats() {
  const now = Date.now();
  const activeSessions = [];
  const userCounts = new Map();

  for (const session of sessions.values()) {
    const age = now - session.lastActivity;
    if (age < 30 * 60 * 1000) {
      // Active within 30 minutes
      activeSessions.push(session);
      const count = userCounts.get(session.userId) || 0;
      userCounts.set(session.userId, count + 1);
    }
  }

  return {
    totalSessions: sessions.size,
    activeSessions: activeSessions.length,
    uniqueUsers: userCounts.size,
    averageSessionsPerUser: userCounts.size > 0 ? activeSessions.length / userCounts.size : 0,
  };
}

/**
 * Validate refresh token for session
 * @param {string} sessionId - Session ID
 * @param {string} refreshToken - Refresh token to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateRefreshToken(sessionId, refreshToken) {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }
  return session.refreshToken === refreshToken;
}

// Start cleanup interval (every 5 minutes)
const cleanupInterval = setInterval(
  () => {
    const cleaned = cleanupExpiredSessions();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired sessions`);
    }
  },
  5 * 60 * 1000
);

// Cleanup on process exit
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
});

export {
  createSession,
  getSession,
  getUserSessions,
  updateSessionActivity,
  deleteSession,
  deleteUserSessions,
  cleanupExpiredSessions,
  getSessionStats,
  validateRefreshToken,
};
