/**
 * Audio Metadata Extraction Utility
 * Requirements: 1.1, 3.2
 *
 * Extracts metadata from audio files including:
 * - Title from ID3 tags
 * - Artist from ID3 tags
 * - Duration
 * - Fallback to filename parsing if tags are missing
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Parse filename to extract title and artist
 * Supports formats like:
 * - "Artist - Title.mp3"
 * - "Title.mp3"
 * - "Artist_Title.mp3"
 *
 * @param {string} filename - Audio filename
 * @returns {Object} Parsed metadata
 */
function parseFilename(filename) {
  // Remove extension
  const nameWithoutExt = path.basename(filename, path.extname(filename));

  // Try to split by common separators
  let title = nameWithoutExt;
  let artist = 'Unknown Artist';

  // Check for " - " separator (most common)
  if (nameWithoutExt.includes(' - ')) {
    const parts = nameWithoutExt.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }
  // Check for "_" separator
  else if (nameWithoutExt.includes('_')) {
    const parts = nameWithoutExt.split('_');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join('_').trim();
    }
  }

  return {
    title: title || 'Untitled',
    artist: artist || 'Unknown Artist',
  };
}

/**
 * Read basic file information
 * @param {string} filePath - Path to audio file
 * @returns {Promise<Object>} File information
 */
async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const filename = path.basename(filePath);

    return {
      filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch (error) {
    throw new Error(`Failed to read file info: ${error.message}`);
  }
}

/**
 * Extract basic ID3 tags from MP3 file
 * This is a simplified implementation that reads common ID3v2 tags
 * For production, consider using a library like 'music-metadata' or 'node-id3'
 *
 * @param {string} filePath - Path to audio file
 * @returns {Promise<Object>} Extracted metadata
 */
async function extractID3Tags(filePath) {
  try {
    // Read first 10KB of file to check for ID3 tags
    const buffer = Buffer.alloc(10240);
    const fileHandle = await fs.open(filePath, 'r');

    try {
      await fileHandle.read(buffer, 0, 10240, 0);
    } finally {
      await fileHandle.close();
    }

    // Check for ID3v2 header (first 3 bytes should be "ID3")
    if (buffer.toString('ascii', 0, 3) !== 'ID3') {
      return null; // No ID3v2 tags found
    }

    // This is a simplified parser - in production, use a proper library
    // For now, we'll return null and fall back to filename parsing
    return null;
  } catch (error) {
    console.error('Error extracting ID3 tags:', error);
    return null;
  }
}

/**
 * Get audio duration using a simple approach
 * Note: This is a placeholder. For accurate duration, use a library like 'music-metadata'
 * or 'ffprobe' in production
 *
 * @param {string} filePath - Path to audio file
 * @returns {Promise<number>} Duration in seconds (0 if unable to determine)
 */
async function getAudioDuration(filePath) {
  // Placeholder implementation
  // In production, use music-metadata or ffprobe to get accurate duration
  // For now, return 0 and let the client calculate it
  return 0;
}

/**
 * Extract complete metadata from audio file
 * Requirements: 1.1, 3.2
 *
 * @param {string} filePath - Path to audio file
 * @param {Object} options - Extraction options
 * @param {boolean} [options.useFilename] - Fallback to filename parsing if tags missing
 * @returns {Promise<Object>} Complete metadata
 */
export async function extractMetadata(filePath, options = {}) {
  const { useFilename = true } = options;

  try {
    // Get basic file info
    const fileInfo = await getFileInfo(filePath);

    // Try to extract ID3 tags
    const id3Tags = await extractID3Tags(filePath);

    // Get duration
    const duration = await getAudioDuration(filePath);

    // Determine title and artist
    let title, artist;

    if (id3Tags && id3Tags.title) {
      // Use ID3 tags if available
      title = id3Tags.title;
      artist = id3Tags.artist || 'Unknown Artist';
    } else if (useFilename) {
      // Fall back to filename parsing
      const parsed = parseFilename(fileInfo.filename);
      title = parsed.title;
      artist = parsed.artist;
    } else {
      // Use defaults
      title = 'Untitled';
      artist = 'Unknown Artist';
    }

    return {
      filename: fileInfo.filename,
      title,
      artist,
      duration,
      fileSize: fileInfo.size,
      source: id3Tags ? 'id3' : 'filename',
      createdAt: fileInfo.createdAt,
      modifiedAt: fileInfo.modifiedAt,
    };
  } catch (error) {
    throw new Error(`Failed to extract metadata: ${error.message}`);
  }
}

/**
 * Extract metadata from multiple files
 * @param {Array<string>} filePaths - Array of file paths
 * @param {Object} options - Extraction options
 * @returns {Promise<Array<Object>>} Array of metadata objects
 */
export async function extractMetadataFromMultiple(filePaths, options = {}) {
  const results = await Promise.allSettled(
    filePaths.map((filePath) => extractMetadata(filePath, options))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        success: true,
        data: result.value,
      };
    } else {
      return {
        success: false,
        error: result.reason.message,
        filePath: filePaths[index],
      };
    }
  });
}

export default {
  extractMetadata,
  extractMetadataFromMultiple,
  parseFilename,
  getFileInfo,
  extractID3Tags,
  getAudioDuration,
};
