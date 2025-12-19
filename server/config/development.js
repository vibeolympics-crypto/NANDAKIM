/**
 * Development Environment Configuration
 * 개발 환경 설정
 */

export const developmentConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    trustProxy: false,
  },

  // Security Configuration (relaxed for development)
  security: {
    // JWT Configuration
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-jwt-secret-not-for-production',
      expiresIn: parseInt(process.env.TOKEN_EXPIRES) || 3600,
      refreshExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES) || 604800,
      algorithm: 'HS256',
    },

    // CSRF Configuration
    csrf: {
      secret: process.env.CSRF_SECRET || 'dev-csrf-secret-not-for-production',
      cookieName: 'csrf-token',
      cookieOptions: {
        httpOnly: true,
        secure: false, // Allow HTTP in development
        sameSite: 'lax',
        path: '/',
      },
    },

    // Session Configuration
    session: {
      timeout: 3600000, // 1 hour in development
      warningTime: 300000,
      maxConcurrentSessions: 5,
    },

    // Rate Limiting (more lenient in development)
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000, // Higher limit for development
      standardHeaders: true,
      legacyHeaders: false,
    },

    // CORS Configuration
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    },
  },

  // Database Configuration
  database: {
    // MongoDB Configuration
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-dev',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 5,
      },
    },

    // File-based storage
    fileStorage: {
      dataDir: './server/data',
      backupDir: './server/backups',
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: 'simple',
    transports: {
      console: {
        enabled: true,
        colorize: true,
      },
      file: {
        enabled: false, // Disable file logging in development
      },
      errorFile: {
        enabled: false,
      },
    },
  },

  // Media/File Upload Configuration
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB for development
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm'],
    uploadDir: './uploads',
    tempDir: './temp',
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 1025, // MailHog default port
      secure: false,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    },
    from: {
      name: 'Portfolio Dev',
      address: 'dev@localhost',
    },
  },

  // External Services
  services: {
    googleMaps: {
      apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || '',
    },
    kakaoMaps: {
      apiKey: process.env.VITE_KAKAO_MAPS_API_KEY || '',
    },
    analytics: {
      trackingId: process.env.GA_TRACKING_ID || '',
    },
    adsense: {
      publisherId: process.env.ADSENSE_PUBLISHER_ID || '',
    },
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      environment: 'development',
      tracesSampleRate: 1.0, // 100% in development
    },
  },

  // Performance Configuration
  performance: {
    compression: false, // Disable compression in development
    caching: {
      enabled: false, // Disable caching for easier development
      maxAge: 0,
    },
    staticAssets: {
      maxAge: 0,
    },
  },

  // Backup Configuration
  backup: {
    enabled: false, // Disable automatic backups in development
    schedule: '0 2 * * *',
    retention: 7,
    destination: './backups',
  },

  // Monitoring Configuration
  monitoring: {
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 60000, // 1 minute
    },
    metrics: {
      enabled: false,
      path: '/metrics',
    },
  },

  // Development-specific features
  development: {
    hotReload: true,
    verboseErrors: true,
    mockExternalServices: false,
  },
};

export default developmentConfig;
