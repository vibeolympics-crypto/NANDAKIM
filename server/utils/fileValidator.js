/**
 * File Validator Utility - Server Side
 * Requirements: 9.1, 9.2, 9.3, 9.4
 *
 * Validates music files on the server
 * - File extensions (.mp3, .wav, .m4a)
 * - File sizes (max 50MB)
 * - Duplicate filenames
 */

import path from 'path';
import fs from 'fs/promises';

// ==================== CONSTANTS ====================

/**
 * Maximum file size in bytes (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Allowed music file extensions
 */
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];

/**
 * Allowed MIME types for music files
 */
const ALLOWED_MIME_TYPES = [
  'audio/mpeg', // .mp3
  'audio/mp3', // .mp3 (alternative)
  'audio/wav', // .wav
  'audio/wave', // .wav (alternative)
  'audio/x-wav', // .wav (alternative)
  'audio/mp4', // .m4a
  'audio/x-m4a', // .m4a (alternative)
];

/**
 * Default validation options
 */
const DEFAULT_VALIDATION_OPTIONS = {
  maxSize: MAX_FILE_SIZE,
  allowedExtensions: ALLOWED_EXTENSIONS,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
};

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Get file extension from filename
 * @param {string} filename - The filename to extract extension from
 * @returns {string} The file extension (including dot) in lowercase
 */
function getFileExtension(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Validate file extension
 * Requirements: 9.1
 *
 * @param {Object} file - The file object (multer file)
 * @param {string[]} allowedExtensions - Array of allowed extensions
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateFileExtension(file, allowedExtensions) {
  const extension = getFileExtension(file.originalname);

  if (!extension) {
    return 'File has no extension';
  }

  if (!allowedExtensions.includes(extension)) {
    return `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`;
  }

  return null;
}

/**
 * Validate file size
 * Requirements: 9.2
 *
 * @param {Object} file - The file object (multer file)
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateFileSize(file, maxSize) {
  if (file.size === 0) {
    return 'File is empty';
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`;
  }

  return null;
}

/**
 * Validate MIME type
 * Requirements: 9.1
 *
 * @param {Object} file - The file object (multer file)
 * @param {string[]} allowedMimeTypes - Array of allowed MIME types
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateMimeType(file, allowedMimeTypes) {
  if (!file.mimetype) {
    // If MIME type is not available, rely on extension validation
    return null;
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return `Invalid file type. Expected audio file, got ${file.mimetype}`;
  }

  return null;
}

/**
 * Check if filename already exists in directory
 * Requirements: 9.4
 *
 * @param {string} filename - The filename to check
 * @param {string} directory - Directory path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filename, directory) {
  try {
    const filePath = path.join(directory, filename);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for duplicate filenames in a file list
 * Requirements: 9.4
 *
 * @param {Object[]} files - Array of file objects to check
 * @returns {Map<string, number>} Map of filename to count of occurrences
 */
function findDuplicateFilenames(files) {
  const filenameCounts = new Map();

  files.forEach((file) => {
    const filename = file.originalname;
    const count = filenameCounts.get(filename) || 0;
    filenameCounts.set(filename, count + 1);
  });

  // Filter to only duplicates
  const duplicates = new Map();
  filenameCounts.forEach((count, filename) => {
    if (count > 1) {
      duplicates.set(filename, count);
    }
  });

  return duplicates;
}

/**
 * Validate a single file
 * Requirements: 9.1, 9.2, 9.3
 *
 * @param {Object} file - The file object (multer file)
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with errors
 */
function validateFile(file, options = DEFAULT_VALIDATION_OPTIONS) {
  const errors = [];

  // Validate extension
  const extensionError = validateFileExtension(file, options.allowedExtensions);
  if (extensionError) {
    errors.push(extensionError);
  }

  // Validate size
  const sizeError = validateFileSize(file, options.maxSize);
  if (sizeError) {
    errors.push(sizeError);
  }

  // Validate MIME type
  const mimeError = validateMimeType(file, options.allowedMimeTypes);
  if (mimeError) {
    errors.push(mimeError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple files
 * Requirements: 9.1, 9.2, 9.3, 9.4
 *
 * @param {Object[]} files - Array of file objects to validate
 * @param {Object} options - Validation options
 * @param {string} uploadDirectory - Directory to check for existing files
 * @returns {Promise<Map<string, Object>>} Map of filename to validation result
 */
async function validateFiles(files, options = DEFAULT_VALIDATION_OPTIONS, uploadDirectory = null) {
  const results = new Map();

  // Check for duplicates within the upload batch
  const duplicates = findDuplicateFilenames(files);

  for (const file of files) {
    const result = validateFile(file, options);

    // Check for duplicate in batch
    if (duplicates.has(file.originalname)) {
      result.errors.push(
        `Duplicate filename in upload batch (appears ${duplicates.get(file.originalname)} times)`
      );
      result.valid = false;
    }

    // Check for duplicate in existing files
    if (uploadDirectory) {
      const exists = await fileExists(file.originalname, uploadDirectory);
      if (exists) {
        result.errors.push('A file with this name already exists');
        result.valid = false;
      }
    }

    results.set(file.originalname, result);
  }

  return results;
}

/**
 * Format file size for display
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted string (e.g., "5.2 MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get validation summary for multiple files
 *
 * @param {Map<string, Object>} validationResults - Map of filename to validation result
 * @returns {Object} Summary object
 */
function getValidationSummary(validationResults) {
  const totalFiles = validationResults.size;
  let validFiles = 0;
  let invalidFiles = 0;

  validationResults.forEach((result) => {
    if (result.valid) {
      validFiles++;
    } else {
      invalidFiles++;
    }
  });

  return {
    totalFiles,
    validFiles,
    invalidFiles,
    allValid: invalidFiles === 0,
  };
}

/**
 * Sanitize filename to prevent path traversal attacks
 *
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  // Remove any path components
  const basename = path.basename(filename);

  // Remove any characters that could be problematic
  // Keep alphanumeric, dots, hyphens, underscores, and spaces
  const sanitized = basename.replace(/[^a-zA-Z0-9.\-_ ]/g, '_');

  return sanitized;
}

// ==================== EXPORTS ====================

export {
  // Constants
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  DEFAULT_VALIDATION_OPTIONS,

  // Functions
  getFileExtension,
  validateFileExtension,
  validateFileSize,
  validateMimeType,
  fileExists,
  findDuplicateFilenames,
  validateFile,
  validateFiles,
  formatFileSize,
  getValidationSummary,
  sanitizeFilename,
};
