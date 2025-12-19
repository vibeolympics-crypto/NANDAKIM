import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MediaService - Handles file uploads, image optimization, and media management
 * Requirements: 2.3, 8.4
 */
class MediaService {
  constructor() {
    // Media storage directory
    this.mediaDir = path.join(__dirname, '../../public/media');
    this.thumbnailDir = path.join(this.mediaDir, 'thumbnails');

    // Thumbnail sizes (small, medium, large)
    this.thumbnailSizes = {
      small: 400,
      medium: 800,
      large: 1200,
    };

    // Supported formats
    this.supportedImageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    this.supportedVideoFormats = ['video/mp4', 'video/webm', 'video/quicktime'];
    this.supportedFormats = [...this.supportedImageFormats, ...this.supportedVideoFormats];

    // Max file sizes
    this.maxImageFileSize = 10 * 1024 * 1024; // 10MB
    this.maxVideoFileSize = 200 * 1024 * 1024; // 200MB

    // In-memory media library (in production, use database)
    this.mediaLibrary = [];

    // Initialize directories
    this.initializeDirectories();
  }

  getSupportedMimeTypes() {
    return [...this.supportedFormats];
  }

  isImageMimeType(mimeType) {
    return this.supportedImageFormats.includes(mimeType);
  }

  /**
   * Initialize media directories
   * Requirements: 8.1, 8.2, 8.3
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.mediaDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      // Log as warning - service degradation
      console.warn('[MediaService] Failed to initialize media directories:', error.message);
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName) {
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${basename}-${timestamp}-${random}${ext}`;
  }

  /**
   * Validate file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    const isImage = this.isImageMimeType(file.mimetype);
    const isVideo = this.supportedVideoFormats.includes(file.mimetype);

    if (!isImage && !isVideo) {
      throw new Error(
        `Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`
      );
    }

    const maxSize = isVideo ? this.maxVideoFileSize : this.maxImageFileSize;

    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    return { isImage, isVideo };
  }

  /**
   * Upload and process image
   * Requirements: 2.3, 8.1, 8.2, 8.3, 8.4
   */
  async uploadFile(file, options = {}) {
    try {
      const { isImage } = this.validateFile(file);

      const filename = this.generateFilename(file.originalname);
      const filePath = path.join(this.mediaDir, filename);

      await fs.writeFile(filePath, file.buffer);

      let webpData = null;
      let thumbnails = null;

      if (isImage) {
        webpData = await this.optimizeImage(filePath);
        thumbnails = await this.generateThumbnails(filePath);
      } else {
        thumbnails = await this.generateVideoPlaceholders(filename);
      }

      const mediaFile = {
        id: crypto.randomBytes(8).toString('hex'),
        type: isImage ? 'image' : 'video',
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/media/${filename}`,
        webpUrl: webpData?.webpUrl,
        thumbnails,
        uploadedAt: new Date().toISOString(),
        uploadedBy: options.userId || 'admin',
      };

      this.mediaLibrary.push(mediaFile);

      return mediaFile;
    } catch (error) {
      console.warn('[MediaService] Failed to upload media:', error.message);
      throw error;
    }
  }

  /**
   * Optimize image and generate WebP version
   * Requirements: 8.4
   */
  async optimizeImage(imagePath) {
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);

    // If already WebP, return the original file
    if (ext.toLowerCase() === '.webp') {
      const filename = path.basename(imagePath);
      return {
        webpUrl: `/media/${filename}`,
        webpPath: imagePath,
      };
    }

    const webpFilename = `${basename}.webp`;
    const webpPath = path.join(this.mediaDir, webpFilename);

    // Generate WebP version with optimization
    await sharp(imagePath).webp({ quality: 85 }).toFile(webpPath);

    return {
      webpUrl: `/media/${webpFilename}`,
      webpPath,
    };
  }

  /**
   * Generate thumbnails at multiple sizes
   * Requirements: 2.3, 8.4
   */
  async generateThumbnails(imagePath) {
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const thumbnails = {};

    await Promise.all(
      Object.entries(this.thumbnailSizes).map(async ([label, width]) => {
        const thumbnailFilename = `${basename}-${label}-${width}w.webp`;
        const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

        await sharp(imagePath)
          .resize(width, null, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);

        thumbnails[label] = `/media/thumbnails/${thumbnailFilename}`;
      })
    );

    return thumbnails;
  }

  async generateVideoPlaceholders(filename) {
    const basename = path.basename(filename, path.extname(filename));
    const thumbnails = {};

    await Promise.all(
      Object.entries(this.thumbnailSizes).map(async ([label, width]) => {
        const height = Math.round(width * 0.5625);
        const thumbnailFilename = `${basename}-${label}-placeholder.webp`;
        const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);
        const svg = this.createVideoPlaceholderSvg(width, height);

        await sharp(Buffer.from(svg))
          .webp({ quality: 80 })
          .toFile(thumbnailPath);

        thumbnails[label] = `/media/thumbnails/${thumbnailFilename}`;
      })
    );

    return thumbnails;
  }

  createVideoPlaceholderSvg(width, height) {
    const playSize = Math.round(Math.min(width, height) * 0.3);
    const circleRadius = Math.round(playSize * 0.9);
    const gradientId = `grad-${crypto.randomBytes(4).toString('hex')}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#${gradientId})" rx="32" />
        <circle cx="${width / 2}" cy="${height / 2}" r="${circleRadius}" fill="rgba(15,23,42,0.65)" />
        <polygon points="${width / 2 - playSize / 2},${height / 2 - playSize / 1.5} ${width / 2 + playSize / 1.2},${height / 2} ${width / 2 - playSize / 2},${height / 2 + playSize / 1.5}" fill="#f8fafc" />
      </svg>`;
  }

  /**
   * Get media library with optional filters
   * Requirements: 8.1, 8.2, 8.3
   */
  async getMediaLibrary(filters = {}) {
    try {
      let media = [...this.mediaLibrary];

      // Apply filters
      if (filters.mimeType) {
        media = media.filter((m) => m.mimeType === filters.mimeType);
      }

      if (filters.uploadedBy) {
        media = media.filter((m) => m.uploadedBy === filters.uploadedBy);
      }

      if (filters.type) {
        media = media.filter((m) => m.type === filters.type);
      }

      // Sort by upload date (newest first)
      media.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      return media;
    } catch (error) {
      // Log as warning - service degradation
      console.warn('[MediaService] Failed to get media library:', error.message);
      return [];
    }
  }

  /**
   * Get single media file by ID
   */
  async getMediaFile(id) {
    const mediaFile = this.mediaLibrary.find((m) => m.id === id);

    if (!mediaFile) {
      throw new Error(`Media file with ID ${id} not found`);
    }

    return mediaFile;
  }

  /**
   * Delete media file and all associated files
   * Requirements: 8.1, 8.2, 8.3, 8.4
   */
  async deleteMedia(id) {
    const mediaFile = this.mediaLibrary.find((m) => m.id === id);

    if (!mediaFile) {
      throw new Error(`Media file with ID ${id} not found`);
    }

    // Delete original file
    const originalPath = path.join(this.mediaDir, mediaFile.filename);
    try {
      await fs.unlink(originalPath);
    } catch (error) {
      // Log as warning - file may already be deleted
      console.warn('[MediaService] Failed to delete original file:', error.message);
    }

    // Delete WebP version
    if (mediaFile.webpUrl) {
      const webpFilename = path.basename(mediaFile.webpUrl);
      const webpPath = path.join(this.mediaDir, webpFilename);
      try {
        await fs.unlink(webpPath);
      } catch (error) {
        // Log as warning - file may already be deleted
        console.warn('[MediaService] Failed to delete WebP file:', error.message);
      }
    }

    // Delete thumbnails
    for (const thumbnailUrl of Object.values(mediaFile.thumbnails)) {
      const thumbnailFilename = path.basename(thumbnailUrl);
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);
      try {
        await fs.unlink(thumbnailPath);
      } catch (error) {
        // Log as warning - file may already be deleted
        console.warn('[MediaService] Failed to delete thumbnail:', error.message);
      }
    }

    // Remove from media library
    this.mediaLibrary = this.mediaLibrary.filter((m) => m.id !== id);

    return true;
  }

  /**
   * Get file usage tracking (placeholder for future implementation)
   */
  async getFileUsage(id) {
    // First check if the file exists
    const mediaFile = this.mediaLibrary.find((m) => m.id === id);

    if (!mediaFile) {
      throw new Error(`Media file with ID ${id} not found`);
    }

    // In production, this would query the database to find where the file is used
    // For now, return empty array
    return [];
  }
}

// Export singleton instance
export default new MediaService();
