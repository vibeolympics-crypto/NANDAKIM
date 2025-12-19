/**
 * Music API Routes
 * Handles music playlist and track management endpoints
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { autoCacheInvalidation } from '../middleware/cacheInvalidation.js';
import rateLimit from 'express-rate-limit';
import * as musicService from '../services/musicService.js';

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    ok: false,
    message: 'Too many uploads from this IP, please try again later.',
    code: 'RATE_LIMITED',
  },
});

// In-memory storage for upload status tracking
// In production, use Redis or a database
const uploadStatus = new Map();

/**
 * GET /api/music/playlist
 * Public endpoint - Get complete playlist with tracks and config
 * Requirements: 7.1, 6.1, 6.2
 */
router.get(
  '/playlist',
  asyncHandler(async (req, res) => {
    try {
      const playlist = await musicService.getPublicPlaylist();

      return res.json({
        ok: true,
        data: playlist,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Music API] Error fetching playlist:', error);
      }

      // Return default empty playlist instead of 500
      return res.json({
        ok: true,
        data: {
          config: {
            enabled: false,
            autoplay: false,
            defaultVolume: 70,
            playbackMode: 'random',
            position: 'bottom-right',
          },
          tracks: [],
        },
      });
    }
  })
);

/**
 * GET /api/music/tracks (when mounted at /api/admin/music)
 * Admin endpoint - List all tracks with metadata
 * Requirements: 7.4, 6.1, 6.2
 */
router.get(
  '/tracks',
  asyncHandler(async (req, res) => {
    try {
      const tracks = await musicService.getAllTracks();

      return res.json({
        ok: true,
        data: tracks,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Music API] Error fetching tracks:', error);
      }

      // Return empty array instead of 500
      return res.json({
        ok: true,
        data: [],
      });
    }
  })
);

/**
 * GET /api/music/files (when mounted at /api/admin/music)
 * Admin endpoint - Get available MP3 files with linked status
 * Requirements: 7.2, 6.1, 6.2
 */
router.get(
  '/files',
  asyncHandler(async (req, res) => {
    try {
      const files = await musicService.getAvailableFiles();

      return res.json({
        ok: true,
        data: files,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Music API] Error fetching available files:', error);
      }

      // Return empty array instead of 500
      return res.json({
        ok: true,
        data: [],
      });
    }
  })
);

/**
 * POST /api/music/tracks (when mounted at /api/admin/music)
 * Admin endpoint - Add track metadata
 * Requirements: 7.3
 * Auto-invalidates music cache on track add
 */
router.post(
  '/tracks',
  asyncHandler(async (req, res) => {
    const { filename, title, artist, duration } = req.body;

    // Validate required fields
    if (!filename || !title || !artist) {
      return res.status(400).json({
        ok: false,
        message: 'Missing required fields',
        errors: {
          filename: !filename ? 'Filename is required' : null,
          title: !title ? 'Title is required' : null,
          artist: !artist ? 'Artist is required' : null,
        },
      });
    }

    try {
      const track = await musicService.addTrack({
        filename,
        title,
        artist,
        duration,
      });

      return res.status(201).json({
        ok: true,
        message: 'Track added successfully',
        data: track,
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        message: error.message,
      });
    }
  }),
  autoCacheInvalidation('music')
);

/**
 * PUT /api/music/tracks/:id (when mounted at /api/admin/music)
 * Admin endpoint - Update track metadata
 * Requirements: 7.4, 9.3, 9.4
 * Auto-invalidates music cache on track update
 */
router.put(
  '/tracks/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, artist, duration } = req.body;

    try {
      const track = await musicService.updateTrack(id, {
        title,
        artist,
        duration,
      });

      return res.json({
        ok: true,
        message: 'Track updated successfully',
        data: track,
      });
    } catch (error) {
      return res.status(404).json({
        ok: false,
        message: error.message,
      });
    }
  }),
  autoCacheInvalidation('music')
);

/**
 * DELETE /api/music/tracks/:id (when mounted at /api/admin/music)
 * Admin endpoint - Remove track from playlist
 * Note: This only removes metadata, not the actual file
 * Requirements: 7.5
 * Auto-invalidates music cache on track delete
 */
router.delete(
  '/tracks/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      await musicService.deleteTrack(id);

      return res.json({
        ok: true,
        message: 'Track removed from playlist',
      });
    } catch (error) {
      return res.status(404).json({
        ok: false,
        message: error.message,
      });
    }
  }),
  autoCacheInvalidation('music')
);

/**
 * POST /api/music/tracks/delete-multiple (when mounted at /api/admin/music)
 * Admin endpoint - Remove multiple tracks from playlist
 * Note: This only removes metadata, not the actual files
 * Requirements: 7.5
 * Auto-invalidates music cache on track delete
 */
router.post(
  '/tracks/delete-multiple',
  asyncHandler(async (req, res) => {
    const { trackIds } = req.body;

    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'trackIds must be a non-empty array',
      });
    }

    try {
      const results = await musicService.deleteMultipleTracks(trackIds);

      return res.json({
        ok: true,
        message: `Removed ${results.deleted} track(s) from playlist`,
        data: results,
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        message: error.message,
      });
    }
  }),
  autoCacheInvalidation('music')
);

/**
 * PUT /api/music/tracks/reorder (when mounted at /api/admin/music)
 * Admin endpoint - Reorder tracks
 * Requirements: 8.1, 8.2
 */
router.put(
  '/tracks/reorder',
  asyncHandler(async (req, res) => {
    const { trackIds } = req.body;

    if (!Array.isArray(trackIds)) {
      return res.status(400).json({
        ok: false,
        message: 'trackIds must be an array',
      });
    }

    try {
      const tracks = await musicService.reorderTracks(trackIds);

      return res.json({
        ok: true,
        message: 'Tracks reordered successfully',
        data: tracks,
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        message: error.message,
      });
    }
  })
);

/**
 * GET /api/music/config (when mounted at /api/admin/music)
 * Admin endpoint - Get playlist configuration
 * Requirements: 8.3, 8.4, 8.5, 6.1, 6.2
 */
router.get(
  '/config',
  asyncHandler(async (req, res) => {
    try {
      const config = await musicService.getConfig();

      return res.json({
        ok: true,
        data: config,
      });
    } catch (error) {
      // Log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Music API] Error fetching config:', error);
      }

      // Return default config instead of 500
      return res.json({
        ok: true,
        data: {
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
      });
    }
  })
);

/**
 * PUT /api/music/config (when mounted at /api/admin/music)
 * Admin endpoint - Update playlist configuration
 * Requirements: 8.3, 8.4, 8.5
 * Auto-invalidates music cache on update
 */
router.put(
  '/config',
  asyncHandler(async (req, res) => {
    const configUpdates = req.body;

    try {
      const config = await musicService.updateConfig(configUpdates);

      return res.json({
        ok: true,
        message: 'Configuration updated successfully',
        data: config,
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        message: error.message,
      });
    }
  }),
  autoCacheInvalidation('music')
);

/**
 * POST /api/music/upload (when mounted at /api/admin/music)
 * Admin endpoint - Upload single music file
 * Requirements: 1.1, 1.3, 1.5, 9.1, 9.2, 9.3
 */
router.post(
  '/upload',
  uploadLimiter,
  asyncHandler(async (req, res) => {
    const path = await import('path');
    const { createMusicUpload, validateUploadedFile } = await import('../config/multer.js');
    const { extractMetadata } = await import('../utils/audioMetadata.js');

    const uploadDir = path.join(process.cwd(), 'public', 'music');
    const upload = createMusicUpload({ uploadDir, multiple: false });

    // Handle single file upload
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          message: err.message || 'Upload failed',
          code: 'UPLOAD_ERROR',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          ok: false,
          message: 'No file uploaded',
          code: 'NO_FILE',
        });
      }

      // Validate uploaded file
      const validation = validateUploadedFile(req.file);
      if (!validation.valid) {
        // Delete invalid file
        try {
          await import('fs/promises').then((fs) => fs.unlink(req.file.path));
        } catch (unlinkError) {
          console.error('Failed to delete invalid file:', unlinkError);
        }

        return res.status(400).json({
          ok: false,
          message: 'File validation failed',
          errors: validation.errors,
          code: 'VALIDATION_ERROR',
        });
      }

      // Extract metadata from uploaded file
      let metadata = null;
      try {
        metadata = await extractMetadata(req.file.path, { useFilename: true });
      } catch (metadataError) {
        console.error('Failed to extract metadata:', metadataError);
        // Continue without metadata - can be added manually later
      }

      const responseData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: `/music/${req.file.filename}`,
        mimetype: req.file.mimetype,
        metadata: metadata
          ? {
              title: metadata.title,
              artist: metadata.artist,
              duration: metadata.duration,
              source: metadata.source,
            }
          : null,
      };

      if (req.query.autolink === 'true') {
        try {
          const track = await musicService.addTrack({
            filename: responseData.filename,
            title: responseData.metadata?.title || responseData.originalName,
            artist: responseData.metadata?.artist || 'AI Generated',
            duration: responseData.metadata?.duration || 0,
          });

          uploadStatus.set(track.id, {
            status: 'linked',
            message: 'Track created automatically',
            trackId: track.id,
          });

          return res.json({
            ok: true,
            message: 'File uploaded and track created successfully',
            data: {
              ...responseData,
              trackId: track.id,
              track,
            },
          });
        } catch (trackError) {
          return res.status(400).json({
            ok: false,
            message: trackError.message || 'Failed to auto-link uploaded file',
            code: 'TRACK_CREATE_FAILED',
          });
        }
      }

      return res.json({
        ok: true,
        message: 'File uploaded successfully',
        data: responseData,
      });
    });
  })
);

/**
 * POST /api/music/upload/multiple (when mounted at /api/admin/music)
 * Admin endpoint - Upload multiple music files
 * Requirements: 1.3, 1.5, 3.3
 */
router.post(
  '/upload/multiple',
  uploadLimiter,
  asyncHandler(async (req, res) => {
    const path = await import('path');
    const { createMusicUpload, validateUploadedFile } = await import('../config/multer.js');
    const { extractMetadataFromMultiple } = await import('../utils/audioMetadata.js');

    const uploadDir = path.join(process.cwd(), 'public', 'music');
    const upload = createMusicUpload({ uploadDir, multiple: true });

    // Handle multiple file upload
    upload.array('files', 10)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          message: err.message || 'Upload failed',
          code: 'UPLOAD_ERROR',
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'No files uploaded',
          code: 'NO_FILES',
        });
      }

      // Validate all uploaded files
      const results = [];
      const validFiles = [];
      const invalidFiles = [];

      for (const file of req.files) {
        const validation = validateUploadedFile(file);

        if (validation.valid) {
          validFiles.push(file);
        } else {
          invalidFiles.push({
            filename: file.originalname,
            errors: validation.errors,
          });

          // Delete invalid file
          try {
            await import('fs/promises').then((fs) => fs.unlink(file.path));
          } catch (unlinkError) {
            console.error('Failed to delete invalid file:', unlinkError);
          }
        }
      }

      // Extract metadata from valid files
      let metadataResults = [];
      if (validFiles.length > 0) {
        const filePaths = validFiles.map((f) => f.path);
        metadataResults = await extractMetadataFromMultiple(filePaths, { useFilename: true });
      }

      // Build response with results for each file
      validFiles.forEach((file, index) => {
        const metadataResult = metadataResults[index];

        results.push({
          success: true,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          path: `/music/${file.filename}`,
          mimetype: file.mimetype,
          metadata:
            metadataResult && metadataResult.success
              ? {
                  title: metadataResult.data.title,
                  artist: metadataResult.data.artist,
                  duration: metadataResult.data.duration,
                  source: metadataResult.data.source,
                }
              : null,
        });
      });

      // Add invalid files to results
      invalidFiles.forEach((file) => {
        results.push({
          success: false,
          filename: file.filename,
          errors: file.errors,
        });
      });

      return res.json({
        ok: true,
        message: `Uploaded ${validFiles.length} of ${req.files.length} files successfully`,
        summary: {
          total: req.files.length,
          successful: validFiles.length,
          failed: invalidFiles.length,
        },
        results,
      });
    });
  })
);

/**
 * POST /api/music/upload/folder (when mounted at /api/admin/music)
 * Admin endpoint - Upload folder contents
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * Note: This endpoint handles the same as multiple upload since folder structure
 * is flattened on the client side before upload
 */
router.post(
  '/upload/folder',
  uploadLimiter,
  asyncHandler(async (req, res) => {
    // Reuse the multiple upload logic
    const path = await import('path');
    const { createMusicUpload, validateUploadedFile } = await import('../config/multer.js');
    const { extractMetadataFromMultiple } = await import('../utils/audioMetadata.js');

    const uploadDir = path.join(process.cwd(), 'public', 'music');
    const upload = createMusicUpload({ uploadDir, multiple: true });

    upload.array('files', 10)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          message: err.message || 'Folder upload failed',
          code: 'UPLOAD_ERROR',
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'No files found in folder',
          code: 'NO_FILES',
        });
      }

      // Validate and process files
      const results = [];
      const validFiles = [];
      const invalidFiles = [];
      const skippedFiles = [];

      for (const file of req.files) {
        const validation = validateUploadedFile(file);

        if (validation.valid) {
          validFiles.push(file);
        } else {
          // Check if it's a non-music file (should be skipped, not error)
          const ext = path.extname(file.originalname).toLowerCase();
          const isNonMusicFile = !['.mp3', '.wav', '.m4a'].includes(ext);

          if (isNonMusicFile) {
            skippedFiles.push({
              filename: file.originalname,
              reason: 'Not a music file',
            });
          } else {
            invalidFiles.push({
              filename: file.originalname,
              errors: validation.errors,
            });
          }

          // Delete file
          try {
            await import('fs/promises').then((fs) => fs.unlink(file.path));
          } catch (unlinkError) {
            console.error('Failed to delete file:', unlinkError);
          }
        }
      }

      // Extract metadata from valid files
      let metadataResults = [];
      if (validFiles.length > 0) {
        const filePaths = validFiles.map((f) => f.path);
        metadataResults = await extractMetadataFromMultiple(filePaths, { useFilename: true });
      }

      // Build response
      validFiles.forEach((file, index) => {
        const metadataResult = metadataResults[index];

        results.push({
          success: true,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          path: `/music/${file.filename}`,
          metadata:
            metadataResult && metadataResult.success
              ? {
                  title: metadataResult.data.title,
                  artist: metadataResult.data.artist,
                  duration: metadataResult.data.duration,
                }
              : null,
        });
      });

      return res.json({
        ok: true,
        message: `Folder upload complete: ${validFiles.length} music files uploaded`,
        summary: {
          totalFiles: req.files.length,
          musicFilesUploaded: validFiles.length,
          nonMusicFilesSkipped: skippedFiles.length,
          invalidFiles: invalidFiles.length,
        },
        results,
        skipped: skippedFiles,
        errors: invalidFiles,
      });
    });
  })
);

/**
 * GET /api/music/upload/status/:id (when mounted at /api/admin/music)
 * Admin endpoint - Check upload status
 * Requirements: 2.1, 2.4
 */
router.get(
  '/upload/status/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const status = uploadStatus.get(id);

    if (!status) {
      return res.status(404).json({
        ok: false,
        message: 'Upload status not found',
        code: 'NOT_FOUND',
      });
    }

    return res.json({
      ok: true,
      data: status,
    });
  })
);

/**
 * DELETE /api/music/upload/:id (when mounted at /api/admin/music)
 * Admin endpoint - Cancel ongoing upload
 * Requirements: 2.1
 * Note: This is a placeholder for future implementation
 * Actual cancellation would require streaming upload handling
 */
router.delete(
  '/upload/:id',
  asyncHandler(async (req, res) => {
    router.get(
      '/upload/progress/:filename',
      asyncHandler(async (req, res) => {
        const { filename } = req.params;
        const progressEntries = Array.from(uploadStatus.entries()).filter(([_, status]) =>
          status?.filename === filename
        );

        if (progressEntries.length === 0) {
          return res.status(404).json({
            ok: false,
            message: 'No upload progress found for filename',
            code: 'NOT_FOUND',
          });
        }

        return res.json({
          ok: true,
          data: progressEntries.map(([id, status]) => ({ id, ...status })),
        });
      })
    );
    const { id } = req.params;

    const status = uploadStatus.get(id);

    if (!status) {
      return res.status(404).json({
        ok: false,
        message: 'Upload not found',
        code: 'NOT_FOUND',
      });
    }

    // Mark as cancelled
    status.status = 'cancelled';
    status.cancelledAt = new Date().toISOString();
    uploadStatus.set(id, status);

    return res.json({
      ok: true,
      message: 'Upload cancelled',
      data: status,
    });
  })
);

export default router;
