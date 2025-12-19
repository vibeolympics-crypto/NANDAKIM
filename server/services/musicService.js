/**
 * Music Service
 * Manages music playlist, track metadata, and file discovery
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.2
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import * as configService from './musicConfigService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MUSIC_DIR = path.join(__dirname, '../../public/music');
const DATA_FILE = path.join(__dirname, '../data/music-playlist.json');
const MIN_AUDIO_FILE_SIZE_BYTES = 1024; // Skip obviously invalid audio files

/**
 * Initialize music service
 * Ensures music data directory and required files exist
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * @returns {Promise<Object>} Initialization status
 */
async function initialize() {
  console.log('[MusicService] Initializing music service...');

  const results = {
    success: true,
    created: [],
    errors: [],
  };

  try {
    // Ensure music directory exists
    console.log('[MusicService] Checking music directory...');
    await fs.mkdir(MUSIC_DIR, { recursive: true });
    console.log('[MusicService] ✓ Music directory ready');

    // Ensure data directory exists
    const dataDir = path.dirname(DATA_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    console.log('[MusicService] ✓ Data directory ready');

    // Check if playlist data file exists
    try {
      await fs.access(DATA_FILE);
      console.log('[MusicService] ✓ Playlist data file exists');
    } catch {
      // Create default playlist.json if missing
      console.log('[MusicService] Creating default playlist data file...');

      const defaultData = {
        config: {
          enabled: false,
          autoplay: false,
          defaultVolume: 70,
          playbackMode: 'random',
          position: 'bottom-right',
          maxTracks: 50,
          visibility: {
            showOnWeb: true,
            showOnMobile: true,
          },
          attribution: {
            text: 'Music created by the website operator using AI',
            showSunoAI: true,
          },
        },
        tracks: [],
      };

      await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      results.created.push('music-playlist.json');
      console.log('[MusicService] ✓ Created default playlist data file');
    }

    // Validate the data file can be loaded
    try {
      const data = await loadPlaylistData();

      // Ensure config exists
      if (!data.config) {
        console.log('[MusicService] ⚠ Config missing, adding defaults');
        data.config = await configService.getDefaultConfig();
        await savePlaylistData(data);
      }

      // Ensure tracks array exists
      if (!Array.isArray(data.tracks)) {
        console.log('[MusicService] ⚠ Tracks array missing, initializing');
        data.tracks = [];
        await savePlaylistData(data);
      }

      console.log('[MusicService] ✓ Playlist data validated');
    } catch (error) {
      console.error('[MusicService] ✗ Error validating playlist data:', error.message);
      results.errors.push({ file: 'music-playlist.json', error: error.message });
      results.success = false;
    }

    console.log('[MusicService] Initialization complete');
    console.log(`[MusicService] Created: ${results.created.length} files`);
    console.log(`[MusicService] Errors: ${results.errors.length}`);

    return results;
  } catch (error) {
    console.error('[MusicService] ✗ Fatal error during initialization:', error);
    results.success = false;
    results.errors.push({ file: 'initialization', error: error.message });
    return results;
  }
}

/**
 * Load playlist data from file
 * Requirements: 8.1, 8.2, 8.3
 * @returns {Promise<Object>} Playlist data with config and tracks
 */
async function loadPlaylistData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Log as warning - service degradation
    console.warn('[MusicService] Failed to load playlist data, using defaults:', error.message);
    // Return default structure if file doesn't exist
    return {
      config: {
        enabled: true,
        autoplay: true,
        defaultVolume: 70,
        playbackMode: 'random',
        position: 'bottom-right',
        maxTracks: 50,
        attribution: {
          text: 'Music created by the website operator using AI',
          showSunoAI: true,
        },
      },
      tracks: [],
    };
  }
}

/**
 * Save playlist data to file
 * Requirements: 8.1, 8.2, 8.3
 * @param {Object} data - Playlist data to save
 * @returns {Promise<void>}
 */
async function savePlaylistData(data) {
  try {
    // Ensure directory exists
    const dir = path.dirname(DATA_FILE);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('[MusicService] Playlist data written to:', DATA_FILE);
  } catch (error) {
    // Log as warning - service degradation
    console.warn('[MusicService] Failed to save playlist data:', error.message);
    throw error;
  }
}

/**
 * Discover MP3 files in the music directory
 * Scans /public/music/ for MP3 files and returns list with metadata
 * Requirements: 7.2, 8.1, 8.2, 8.3
 * @returns {Promise<Array>} Array of available MP3 files with metadata
 */
async function discoverMusicFiles() {
  try {
    // Ensure music directory exists
    await fs.mkdir(MUSIC_DIR, { recursive: true });

    // Read directory contents
    const files = await fs.readdir(MUSIC_DIR);

    // Filter for MP3 files only
    const mp3Files = files.filter((file) => file.toLowerCase().endsWith('.mp3'));

    // Get metadata for each file
    const filesWithMetadata = await Promise.all(
      mp3Files.map(async (filename) => {
        try {
          const filePath = path.join(MUSIC_DIR, filename);
          const stats = await fs.stat(filePath);

          return {
            filename,
            path: `/music/${filename}`,
            size: stats.size,
            // Duration will be extracted on client-side or via metadata library
            // For now, we'll set it to 0 and update when track is added
            duration: 0,
          };
        } catch (fileError) {
          // Log as warning - skip problematic files
          console.warn(`[MusicService] Failed to read file ${filename}:`, fileError.message);
          return null;
        }
      })
    );

    // Filter out null entries (failed files)
    return filesWithMetadata.filter((file) => file !== null);
  } catch (error) {
    // Log as warning - service degradation
    console.warn('[MusicService] Failed to discover music files:', error.message);
    return [];
  }
}

/**
 * Get available files with linked status
 * Returns list of MP3 files indicating which are already linked to tracks
 * Requirements: 7.2, 8.1, 8.2, 8.3
 * @returns {Promise<Array>} Array of files with linked status
 */
async function getAvailableFiles() {
  try {
    const allFiles = await discoverMusicFiles();
    const playlistData = await loadPlaylistData();

    // Create set of linked filenames for quick lookup
    const linkedFilenames = new Set(playlistData.tracks.map((track) => track.filename));

    // Add linked status to each file
    return allFiles.map((file) => ({
      ...file,
      alreadyLinked: linkedFilenames.has(file.filename),
    }));
  } catch (error) {
    // Log as warning - service degradation
    console.warn('[MusicService] Failed to get available files:', error.message);
    return [];
  }
}

/**
 * Get all tracks with metadata
 * Requirements: 7.4, 8.1, 8.2, 8.3
 * @returns {Promise<Array>} Array of tracks
 */
async function getAllTracks() {
  try {
    const playlistData = await loadPlaylistData();
    return playlistData.tracks;
  } catch (error) {
    // Log as warning - service degradation
    console.warn('[MusicService] Failed to get all tracks:', error.message);
    return [];
  }
}

/**
 * Get playlist configuration
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * @returns {Promise<Object>} Playlist configuration
 */
async function getConfig() {
  try {
    return await configService.loadConfig();
  } catch (error) {
    // Log as warning - service degradation
    console.warn('[MusicService] Failed to get config, using defaults:', error.message);
    return {
      enabled: false,
      autoplay: false,
      defaultVolume: 70,
      playbackMode: 'random',
      position: 'bottom-right',
      maxTracks: 50,
      visibility: {
        showOnWeb: true,
        showOnMobile: true,
      },
      attribution: {
        text: 'Music created by the website operator using AI',
        showSunoAI: true,
      },
    };
  }
}

/**
 * Get complete playlist (tracks + config) for public endpoint
 * Requirements: 7.1, 8.1, 8.2, 8.3
 * @returns {Promise<Object>} Complete playlist data
 */
async function getPublicPlaylist() {
  try {
    const playlistData = await loadPlaylistData();

    // Only return enabled playlist
    if (!playlistData.config.enabled) {
      return {
        config: { enabled: false },
        tracks: [],
      };
    }

    const validatedTracks = (
      await Promise.all(
        playlistData.tracks.map(async (track) => {
          try {
            const filePath = path.join(MUSIC_DIR, track.filename);
            const stats = await fs.stat(filePath);

            if (stats.size < MIN_AUDIO_FILE_SIZE_BYTES) {
              console.warn(
                `[MusicService] Skipping track ${track.filename} - file size ${stats.size} bytes is too small to be valid audio`
              );
              return null;
            }

            return {
              ...track,
              fileSize: stats.size,
              url: track.url || `/music/${track.filename}`,
            };
          } catch (error) {
            console.warn(
              `[MusicService] Skipping missing or unreadable track file ${track.filename}:`,
              error.message
            );
            return null;
          }
        })
      )
    ).filter(Boolean);

    if (validatedTracks.length !== playlistData.tracks.length) {
      console.warn(
        `[MusicService] Filtered ${playlistData.tracks.length - validatedTracks.length} invalid track(s) from playlist response`
      );
    }

    return {
      ...playlistData,
      tracks: validatedTracks,
    };
  } catch (error) {
    // Log as warning - service degradation
    console.warn('[MusicService] Failed to get public playlist:', error.message);
    return {
      config: { enabled: false },
      tracks: [],
    };
  }
}

/**
 * Add new track to playlist
 * Requirements: 7.3
 * @param {Object} trackData - Track metadata
 * @param {string} trackData.filename - MP3 filename
 * @param {string} trackData.title - Track title
 * @param {string} trackData.artist - Artist name
 * @param {number} [trackData.duration] - Track duration in seconds
 * @returns {Promise<Object>} Created track
 */
async function addTrack(trackData) {
  const { filename, title, artist, duration = 0 } = trackData;

  // Validate required fields
  if (!filename || !title || !artist) {
    throw new Error('Missing required fields: filename, title, and artist are required');
  }

  // Validate title and artist length
  if (title.length > 200) {
    throw new Error('Title must be 200 characters or less');
  }

  if (artist.length > 100) {
    throw new Error('Artist must be 100 characters or less');
  }

  const playlistData = await loadPlaylistData();

  // Check if filename is already linked
  const existingTrack = playlistData.tracks.find((t) => t.filename === filename);
  if (existingTrack) {
    throw new Error('This file is already linked to a track');
  }

  // Check max tracks limit
  if (playlistData.tracks.length >= playlistData.config.maxTracks) {
    throw new Error(`Maximum ${playlistData.config.maxTracks} tracks allowed`);
  }

  // Verify file exists
  const filePath = path.join(MUSIC_DIR, filename);
  try {
    const stats = await fs.stat(filePath);

    // Create new track
    const newTrack = {
      id: crypto.randomUUID(),
      title,
      artist,
      filename,
      url: `/music/${filename}`,
      duration,
      fileSize: stats.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: playlistData.tracks.length,
    };

    playlistData.tracks.push(newTrack);
    await savePlaylistData(playlistData);

    return newTrack;
  } catch (error) {
    throw new Error(`File not found: ${filename}`);
  }
}

/**
 * Update track metadata
 * Requirements: 7.4, 9.3, 9.4
 * @param {string} trackId - Track ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated track
 */
async function updateTrack(trackId, updates) {
  const playlistData = await loadPlaylistData();

  const trackIndex = playlistData.tracks.findIndex((t) => t.id === trackId);
  if (trackIndex === -1) {
    throw new Error('Track not found');
  }

  const track = playlistData.tracks[trackIndex];

  // Update allowed fields
  if (updates.title !== undefined) {
    if (updates.title.length > 200) {
      throw new Error('Title must be 200 characters or less');
    }
    track.title = updates.title;
  }

  if (updates.artist !== undefined) {
    if (updates.artist.length > 100) {
      throw new Error('Artist must be 100 characters or less');
    }
    track.artist = updates.artist;
  }

  if (updates.duration !== undefined) {
    track.duration = updates.duration;
  }

  track.updatedAt = new Date().toISOString();

  await savePlaylistData(playlistData);

  return track;
}

/**
 * Delete track from playlist
 * Note: This only removes the track metadata, not the actual file
 * Requirements: 7.5
 * @param {string} trackId - Track ID
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteTrack(trackId) {
  console.log('deleteTrack called with ID:', trackId);
  const playlistData = await loadPlaylistData();

  console.log('Current tracks count:', playlistData.tracks.length);
  const trackIndex = playlistData.tracks.findIndex((t) => t.id === trackId);
  console.log('Track index found:', trackIndex);

  if (trackIndex === -1) {
    throw new Error('Track not found');
  }

  const deletedTrack = playlistData.tracks[trackIndex];
  console.log('Deleting track:', deletedTrack.title);

  // Remove track
  playlistData.tracks.splice(trackIndex, 1);
  console.log('Tracks after deletion:', playlistData.tracks.length);

  // Reorder remaining tracks
  playlistData.tracks.forEach((track, index) => {
    track.order = index;
  });

  await savePlaylistData(playlistData);
  console.log('Playlist data saved successfully');

  return true;
}

/**
 * Delete multiple tracks from playlist
 * Note: This only removes the track metadata, not the actual files
 * Requirements: 7.5
 * @param {Array<string>} trackIds - Array of track IDs to delete
 * @returns {Promise<Object>} Deletion results
 */
async function deleteMultipleTracks(trackIds) {
  console.log('deleteMultipleTracks called with IDs:', trackIds);
  const playlistData = await loadPlaylistData();

  const initialCount = playlistData.tracks.length;
  const trackIdsSet = new Set(trackIds);
  const notFound = [];

  // Validate all track IDs exist
  for (const id of trackIds) {
    if (!playlistData.tracks.find((t) => t.id === id)) {
      notFound.push(id);
    }
  }

  if (notFound.length > 0) {
    throw new Error(`Tracks not found: ${notFound.join(', ')}`);
  }

  // Remove tracks
  playlistData.tracks = playlistData.tracks.filter((track) => !trackIdsSet.has(track.id));

  const deletedCount = initialCount - playlistData.tracks.length;
  console.log(`Deleted ${deletedCount} tracks. Remaining: ${playlistData.tracks.length}`);

  // Reorder remaining tracks
  playlistData.tracks.forEach((track, index) => {
    track.order = index;
  });

  await savePlaylistData(playlistData);
  console.log('Playlist data saved successfully');

  return {
    deleted: deletedCount,
    remaining: playlistData.tracks.length,
  };
}

/**
 * Reorder tracks
 * Requirements: 8.1, 8.2
 * @param {Array<string>} trackIds - Array of track IDs in new order
 * @returns {Promise<Array>} Reordered tracks
 */
async function reorderTracks(trackIds) {
  const playlistData = await loadPlaylistData();

  // Validate all track IDs exist
  const trackMap = new Map(playlistData.tracks.map((t) => [t.id, t]));

  if (trackIds.length !== playlistData.tracks.length) {
    throw new Error('Track ID count mismatch');
  }

  for (const id of trackIds) {
    if (!trackMap.has(id)) {
      throw new Error(`Track not found: ${id}`);
    }
  }

  // Reorder tracks
  const reorderedTracks = trackIds.map((id, index) => {
    const track = trackMap.get(id);
    track.order = index;
    return track;
  });

  playlistData.tracks = reorderedTracks;
  await savePlaylistData(playlistData);

  return reorderedTracks;
}

/**
 * Update playlist configuration
 * Requirements: 8.3, 8.4, 8.5
 * @param {Object} configUpdates - Configuration updates
 * @returns {Promise<Object>} Updated configuration
 */
async function updateConfig(configUpdates) {
  return await configService.saveConfig(configUpdates);
}

export {
  initialize,
  discoverMusicFiles,
  getAvailableFiles,
  getAllTracks,
  getConfig,
  getPublicPlaylist,
  addTrack,
  updateTrack,
  deleteTrack,
  deleteMultipleTracks,
  reorderTracks,
  updateConfig,
};
