/**
 * Storage Configuration
 * Supports local filesystem and AWS S3
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Storage type configuration
 */
export const storageType = process.env.STORAGE_TYPE || 'local'; // 'local' or 's3'

/**
 * Local storage configuration
 */
export const localStorageConfig = {
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../public/media'),
  tempDir: process.env.TEMP_DIR || path.join(__dirname, '../../temp'),
  publicPath: process.env.PUBLIC_MEDIA_PATH || '/media',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
};

/**
 * AWS S3 configuration
 */
export const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  bucket: process.env.S3_BUCKET_NAME,

  // Optional: Custom endpoint for S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  }),
};

/**
 * CDN configuration
 */
export const cdnConfig = {
  enabled: process.env.CDN_ENABLED === 'true',
  url: process.env.CDN_URL,

  // CloudFlare configuration
  cloudflare: {
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    purgeUrl: process.env.CLOUDFLARE_PURGE_URL || 'https://api.cloudflare.com/client/v4/zones',
  },

  // AWS CloudFront configuration
  cloudfront: {
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    domain: process.env.CLOUDFRONT_DOMAIN,
  },
};

let s3Client = null;

/**
 * Create S3 client
 */
export function createS3Client() {
  if (s3Client) {
    return s3Client;
  }

  if (!s3Config.credentials.accessKeyId || !s3Config.credentials.secretAccessKey) {
    console.warn('⚠️  AWS credentials not configured, S3 storage unavailable');
    return null;
  }

  if (!s3Config.bucket) {
    console.warn('⚠️  S3 bucket not configured, S3 storage unavailable');
    return null;
  }

  try {
    s3Client = new S3Client({
      region: s3Config.region,
      credentials: s3Config.credentials,
      ...(s3Config.endpoint && {
        endpoint: s3Config.endpoint,
        forcePathStyle: s3Config.forcePathStyle,
      }),
    });

    console.log('✅ S3 client initialized');
    console.log(`   Region: ${s3Config.region}`);
    console.log(`   Bucket: ${s3Config.bucket}`);

    return s3Client;
  } catch (error) {
    console.error('❌ Failed to create S3 client:', error.message);
    return null;
  }
}

/**
 * Get S3 client (singleton)
 */
export function getS3Client() {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

/**
 * Storage adapter interface
 */
export const storage = {
  /**
   * Upload file
   */
  async upload(file, key, options = {}) {
    if (storageType === 's3') {
      return await uploadToS3(file, key, options);
    } else {
      return await uploadToLocal(file, key, options);
    }
  },

  /**
   * Get file URL
   */
  async getUrl(key, options = {}) {
    if (storageType === 's3') {
      return await getS3Url(key, options);
    } else {
      return getLocalUrl(key);
    }
  },

  /**
   * Delete file
   */
  async delete(key) {
    if (storageType === 's3') {
      return await deleteFromS3(key);
    } else {
      return await deleteFromLocal(key);
    }
  },

  /**
   * List files
   */
  async list(prefix = '', options = {}) {
    if (storageType === 's3') {
      return await listS3Objects(prefix, options);
    } else {
      return await listLocalFiles(prefix, options);
    }
  },

  /**
   * Check if file exists
   */
  async exists(key) {
    if (storageType === 's3') {
      return await s3FileExists(key);
    } else {
      return await localFileExists(key);
    }
  },
};

/**
 * Upload file to S3
 */
async function uploadToS3(file, key, options = {}) {
  const client = getS3Client();
  if (!client) {
    throw new Error('S3 client not available');
  }

  try {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: file.buffer || fs.createReadStream(file.path),
      ContentType: options.contentType || file.mimetype,
      CacheControl: options.cacheControl || 'public, max-age=31536000',
      Metadata: options.metadata || {},
    });

    await client.send(command);

    const url =
      cdnConfig.enabled && cdnConfig.url
        ? `${cdnConfig.url}/${key}`
        : `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;

    return {
      key,
      url,
      size: file.size,
      contentType: options.contentType || file.mimetype,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

/**
 * Get S3 file URL
 */
async function getS3Url(key, options = {}) {
  const client = getS3Client();
  if (!client) {
    throw new Error('S3 client not available');
  }

  // If CDN is enabled, return CDN URL
  if (cdnConfig.enabled && cdnConfig.url) {
    return `${cdnConfig.url}/${key}`;
  }

  // If signed URL is requested
  if (options.signed) {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    const expiresIn = options.expiresIn || 3600; // 1 hour default
    return await getSignedUrl(client, command, { expiresIn });
  }

  // Return public URL
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
}

/**
 * Delete file from S3
 */
async function deleteFromS3(key) {
  const client = getS3Client();
  if (!client) {
    throw new Error('S3 client not available');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
}

/**
 * List S3 objects
 */
async function listS3Objects(prefix = '', options = {}) {
  const client = getS3Client();
  if (!client) {
    throw new Error('S3 client not available');
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucket,
      Prefix: prefix,
      MaxKeys: options.maxKeys || 1000,
      ContinuationToken: options.continuationToken,
    });

    const response = await client.send(command);

    return {
      files: response.Contents || [],
      nextToken: response.NextContinuationToken,
      isTruncated: response.IsTruncated,
    };
  } catch (error) {
    console.error('S3 list error:', error);
    throw new Error(`Failed to list S3 objects: ${error.message}`);
  }
}

/**
 * Check if S3 file exists
 */
async function s3FileExists(key) {
  const client = getS3Client();
  if (!client) {
    return false;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
}

/**
 * Upload file to local storage
 */
async function uploadToLocal(file, key, options = {}) {
  const uploadPath = path.join(localStorageConfig.uploadDir, key);
  const uploadDir = path.dirname(uploadPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Copy file
  if (file.buffer) {
    fs.writeFileSync(uploadPath, file.buffer);
  } else if (file.path) {
    fs.copyFileSync(file.path, uploadPath);
  } else {
    throw new Error('Invalid file object');
  }

  const url = `${localStorageConfig.publicPath}/${key}`;

  return {
    key,
    url,
    size: file.size,
    contentType: options.contentType || file.mimetype,
  };
}

/**
 * Get local file URL
 */
function getLocalUrl(key) {
  return `${localStorageConfig.publicPath}/${key}`;
}

/**
 * Delete file from local storage
 */
async function deleteFromLocal(key) {
  const filePath = path.join(localStorageConfig.uploadDir, key);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
}

/**
 * List local files
 */
async function listLocalFiles(prefix = '', options = {}) {
  const searchDir = path.join(localStorageConfig.uploadDir, prefix);

  if (!fs.existsSync(searchDir)) {
    return { files: [], nextToken: null, isTruncated: false };
  }

  const files = [];

  function scanDirectory(dir, basePrefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePrefix, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else {
        const stats = fs.statSync(fullPath);
        files.push({
          Key: relativePath,
          Size: stats.size,
          LastModified: stats.mtime,
        });
      }
    }
  }

  scanDirectory(searchDir);

  return {
    files,
    nextToken: null,
    isTruncated: false,
  };
}

/**
 * Check if local file exists
 */
async function localFileExists(key) {
  const filePath = path.join(localStorageConfig.uploadDir, key);
  return fs.existsSync(filePath);
}

/**
 * Purge CDN cache
 */
export async function purgeCDNCache(paths = []) {
  if (!cdnConfig.enabled) {
    console.log('⚠️  CDN not enabled, skipping cache purge');
    return false;
  }

  // CloudFlare purge
  if (cdnConfig.cloudflare.zoneId && cdnConfig.cloudflare.apiToken) {
    return await purgeCloudflareCache(paths);
  }

  // CloudFront purge
  if (cdnConfig.cloudfront.distributionId) {
    return await purgeCloudFrontCache(paths);
  }

  console.warn('⚠️  No CDN configuration found');
  return false;
}

/**
 * Purge CloudFlare cache
 */
async function purgeCloudflareCache(paths = []) {
  try {
    const url = `${cdnConfig.cloudflare.purgeUrl}/${cdnConfig.cloudflare.zoneId}/purge_cache`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cdnConfig.cloudflare.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: paths.length > 0 ? paths : undefined,
        purge_everything: paths.length === 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`CloudFlare API error: ${response.statusText}`);
    }

    console.log('✅ CloudFlare cache purged');
    return true;
  } catch (error) {
    console.error('❌ CloudFlare cache purge failed:', error.message);
    return false;
  }
}

/**
 * Purge CloudFront cache
 */
async function purgeCloudFrontCache(paths = []) {
  // TODO: Implement CloudFront cache invalidation
  console.log('⚠️  CloudFront cache purge not yet implemented');
  return false;
}

export default {
  storageType,
  localStorageConfig,
  s3Config,
  cdnConfig,
  createS3Client,
  getS3Client,
  storage,
  purgeCDNCache,
};
