/**
 * File Validator Tests - Server Side
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
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
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from './fileValidator.js';

// Helper to create mock multer file objects
function createMockFile(originalname, size, mimetype = 'audio/mpeg') {
  return {
    originalname,
    size,
    mimetype,
    filename: originalname,
    path: `/tmp/${originalname}`,
  };
}

describe('fileValidator - Constants', () => {
  it('should have correct MAX_FILE_SIZE', () => {
    assert.strictEqual(MAX_FILE_SIZE, 50 * 1024 * 1024);
  });

  it('should have correct ALLOWED_EXTENSIONS', () => {
    assert.deepStrictEqual(ALLOWED_EXTENSIONS, ['.mp3', '.wav', '.m4a']);
  });

  it('should have correct ALLOWED_MIME_TYPES', () => {
    assert.ok(ALLOWED_MIME_TYPES.includes('audio/mpeg'));
    assert.ok(ALLOWED_MIME_TYPES.includes('audio/wav'));
    assert.ok(ALLOWED_MIME_TYPES.includes('audio/mp4'));
  });
});

describe('getFileExtension', () => {
  it('should extract extension from filename', () => {
    assert.strictEqual(getFileExtension('song.mp3'), '.mp3');
    assert.strictEqual(getFileExtension('track.wav'), '.wav');
    assert.strictEqual(getFileExtension('audio.m4a'), '.m4a');
  });

  it('should handle uppercase extensions', () => {
    assert.strictEqual(getFileExtension('SONG.MP3'), '.mp3');
    assert.strictEqual(getFileExtension('Track.WAV'), '.wav');
  });

  it('should handle filenames with multiple dots', () => {
    assert.strictEqual(getFileExtension('my.song.mp3'), '.mp3');
  });

  it('should return empty string for no extension', () => {
    assert.strictEqual(getFileExtension('noextension'), '');
  });
});

describe('validateFileExtension', () => {
  it('should accept valid extensions', () => {
    const mp3File = createMockFile('song.mp3', 1000);
    const wavFile = createMockFile('song.wav', 1000);
    const m4aFile = createMockFile('song.m4a', 1000);

    assert.strictEqual(validateFileExtension(mp3File, ALLOWED_EXTENSIONS), null);
    assert.strictEqual(validateFileExtension(wavFile, ALLOWED_EXTENSIONS), null);
    assert.strictEqual(validateFileExtension(m4aFile, ALLOWED_EXTENSIONS), null);
  });

  it('should reject invalid extensions', () => {
    const txtFile = createMockFile('file.txt', 1000);
    const result = validateFileExtension(txtFile, ALLOWED_EXTENSIONS);

    assert.notStrictEqual(result, null);
    assert.ok(result.includes('Invalid file type'));
  });

  it('should reject files without extension', () => {
    const noExtFile = createMockFile('noextension', 1000);
    const result = validateFileExtension(noExtFile, ALLOWED_EXTENSIONS);

    assert.notStrictEqual(result, null);
    assert.ok(result.includes('no extension'));
  });
});

describe('validateFileSize', () => {
  it('should accept files within size limit', () => {
    const smallFile = createMockFile('small.mp3', 1024);
    const mediumFile = createMockFile('medium.mp3', 10 * 1024 * 1024);

    assert.strictEqual(validateFileSize(smallFile, MAX_FILE_SIZE), null);
    assert.strictEqual(validateFileSize(mediumFile, MAX_FILE_SIZE), null);
  });

  it('should reject files exceeding size limit', () => {
    const largeFile = createMockFile('large.mp3', 60 * 1024 * 1024);
    const result = validateFileSize(largeFile, MAX_FILE_SIZE);

    assert.notStrictEqual(result, null);
    assert.ok(result.includes('exceeds maximum'));
  });

  it('should reject empty files', () => {
    const emptyFile = createMockFile('empty.mp3', 0);
    const result = validateFileSize(emptyFile, MAX_FILE_SIZE);

    assert.notStrictEqual(result, null);
    assert.ok(result.includes('empty'));
  });
});

describe('validateMimeType', () => {
  it('should accept valid MIME types', () => {
    const mp3File = createMockFile('song.mp3', 1000, 'audio/mpeg');
    const wavFile = createMockFile('song.wav', 1000, 'audio/wav');
    const m4aFile = createMockFile('song.m4a', 1000, 'audio/mp4');

    assert.strictEqual(validateMimeType(mp3File, ALLOWED_MIME_TYPES), null);
    assert.strictEqual(validateMimeType(wavFile, ALLOWED_MIME_TYPES), null);
    assert.strictEqual(validateMimeType(m4aFile, ALLOWED_MIME_TYPES), null);
  });

  it('should reject invalid MIME types', () => {
    const txtFile = createMockFile('file.txt', 1000, 'text/plain');
    const result = validateMimeType(txtFile, ALLOWED_MIME_TYPES);

    assert.notStrictEqual(result, null);
    assert.ok(result.includes('Invalid file type'));
  });

  it('should handle missing MIME type', () => {
    const file = createMockFile('song.mp3', 1000, '');
    const result = validateMimeType(file, ALLOWED_MIME_TYPES);

    assert.strictEqual(result, null);
  });
});

describe('fileExists', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filevalidator-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should detect existing file', async () => {
    const filename = 'test.mp3';
    const filePath = path.join(tempDir, filename);
    await fs.writeFile(filePath, 'test content');

    const exists = await fileExists(filename, tempDir);
    assert.strictEqual(exists, true);
  });

  it('should return false for non-existing file', async () => {
    const exists = await fileExists('nonexistent.mp3', tempDir);
    assert.strictEqual(exists, false);
  });
});

describe('findDuplicateFilenames', () => {
  it('should find duplicate filenames', () => {
    const files = [
      createMockFile('song1.mp3', 1000),
      createMockFile('song2.mp3', 1000),
      createMockFile('song1.mp3', 1000),
    ];

    const duplicates = findDuplicateFilenames(files);

    assert.strictEqual(duplicates.size, 1);
    assert.strictEqual(duplicates.get('song1.mp3'), 2);
  });

  it('should return empty map when no duplicates', () => {
    const files = [
      createMockFile('song1.mp3', 1000),
      createMockFile('song2.mp3', 1000),
      createMockFile('song3.mp3', 1000),
    ];

    const duplicates = findDuplicateFilenames(files);

    assert.strictEqual(duplicates.size, 0);
  });

  it('should handle multiple duplicates', () => {
    const files = [
      createMockFile('song1.mp3', 1000),
      createMockFile('song1.mp3', 1000),
      createMockFile('song2.mp3', 1000),
      createMockFile('song2.mp3', 1000),
      createMockFile('song3.mp3', 1000),
    ];

    const duplicates = findDuplicateFilenames(files);

    assert.strictEqual(duplicates.size, 2);
    assert.strictEqual(duplicates.get('song1.mp3'), 2);
    assert.strictEqual(duplicates.get('song2.mp3'), 2);
  });
});

describe('validateFile', () => {
  it('should validate a valid file', () => {
    const validFile = createMockFile('song.mp3', 1000, 'audio/mpeg');
    const result = validateFile(validFile);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('should detect multiple errors', () => {
    const invalidFile = createMockFile('file.txt', 60 * 1024 * 1024, 'text/plain');
    const result = validateFile(invalidFile);

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('should use custom validation options', () => {
    const file = createMockFile('song.mp3', 2 * 1024 * 1024);
    const customOptions = {
      maxSize: 1 * 1024 * 1024,
      allowedExtensions: ['.mp3'],
      allowedMimeTypes: ['audio/mpeg'],
    };

    const result = validateFile(file, customOptions);

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('exceeds maximum')));
  });
});

describe('validateFiles', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filevalidator-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should validate multiple files', async () => {
    const files = [
      createMockFile('song1.mp3', 1000, 'audio/mpeg'),
      createMockFile('song2.wav', 2000, 'audio/wav'),
      createMockFile('song3.m4a', 3000, 'audio/mp4'),
    ];

    const results = await validateFiles(files);

    assert.strictEqual(results.size, 3);
    results.forEach((result) => {
      assert.strictEqual(result.valid, true);
    });
  });

  it('should detect duplicates in batch', async () => {
    const files = [createMockFile('song1.mp3', 1000), createMockFile('song1.mp3', 1000)];

    const results = await validateFiles(files);

    assert.strictEqual(results.size, 1);
    const result = results.get('song1.mp3');
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Duplicate')));
  });

  it('should detect duplicates with existing files', async () => {
    // Create an existing file
    await fs.writeFile(path.join(tempDir, 'song1.mp3'), 'test');

    const files = [createMockFile('song1.mp3', 1000), createMockFile('song2.mp3', 1000)];

    const results = await validateFiles(files, undefined, tempDir);

    const song1Result = results.get('song1.mp3');
    const song2Result = results.get('song2.mp3');

    assert.strictEqual(song1Result.valid, false);
    assert.ok(song1Result.errors.some((e) => e.includes('already exists')));
    assert.strictEqual(song2Result.valid, true);
  });

  it('should handle mixed valid and invalid files', async () => {
    const files = [
      createMockFile('valid.mp3', 1000, 'audio/mpeg'),
      createMockFile('invalid.txt', 1000, 'text/plain'),
      createMockFile('toolarge.mp3', 60 * 1024 * 1024, 'audio/mpeg'),
    ];

    const results = await validateFiles(files);

    assert.strictEqual(results.get('valid.mp3').valid, true);
    assert.strictEqual(results.get('invalid.txt').valid, false);
    assert.strictEqual(results.get('toolarge.mp3').valid, false);
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    assert.strictEqual(formatFileSize(0), '0 Bytes');
    assert.strictEqual(formatFileSize(1024), '1 KB');
    assert.strictEqual(formatFileSize(1024 * 1024), '1 MB');
    assert.strictEqual(formatFileSize(1024 * 1024 * 1024), '1 GB');
  });

  it('should format decimal values', () => {
    assert.strictEqual(formatFileSize(1536), '1.5 KB');
    assert.strictEqual(formatFileSize(5.5 * 1024 * 1024), '5.5 MB');
  });
});

describe('getValidationSummary', () => {
  it('should provide correct summary', () => {
    const results = new Map([
      ['file1.mp3', { valid: true, errors: [] }],
      ['file2.mp3', { valid: true, errors: [] }],
      ['file3.txt', { valid: false, errors: ['Invalid type'] }],
    ]);

    const summary = getValidationSummary(results);

    assert.strictEqual(summary.totalFiles, 3);
    assert.strictEqual(summary.validFiles, 2);
    assert.strictEqual(summary.invalidFiles, 1);
    assert.strictEqual(summary.allValid, false);
  });

  it('should handle all valid files', () => {
    const results = new Map([
      ['file1.mp3', { valid: true, errors: [] }],
      ['file2.mp3', { valid: true, errors: [] }],
    ]);

    const summary = getValidationSummary(results);

    assert.strictEqual(summary.allValid, true);
  });

  it('should handle empty results', () => {
    const results = new Map();
    const summary = getValidationSummary(results);

    assert.strictEqual(summary.totalFiles, 0);
    assert.strictEqual(summary.validFiles, 0);
    assert.strictEqual(summary.invalidFiles, 0);
    assert.strictEqual(summary.allValid, true);
  });
});

describe('sanitizeFilename', () => {
  it('should remove path components', () => {
    assert.strictEqual(sanitizeFilename('../../../etc/passwd'), 'passwd');
    assert.strictEqual(sanitizeFilename('../../song.mp3'), 'song.mp3');
  });

  it('should replace special characters', () => {
    assert.strictEqual(sanitizeFilename('song<>:"|?*.mp3'), 'song_______.mp3');
  });

  it('should keep valid characters', () => {
    assert.strictEqual(sanitizeFilename('my-song_01.mp3'), 'my-song_01.mp3');
    assert.strictEqual(sanitizeFilename('Song Name.mp3'), 'Song Name.mp3');
  });

  it('should handle unicode characters', () => {
    const result = sanitizeFilename('歌曲.mp3');
    assert.ok(result.includes('.mp3'));
  });
});
