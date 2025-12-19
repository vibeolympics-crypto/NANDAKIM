/**
 * File Validator Utility - Client Side
 * Requirements: 9.1, 9.2, 9.3, 9.4
 *
 * Validates music files before upload
 * - File extensions (.mp3, .wav, .m4a)
 * - File sizes (max 50MB)
 * - Duplicate filenames
 */

// ==================== CONSTANTS ====================

/**
 * Maximum file size in bytes (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Allowed music file extensions
 */
export const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a'] as const;

/**
 * Allowed MIME types for music files
 */
export const ALLOWED_MIME_TYPES = [
  'audio/mpeg', // .mp3
  'audio/mp3', // .mp3 (alternative)
  'audio/wav', // .wav
  'audio/wave', // .wav (alternative)
  'audio/x-wav', // .wav (alternative)
  'audio/mp4', // .m4a
  'audio/x-m4a', // .m4a (alternative)
] as const;

// ==================== TYPES ====================

/**
 * Validation result for a single file
 */
export interface FileValidationResult {
  /** Whether the file is valid */
  valid: boolean;
  /** Array of error messages */
  errors: string[];
}

/**
 * Validation options
 */
export interface FileValidationOptions {
  /** Maximum file size in bytes */
  maxSize: number;
  /** Allowed file extensions */
  allowedExtensions: string[];
  /** Allowed MIME types */
  allowedMimeTypes: string[];
}

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: FileValidationOptions = {
  maxSize: MAX_FILE_SIZE,
  allowedExtensions: [...ALLOWED_EXTENSIONS],
  allowedMimeTypes: [...ALLOWED_MIME_TYPES],
};

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Get file extension from filename
 * @param filename - The filename to extract extension from
 * @returns The file extension (including dot) in lowercase
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Validate file extension
 * Requirements: 9.1
 *
 * @param file - The file to validate
 * @param allowedExtensions - Array of allowed extensions
 * @returns Error message if invalid, null if valid
 */
export function validateFileExtension(file: File, allowedExtensions: string[]): string | null {
  const extension = getFileExtension(file.name);

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
 * @param file - The file to validate
 * @param maxSize - Maximum allowed size in bytes
 * @returns Error message if invalid, null if valid
 */
export function validateFileSize(file: File, maxSize: number): string | null {
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
 * @param file - The file to validate
 * @param allowedMimeTypes - Array of allowed MIME types
 * @returns Error message if invalid, null if valid
 */
export function validateMimeType(file: File, allowedMimeTypes: string[]): string | null {
  if (!file.type) {
    // If MIME type is not available, rely on extension validation
    return null;
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return `Invalid file type. Expected audio file, got ${file.type}`;
  }

  return null;
}

/**
 * Check for duplicate filenames in a file list
 * Requirements: 9.4
 *
 * @param files - Array of files to check
 * @returns Map of filename to count of occurrences
 */
export function findDuplicateFilenames(files: File[]): Map<string, number> {
  const filenameCounts = new Map<string, number>();

  files.forEach((file) => {
    const count = filenameCounts.get(file.name) || 0;
    filenameCounts.set(file.name, count + 1);
  });

  // Filter to only duplicates
  const duplicates = new Map<string, number>();
  filenameCounts.forEach((count, filename) => {
    if (count > 1) {
      duplicates.set(filename, count);
    }
  });

  return duplicates;
}

/**
 * Check if filename already exists in existing files
 * Requirements: 9.4
 *
 * @param filename - The filename to check
 * @param existingFilenames - Array of existing filenames
 * @returns True if duplicate exists
 */
export function isDuplicateFilename(filename: string, existingFilenames: string[]): boolean {
  return existingFilenames.includes(filename);
}

/**
 * Validate a single file
 * Requirements: 9.1, 9.2, 9.3
 *
 * @param file - The file to validate
 * @param options - Validation options
 * @returns Validation result with errors
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = DEFAULT_VALIDATION_OPTIONS
): FileValidationResult {
  const errors: string[] = [];

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
 * @param files - Array of files to validate
 * @param options - Validation options
 * @param existingFilenames - Optional array of existing filenames to check for duplicates
 * @returns Map of filename to validation result
 */
export function validateFiles(
  files: File[],
  options: FileValidationOptions = DEFAULT_VALIDATION_OPTIONS,
  existingFilenames: string[] = []
): Map<string, FileValidationResult> {
  const results = new Map<string, FileValidationResult>();

  // Check for duplicates within the upload batch
  const duplicates = findDuplicateFilenames(files);

  files.forEach((file) => {
    const result = validateFile(file, options);

    // Check for duplicate in batch
    if (duplicates.has(file.name)) {
      result.errors.push(
        `Duplicate filename in upload batch (appears ${duplicates.get(file.name)} times)`
      );
      result.valid = false;
    }

    // Check for duplicate in existing files
    if (isDuplicateFilename(file.name, existingFilenames)) {
      result.errors.push('A file with this name already exists');
      result.valid = false;
    }

    results.set(file.name, result);
  });

  return results;
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get validation summary for multiple files
 *
 * @param validationResults - Map of filename to validation result
 * @returns Summary object
 */
export function getValidationSummary(validationResults: Map<string, FileValidationResult>): {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  allValid: boolean;
} {
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
