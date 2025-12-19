import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Serve media files (public access)
 * GET /api/media/:filename
 * Requirements: 2.3
 */
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const mediaDir = path.join(__dirname, '../../public/media');
  const filePath = path.join(mediaDir, filename);

  // Security: Prevent directory traversal
  if (!filePath.startsWith(mediaDir)) {
    return res.status(403).json({
      ok: false,
      message: 'Access denied',
    });
  }

  // Send file
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({
        ok: false,
        message: 'File not found',
      });
    }
  });
});

/**
 * Serve thumbnail files (public access)
 * GET /api/media/thumbnails/:filename
 * Requirements: 2.3
 */
router.get('/thumbnails/:filename', (req, res) => {
  const { filename } = req.params;
  const thumbnailDir = path.join(__dirname, '../../public/media/thumbnails');
  const filePath = path.join(thumbnailDir, filename);

  // Security: Prevent directory traversal
  if (!filePath.startsWith(thumbnailDir)) {
    return res.status(403).json({
      ok: false,
      message: 'Access denied',
    });
  }

  // Send file
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({
        ok: false,
        message: 'File not found',
      });
    }
  });
});

export default router;
