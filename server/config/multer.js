/**
 * Multer Configuration for Music File Uploads
 * Requirements: 1.1, 9.1, 9.2
 *
 * Configures multer for handling music file uploads with:
 * - File type validation (MP3, WAV, M4A)
 * - File size limits (50MB max)
 * - Filename sanitization
 * - Upload directory management
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'audio/mpeg', // MP3
  'audio/mp3', // MP3 (alternative)
  'audio/wav', // WAV
  'audio/x-wav', // WAV (alternative)
  'audio/wave', // WAV (alternative)
  'audio/mp4', // M4A
  'audio/x-m4a', // M4A (alternative)
];

/**
 * Sanitize filename to prevent path traversal and special characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  // Remove path components
  const basename = path.basename(filename);

  // Replace special characters, keep alphanumeric, spaces, hyphens, underscores, dots, and parentheses
  // Also preserve Korean characters (가-힣)
  const sanitized = basename
    .replace(/[^a-zA-Z0-9가-힣._\-\s()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure filename is not empty after sanitization
  if (!sanitized || sanitized === '.') {
    return `music_${Date.now()}.mp3`;
  }

  // Security: Check for path traversal sequences
  // Remove any occurrence of ".." to prevent directory traversal attacks
  let safe = sanitized.replace(/\.\.+/g, '.');

  // If the result is just dots or empty, use default name
  if (!safe || /^\.+$/.test(safe)) {
    return `music_${Date.now()}.mp3`;
  }

  return safe;
}

/**
 * Generate unique filename to prevent overwrites
 * @param {string} originalFilename - Original filename
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalFilename) {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, ext);
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString('hex');

  return `${nameWithoutExt}_${timestamp}_${randomStr}${ext}`;
}

/**
 * Configure multer storage
 * @param {string} uploadDir - Upload directory path
 * @returns {multer.StorageEngine} Multer storage engine
 */
function createStorage(uploadDir) {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        // Ensure upload directory exists
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error, null);
      }
    },
    filename: (req, file, cb) => {
      try {
        // Generate unique filename to prevent overwrites
        const uniqueFilename = generateUniqueFilename(file.originalname);
        cb(null, uniqueFilename);
      } catch (error) {
        cb(error, null);
      }
    },
  });
}

/**
 * File filter to validate file types
 * Requirements: 9.1, 9.2
 * @param {Express.Request} req - Express request
 * @param {Express.Multer.File} file - Uploaded file
 * @param {Function} cb - Callback function
 */
function fileFilter(req, file, cb) {
  // Check MIME type
  const mimeTypeValid = ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase());

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const extensionValid = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeTypeValid && extensionValid) {
    cb(null, true);
  } else {
    const allowedFormats = ALLOWED_EXTENSIONS.join(', ');
    cb(new Error(`Invalid file type. Only ${allowedFormats} files are allowed.`), false);
  }
}

/**
 * Create multer upload middleware for music files
 * @param {Object} options - Configuration options
 * @param {string} options.uploadDir - Upload directory path
 * @param {number} [options.maxFileSize] - Maximum file size in bytes
 * @param {boolean} [options.multiple] - Allow multiple file uploads
 * @returns {multer.Multer} Configured multer instance
 */
export function createMusicUpload(options = {}) {
  const {
    uploadDir = path.join(process.cwd(), 'public', 'music'),
    maxFileSize = MAX_FILE_SIZE,
    multiple = false,
  } = options;

  const storage = createStorage(uploadDir);

  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: multiple ? 10 : 1, // Max 10 files for multiple uploads
    },
    fileFilter,
  });

  return upload;
}

/**
 * Validate uploaded file
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * @param {Express.Multer.File} file - Uploaded file
 * @returns {Object} Validation result
 */
export function validateUploadedFile(file) {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    errors.push(`Invalid MIME type. File must be a valid audio file.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check for duplicate filename
 * Requirements: 9.4
 * @param {string} filename - Filename to check
 * @param {string} uploadDir - Upload directory
 * @returns {Promise<boolean>} True if file exists
 */
export async function checkDuplicateFile(filename, uploadDir) {
  try {
    const filePath = path.join(uploadDir, filename);
    await fs.access(filePath);
    return true; // File exists
  } catch {
    return false; // File doesn't exist
  }
}

export default {
  createMusicUpload,
  validateUploadedFile,
  checkDuplicateFile,
  sanitizeFilename,
  generateUniqueFilename,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
