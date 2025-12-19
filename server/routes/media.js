import express from 'express';
import multer from 'multer';
import mediaService from '../services/mediaService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: mediaService.maxVideoFileSize,
  },
  fileFilter: (req, file, cb) => {
    const supportedFormats = mediaService.getSupportedMimeTypes();
    if (supportedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(`Unsupported file format. Supported formats: ${supportedFormats.join(', ')}`),
        false
      );
    }
  },
});

/**
 * Upload media file
 * POST /api/admin/media/upload
 * Requirements: 2.3, 8.1, 8.2
 */
router.post(
  '/upload',
  upload.any(),
  asyncHandler(async (req, res) => {
    try {
      const files = Array.isArray(req.files)
        ? req.files
        : req.file
        ? [req.file]
        : [];

      if (!files.length) {
        return res.status(400).json({
          ok: false,
          message: 'No file provided',
        });
      }

      const userId = req.user?.username || 'admin';
      const uploaded = [];

      for (const file of files) {
        const mediaFile = await mediaService.uploadFile(file, { userId });
        uploaded.push(mediaFile);
      }

      return res.status(201).json({
        ok: true,
        message: `${uploaded.length} file(s) uploaded successfully`,
        data: uploaded.length === 1 ? uploaded[0] : uploaded,
      });
    } catch (error) {
      console.warn('[Media API] Upload service degraded:', error.message);

      return res.status(503).json({
        ok: false,
        message: 'Upload service temporarily unavailable',
        error: error.message,
      });
    }
  })
);

/**
 * Get media library
 * GET /api/admin/media
 * Requirements: 2.3, 8.1, 8.2
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const { mimeType, uploadedBy, type } = req.query;

      const filters = {};
      if (mimeType) filters.mimeType = mimeType;
      if (uploadedBy) filters.uploadedBy = uploadedBy;
      if (type) filters.type = type;

      const media = await mediaService.getMediaLibrary(filters);

      return res.json({
        ok: true,
        data: media,
      });
    } catch (error) {
      // Log as warning - service degradation
      console.warn('[Media API] Media library service degraded:', error.message);

      // Return empty array instead of failing
      return res.json({
        ok: true,
        data: [],
        warning: 'Service temporarily degraded',
      });
    }
  })
);

/**
 * Get single media file
 * GET /api/admin/media/:id
 * Requirements: 2.3
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const mediaFile = await mediaService.getMediaFile(id);

    return res.json({
      ok: true,
      data: mediaFile,
    });
  })
);

/**
 * Delete media file
 * DELETE /api/admin/media/:id
 * Requirements: 2.3, 8.1, 8.2
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      await mediaService.deleteMedia(id);

      return res.json({
        ok: true,
        message: 'Media file deleted successfully',
      });
    } catch (error) {
      // Log as warning - service degradation
      console.warn('[Media API] Delete service degraded:', error.message);

      // Return appropriate error
      if (error.message.includes('not found')) {
        return res.status(404).json({
          ok: false,
          message: error.message,
        });
      }

      return res.status(503).json({
        ok: false,
        message: 'Delete service temporarily unavailable',
      });
    }
  })
);

/**
 * Get file usage tracking
 * GET /api/admin/media/:id/usage
 * Requirements: 2.3
 */
router.get(
  '/:id/usage',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usage = await mediaService.getFileUsage(id);

    return res.json({
      ok: true,
      data: usage,
    });
  })
);

export default router;
