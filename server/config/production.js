/**
 * Production Environment Configuration
 * 프로덕션 환경 설정
 */

export const productionConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: true, // Enable if behind reverse proxy (nginx, etc.)
  },

  // Security Configuration
  security: {
    // JWT Configuration
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: parseInt(process.env.TOKEN_EXPIRES) || 3600,
      refreshExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES) || 604800,
      algorithm: 'HS256',
    },

    // CSRF Configuration
    csrf: {
      secret: process.env.CSRF_SECRET,
      cookieName: '__Host-csrf-token',
      cookieOptions: {
        httpOnly: true,
        secure: true, // HTTPS only in production
        sameSite: 'strict',
        path: '/',
      },
    },

    // Session Configuration
    session: {
      timeout: 1800000, // 30 minutes in milliseconds
      warningTime: 300000, // 5 minutes warning before timeout
      maxConcurrentSessions: 3,
    },

    // Rate Limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    },

    // CORS Configuration
    cors: {
      origin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    },
  },

  // Database Configuration
  database: {
    type: process.env.DATABASE_TYPE || 'file', // 'postgres', 'mongodb', or 'file'

    // PostgreSQL Configuration
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DB || 'portfolio',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      poolMax: parseInt(process.env.POSTGRES_POOL_MAX) || 20,
      poolMin: parseInt(process.env.POSTGRES_POOL_MIN) || 5,
      ssl: true,
    },

    // MongoDB Configuration
    mongodb: {
      uri: process.env.MONGODB_URI,
      poolMax: parseInt(process.env.MONGODB_POOL_MAX) || 10,
      poolMin: parseInt(process.env.MONGODB_POOL_MIN) || 2,
      timeout: parseInt(process.env.MONGODB_TIMEOUT) || 5000,
      tls: process.env.MONGODB_TLS === 'true',
    },

    // File-based storage configuration
    fileStorage: {
      dataDir: process.env.DATA_DIR || './server/data',
      backupDir: process.env.BACKUP_DIR || './server/backups',
    },
  },

  // Redis Configuration (for caching and sessions)
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DB) || 0,
    tls: process.env.REDIS_TLS === 'true',

    // Cache TTL settings (in seconds)
    cacheTTL: {
      short: parseInt(process.env.CACHE_TTL_SHORT) || 300, // 5 minutes
      medium: parseInt(process.env.CACHE_TTL_MEDIUM) || 3600, // 1 hour
      long: parseInt(process.env.CACHE_TTL_LONG) || 86400, // 1 day
      week: parseInt(process.env.CACHE_TTL_WEEK) || 604800, // 7 days
    },
  },

  // Storage Configuration (S3 or local)
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // 'local' or 's3'

    // Local storage
    local: {
      uploadDir: process.env.UPLOAD_DIR || './public/media',
      tempDir: process.env.TEMP_DIR || './temp',
      publicPath: process.env.PUBLIC_MEDIA_PATH || '/media',
    },

    // AWS S3 storage
    s3: {
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET_NAME,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT, // For S3-compatible services
    },

    // CDN Configuration
    cdn: {
      enabled: process.env.CDN_ENABLED === 'true',
      url: process.env.CDN_URL,

      // CloudFlare
      cloudflare: {
        zoneId: process.env.CLOUDFLARE_ZONE_ID,
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
      },

      // AWS CloudFront
      cloudfront: {
        distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        domain: process.env.CLOUDFRONT_DOMAIN,
      },
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: {
      console: {
        enabled: true,
        colorize: false,
      },
      file: {
        enabled: true,
        filename: 'logs/app.log',
        maxSize: '20m',
        maxFiles: '14d',
      },
      errorFile: {
        enabled: true,
        filename: 'logs/error.log',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
      },
    },
  },

  // Media/File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm'],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    tempDir: process.env.TEMP_DIR || './temp',
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Portfolio Admin',
      address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER,
    },
  },

  // External Services
  services: {
    // Google Maps
    googleMaps: {
      apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY,
    },

    // Kakao Maps
    kakaoMaps: {
      apiKey: process.env.VITE_KAKAO_MAPS_API_KEY,
    },

    // Google Analytics
    analytics: {
      trackingId: process.env.GA_TRACKING_ID,
    },

    // Google AdSense
    adsense: {
      publisherId: process.env.ADSENSE_PUBLISHER_ID,
    },

    // Sentry (Error Tracking)
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1,
    },
  },

  // Performance Configuration
  performance: {
    compression: true,
    caching: {
      enabled: true,
      maxAge: 86400, // 1 day in seconds
    },
    staticAssets: {
      maxAge: 31536000, // 1 year in seconds
    },
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    destination: process.env.BACKUP_DESTINATION || './backups',

    // S3 backup configuration
    s3: {
      enabled: process.env.BACKUP_S3_ENABLED === 'true',
      bucket: process.env.BACKUP_S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1',
      prefix: process.env.BACKUP_S3_PREFIX || 'backups/',
    },

    // Backup notifications
    notifications: {
      enabled: process.env.BACKUP_NOTIFICATIONS_ENABLED === 'true',
      email: process.env.BACKUP_NOTIFICATION_EMAIL,
      slack: process.env.BACKUP_SLACK_WEBHOOK,
    },
  },

  // Monitoring Configuration
  monitoring: {
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 30000, // 30 seconds
    },
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      path: '/metrics',
    },
  },
};

/**
 * Validate production configuration
 * @throws {Error} if required configuration is missing
 */
export function validateProductionConfig() {
  const errors = [];

  // Required security settings
  if (
    !productionConfig.security.jwt.secret ||
    productionConfig.security.jwt.secret === 'your_jwt_secret_key_change_in_production'
  ) {
    errors.push('JWT_SECRET must be set to a secure random value in production');
  }

  if (
    !productionConfig.security.csrf.secret ||
    productionConfig.security.csrf.secret === 'your-csrf-secret-change-this-in-production'
  ) {
    errors.push('CSRF_SECRET must be set to a secure random value in production');
  }

  // Warn about CORS origin
  if (productionConfig.security.cors.origin === 'https://yourdomain.com') {
    console.warn('⚠️  CORS_ORIGIN is using default value. Set it to your actual domain.');
  }

  // Check HTTPS enforcement
  if (!productionConfig.security.csrf.cookieOptions.secure) {
    console.warn('⚠️  CSRF cookies should be secure in production (HTTPS only)');
  }

  if (errors.length > 0) {
    throw new Error(`Production configuration errors:\n${errors.join('\n')}`);
  }

  console.log('✅ Production configuration validated');
}

export default productionConfig;
