/**
 * Database Configuration
 * Supports PostgreSQL, MongoDB, and file-based storage
 */

import pg from 'pg';
import { MongoClient } from 'mongodb';

const { Pool } = pg;

/**
 * PostgreSQL Configuration
 */
export const postgresConfig = {
  // Connection settings
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB || 'portfolio',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,

  // Pool settings
  max: parseInt(process.env.POSTGRES_POOL_MAX) || 20,
  min: parseInt(process.env.POSTGRES_POOL_MIN) || 5,
  idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT) || 2000,

  // SSL settings (required for production)
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false',
          ca: process.env.POSTGRES_SSL_CA,
          cert: process.env.POSTGRES_SSL_CERT,
          key: process.env.POSTGRES_SSL_KEY,
        }
      : false,
};

/**
 * MongoDB Configuration
 */
export const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio',
  options: {
    maxPoolSize: parseInt(process.env.MONGODB_POOL_MAX) || 10,
    minPoolSize: parseInt(process.env.MONGODB_POOL_MIN) || 2,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT) || 5000,
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,

    // Retry settings
    retryWrites: true,
    retryReads: true,

    // Compression
    compressors: ['snappy', 'zlib'],

    // SSL/TLS
    tls: process.env.MONGODB_TLS === 'true',
    tlsCAFile: process.env.MONGODB_TLS_CA_FILE,
    tlsCertificateKeyFile: process.env.MONGODB_TLS_CERT_KEY_FILE,
  },
};

/**
 * Create PostgreSQL connection pool
 */
export function createPostgresPool() {
  const pool = new Pool(postgresConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection failed:', err.message);
    } else {
      console.log('✅ PostgreSQL connected successfully');
    }
  });

  return pool;
}

/**
 * Create MongoDB client
 */
export async function createMongoClient() {
  try {
    const client = new MongoClient(mongoConfig.uri, mongoConfig.options);
    await client.connect();

    // Test connection
    await client.db().admin().ping();
    console.log('✅ MongoDB connected successfully');

    return client;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Get database client based on configuration
 */
export async function getDatabaseClient() {
  const dbType = process.env.DATABASE_TYPE || 'file';

  switch (dbType) {
    case 'postgres':
    case 'postgresql':
      return createPostgresPool();

    case 'mongo':
    case 'mongodb':
      return await createMongoClient();

    case 'file':
    default:
      console.log('📁 Using file-based storage');
      return null;
  }
}

/**
 * Close database connections gracefully
 */
export async function closeDatabaseConnections(client) {
  if (!client) return;

  try {
    if (client.end) {
      // PostgreSQL pool
      await client.end();
      console.log('✅ PostgreSQL pool closed');
    } else if (client.close) {
      // MongoDB client
      await client.close();
      console.log('✅ MongoDB client closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
}

export default {
  postgresConfig,
  mongoConfig,
  createPostgresPool,
  createMongoClient,
  getDatabaseClient,
  closeDatabaseConnections,
};
