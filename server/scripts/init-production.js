/**
 * Production Environment Initialization Script
 * Helps set up and validate production configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Generate secure random string
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash password with bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*)';
  }
  return null;
}

/**
 * Check if service is available
 */
async function checkService(name, testFn) {
  try {
    await testFn();
    console.log(`✅ ${name} is available`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} is not available: ${error.message}`);
    return false;
  }
}

/**
 * Test PostgreSQL connection
 */
async function testPostgres(config) {
  const { Client } = await import('pg');
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  await client.connect();
  await client.query('SELECT 1');
  await client.end();
}

/**
 * Test Redis connection
 */
async function testRedis(config) {
  const { createClient } = await import('redis');
  const client = createClient({
    socket: {
      host: config.host,
      port: config.port,
    },
    password: config.password,
  });

  await client.connect();
  await client.ping();
  await client.quit();
}

/**
 * Test S3 connection
 */
async function testS3(config) {
  const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await client.send(new ListBucketsCommand({}));
}

/**
 * Interactive setup wizard
 */
async function setupWizard() {
  console.log('\n🚀 Production Environment Setup Wizard\n');
  console.log('This wizard will help you configure your production environment.\n');

  const config = {};

  // Basic configuration
  console.log('=== Basic Configuration ===\n');

  config.domain = await question('Enter your domain (e.g., yourdomain.com): ');
  config.port = (await question('Enter server port [3001]: ')) || '3001';

  // Security
  console.log('\n=== Security Configuration ===\n');

  console.log('Generating JWT secret...');
  config.jwtSecret = generateSecret(32);
  console.log(`✅ JWT_SECRET: ${config.jwtSecret}\n`);

  console.log('Generating CSRF secret...');
  config.csrfSecret = generateSecret(32);
  console.log(`✅ CSRF_SECRET: ${config.csrfSecret}\n`);

  config.adminUsername = (await question('Enter admin username [admin]: ')) || 'admin';

  let adminPassword;
  let passwordValid = false;
  while (!passwordValid) {
    adminPassword = await question(
      'Enter admin password (min 8 chars, uppercase, lowercase, number, special): '
    );
    const error = validatePassword(adminPassword);
    if (error) {
      console.log(`❌ ${error}`);
    } else {
      passwordValid = true;
    }
  }

  console.log('Hashing password...');
  config.adminPasswordHash = await hashPassword(adminPassword);
  console.log('✅ Password hashed\n');

  // Database
  console.log('=== Database Configuration ===\n');
  console.log('Choose database type:');
  console.log('1. PostgreSQL (recommended)');
  console.log('2. MongoDB');
  console.log('3. File-based (development only)');

  const dbChoice = (await question('Enter choice [1]: ')) || '1';

  if (dbChoice === '1') {
    config.databaseType = 'postgres';
    config.postgresHost = (await question('PostgreSQL host [localhost]: ')) || 'localhost';
    config.postgresPort = (await question('PostgreSQL port [5432]: ')) || '5432';
    config.postgresDb = (await question('PostgreSQL database [portfolio]: ')) || 'portfolio';
    config.postgresUser = await question('PostgreSQL user: ');
    config.postgresPassword = await question('PostgreSQL password: ');

    console.log('\nTesting PostgreSQL connection...');
    await checkService('PostgreSQL', () =>
      testPostgres({
        host: config.postgresHost,
        port: config.postgresPort,
        database: config.postgresDb,
        user: config.postgresUser,
        password: config.postgresPassword,
      })
    );
  } else if (dbChoice === '2') {
    config.databaseType = 'mongodb';
    config.mongodbUri = await question('MongoDB URI: ');
  } else {
    config.databaseType = 'file';
  }

  // Redis
  console.log('\n=== Redis Configuration ===\n');
  const useRedis = (await question('Enable Redis for caching? (y/n) [y]: ')) || 'y';

  if (useRedis.toLowerCase() === 'y') {
    config.redisEnabled = 'true';
    config.redisHost = (await question('Redis host [localhost]: ')) || 'localhost';
    config.redisPort = (await question('Redis port [6379]: ')) || '6379';
    config.redisPassword = await question('Redis password (leave empty if none): ');

    console.log('\nTesting Redis connection...');
    await checkService('Redis', () =>
      testRedis({
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword || undefined,
      })
    );
  } else {
    config.redisEnabled = 'false';
  }

  // Storage
  console.log('\n=== Storage Configuration ===\n');
  console.log('Choose storage type:');
  console.log('1. AWS S3 (recommended)');
  console.log('2. Local filesystem');

  const storageChoice = (await question('Enter choice [1]: ')) || '1';

  if (storageChoice === '1') {
    config.storageType = 's3';
    config.s3Bucket = await question('S3 bucket name: ');
    config.awsRegion = (await question('AWS region [us-east-1]: ')) || 'us-east-1';
    config.awsAccessKeyId = await question('AWS access key ID: ');
    config.awsSecretAccessKey = await question('AWS secret access key: ');

    console.log('\nTesting S3 connection...');
    await checkService('AWS S3', () =>
      testS3({
        region: config.awsRegion,
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      })
    );
  } else {
    config.storageType = 'local';
  }

  // Backups
  console.log('\n=== Backup Configuration ===\n');
  const enableBackups = (await question('Enable automated backups? (y/n) [y]: ')) || 'y';

  if (enableBackups.toLowerCase() === 'y') {
    config.backupEnabled = 'true';
    config.backupSchedule =
      (await question('Backup schedule (cron format) [0 2 * * *]: ')) || '0 2 * * *';
    config.backupRetention = (await question('Backup retention days [30]: ')) || '30';

    if (config.storageType === 's3') {
      const s3Backup = (await question('Store backups in S3? (y/n) [y]: ')) || 'y';
      if (s3Backup.toLowerCase() === 'y') {
        config.backupS3Enabled = 'true';
        config.backupS3Bucket = await question('Backup S3 bucket name: ');
      }
    }
  } else {
    config.backupEnabled = 'false';
  }

  // Generate .env.production file
  console.log('\n=== Generating Configuration File ===\n');

  const envContent = generateEnvFile(config);
  const envPath = path.join(__dirname, '../../.env.production');

  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env.production already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n❌ Setup cancelled');
      rl.close();
      return;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Configuration saved to ${envPath}\n`);

  // Summary
  console.log('=== Setup Complete ===\n');
  console.log('Configuration summary:');
  console.log(`  Domain: ${config.domain}`);
  console.log(`  Database: ${config.databaseType}`);
  console.log(`  Redis: ${config.redisEnabled === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`  Storage: ${config.storageType}`);
  console.log(`  Backups: ${config.backupEnabled === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log('\nNext steps:');
  console.log('  1. Review .env.production file');
  console.log('  2. Run database migrations: npm run migrate');
  console.log('  3. Build frontend: npm run build');
  console.log('  4. Start server: pm2 start server/index.js --name portfolio');
  console.log('  5. Test deployment: curl http://localhost:3001/health\n');

  rl.close();
}

/**
 * Generate .env.production file content
 */
function generateEnvFile(config) {
  return `# Production Environment Configuration
# Generated by init-production.js on ${new Date().toISOString()}

# ============================================================================
# NODE ENVIRONMENT
# ============================================================================
NODE_ENV=production

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================
PORT=${config.port}
HOST=0.0.0.0
CORS_ORIGIN=https://${config.domain}

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================
JWT_SECRET=${config.jwtSecret}
CSRF_SECRET=${config.csrfSecret}
TOKEN_EXPIRES=3600
REFRESH_TOKEN_EXPIRES=604800

# Admin Credentials
ADMIN_USERNAME=${config.adminUsername}
ADMIN_PASSWORD_HASH=${config.adminPasswordHash}

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DATABASE_TYPE=${config.databaseType}

${
  config.databaseType === 'postgres'
    ? `# PostgreSQL Configuration
POSTGRES_HOST=${config.postgresHost}
POSTGRES_PORT=${config.postgresPort}
POSTGRES_DB=${config.postgresDb}
POSTGRES_USER=${config.postgresUser}
POSTGRES_PASSWORD=${config.postgresPassword}
POSTGRES_POOL_MAX=20
POSTGRES_POOL_MIN=5`
    : ''
}

${
  config.databaseType === 'mongodb'
    ? `# MongoDB Configuration
MONGODB_URI=${config.mongodbUri}
MONGODB_POOL_MAX=10
MONGODB_POOL_MIN=2`
    : ''
}

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_ENABLED=${config.redisEnabled}
${
  config.redisEnabled === 'true'
    ? `REDIS_HOST=${config.redisHost}
REDIS_PORT=${config.redisPort}
${config.redisPassword ? `REDIS_PASSWORD=${config.redisPassword}` : '# REDIS_PASSWORD='}
REDIS_DB=0

# Cache TTL Settings
CACHE_TTL_SHORT=300
CACHE_TTL_MEDIUM=3600
CACHE_TTL_LONG=86400
CACHE_TTL_WEEK=604800`
    : ''
}

# ============================================================================
# STORAGE CONFIGURATION
# ============================================================================
STORAGE_TYPE=${config.storageType}

${
  config.storageType === 's3'
    ? `# AWS S3 Storage
S3_BUCKET_NAME=${config.s3Bucket}
AWS_REGION=${config.awsRegion}
AWS_ACCESS_KEY_ID=${config.awsAccessKeyId}
AWS_SECRET_ACCESS_KEY=${config.awsSecretAccessKey}`
    : ''
}

${
  config.storageType === 'local'
    ? `# Local Storage
UPLOAD_DIR=./public/media
TEMP_DIR=./temp
PUBLIC_MEDIA_PATH=/media`
    : ''
}

# ============================================================================
# CDN CONFIGURATION
# ============================================================================
CDN_ENABLED=false
# CDN_URL=https://${config.domain}
# CLOUDFLARE_ZONE_ID=
# CLOUDFLARE_API_TOKEN=

# ============================================================================
# BACKUP CONFIGURATION
# ============================================================================
BACKUP_ENABLED=${config.backupEnabled}
${
  config.backupEnabled === 'true'
    ? `BACKUP_SCHEDULE=${config.backupSchedule}
BACKUP_RETENTION_DAYS=${config.backupRetention}
BACKUP_DESTINATION=./backups

${
  config.backupS3Enabled === 'true'
    ? `# S3 Backup
BACKUP_S3_ENABLED=true
BACKUP_S3_BUCKET=${config.backupS3Bucket}
BACKUP_S3_PREFIX=backups/`
    : ''
}

# Backup Notifications
BACKUP_NOTIFICATIONS_ENABLED=false
# BACKUP_NOTIFICATION_EMAIL=admin@${config.domain}
# BACKUP_SLACK_WEBHOOK=`
    : ''
}

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# EMAIL_FROM_NAME=Portfolio Admin
# EMAIL_FROM_ADDRESS=noreply@${config.domain}

# ============================================================================
# EXTERNAL SERVICES
# ============================================================================
# VITE_GOOGLE_MAPS_API_KEY=
# GA_TRACKING_ID=
# SENTRY_DSN=

# ============================================================================
# LOGGING & MONITORING
# ============================================================================
LOG_LEVEL=info
METRICS_ENABLED=true
`;
}

/**
 * Validate existing configuration
 */
async function validateConfig() {
  console.log('\n🔍 Validating Production Configuration\n');

  const envPath = path.join(__dirname, '../../.env.production');

  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.production file not found');
    console.log('   Run: node server/scripts/init-production.js setup\n');
    return;
  }

  // Load environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  let errors = 0;
  let warnings = 0;

  // Check required variables
  const required = [
    'NODE_ENV',
    'JWT_SECRET',
    'CSRF_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD_HASH',
  ];

  for (const key of required) {
    if (!env[key]) {
      console.log(`❌ Missing required variable: ${key}`);
      errors++;
    }
  }

  // Check security
  if (env.JWT_SECRET && env.JWT_SECRET.includes('change_this')) {
    console.log('❌ JWT_SECRET must be changed from default value');
    errors++;
  }

  if (env.CSRF_SECRET && env.CSRF_SECRET.includes('change_this')) {
    console.log('❌ CSRF_SECRET must be changed from default value');
    errors++;
  }

  if (env.ADMIN_PASSWORD_HASH && !env.ADMIN_PASSWORD_HASH.startsWith('$2b$')) {
    console.log('⚠️  ADMIN_PASSWORD_HASH should be a bcrypt hash');
    warnings++;
  }

  // Check database
  if (env.DATABASE_TYPE === 'postgres') {
    if (!env.POSTGRES_HOST || !env.POSTGRES_USER || !env.POSTGRES_PASSWORD) {
      console.log('❌ PostgreSQL configuration incomplete');
      errors++;
    }
  }

  // Check Redis
  if (env.REDIS_ENABLED === 'true') {
    if (!env.REDIS_HOST) {
      console.log('⚠️  Redis enabled but REDIS_HOST not set');
      warnings++;
    }
  }

  // Check storage
  if (env.STORAGE_TYPE === 's3') {
    if (!env.S3_BUCKET_NAME || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      console.log('❌ S3 storage configuration incomplete');
      errors++;
    }
  }

  // Summary
  console.log('\n=== Validation Summary ===\n');
  if (errors === 0 && warnings === 0) {
    console.log('✅ Configuration is valid\n');
  } else {
    console.log(`❌ Found ${errors} error(s) and ${warnings} warning(s)\n`);
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'setup':
        await setupWizard();
        break;

      case 'validate':
        await validateConfig();
        break;

      case 'generate-secrets':
        console.log('\n🔐 Generating Secrets\n');
        console.log(`JWT_SECRET=${generateSecret(32)}`);
        console.log(`CSRF_SECRET=${generateSecret(32)}`);
        console.log('\nTo hash a password:');
        console.log("node -e \"console.log(require('bcrypt').hashSync('your_password', 10))\"\n");
        break;

      default:
        console.log('Production Environment Initialization\n');
        console.log('Usage:');
        console.log('  node init-production.js setup            - Interactive setup wizard');
        console.log('  node init-production.js validate         - Validate existing configuration');
        console.log('  node init-production.js generate-secrets - Generate JWT and CSRF secrets');
        console.log('\nExamples:');
        console.log('  node init-production.js setup     - Start interactive setup');
        console.log('  node init-production.js validate  - Check .env.production');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { setupWizard, validateConfig, generateSecret, hashPassword };
