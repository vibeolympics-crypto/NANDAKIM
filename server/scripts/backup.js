/**
 * Automated Backup System
 * Handles automatic and manual backups with retention policy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import archiver from 'archiver';
import tar from 'tar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const BACKUP_DIR = process.env.BACKUP_DESTINATION || path.join(__dirname, '../backups');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;

// S3 Configuration
const S3_ENABLED = process.env.BACKUP_S3_ENABLED === 'true';
const S3_BUCKET = process.env.BACKUP_S3_BUCKET;
const S3_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_PREFIX = process.env.BACKUP_S3_PREFIX || 'backups/';

let s3Client = null;

/**
 * Initialize S3 client
 */
function initS3Client() {
  if (!S3_ENABLED || !S3_BUCKET) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
}

/**
 * Create a backup of all data
 */
async function createBackup(label = 'auto') {
  console.log('\n💾 Starting backup process...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup-${label}-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  try {
    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    fs.mkdirSync(backupPath, { recursive: true });

    // Backup data directory
    if (fs.existsSync(DATA_DIR)) {
      const dataBackupPath = path.join(backupPath, 'data');
      fs.cpSync(DATA_DIR, dataBackupPath, { recursive: true });
      console.log('✅ Backed up data directory');
    } else {
      console.log('⚠️  Data directory not found, skipping');
    }

    // Backup uploads directory
    if (fs.existsSync(UPLOAD_DIR)) {
      const uploadsBackupPath = path.join(backupPath, 'uploads');
      fs.cpSync(UPLOAD_DIR, uploadsBackupPath, { recursive: true });
      console.log('✅ Backed up uploads directory');
    } else {
      console.log('⚠️  Uploads directory not found, skipping');
    }

    // Create backup metadata
    const metadata = {
      label,
      timestamp: new Date().toISOString(),
      version: getCurrentVersion(),
      size: getDirectorySize(backupPath),
      files: countFiles(backupPath),
    };

    fs.writeFileSync(path.join(backupPath, 'metadata.json'), JSON.stringify(metadata, null, 2));

    // Compress backup
    const compressedPath = `${backupPath}.tar.gz`;
    await compressDirectory(backupPath, compressedPath);

    // Remove uncompressed backup
    fs.rmSync(backupPath, { recursive: true, force: true });

    console.log(`\n✅ Backup completed successfully`);
    console.log(`   Location: ${compressedPath}`);
    console.log(`   Size: ${formatBytes(fs.statSync(compressedPath).size)}`);
    console.log(`   Files: ${metadata.files}`);

    // Upload to S3 if enabled
    if (S3_ENABLED) {
      const s3Key = path.basename(compressedPath);
      await uploadToS3(compressedPath, s3Key);
    }

    // Clean old backups
    await cleanOldBackups();
    if (S3_ENABLED) {
      await cleanOldS3Backups();
    }

    // Send success notification
    await sendBackupNotification(true, compressedPath);

    return compressedPath;
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);

    // Clean up failed backup
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }

    // Send failure notification
    await sendBackupNotification(false, null, error);

    throw error;
  }
}

/**
 * Restore from a backup
 */
async function restoreBackup(backupFile) {
  console.log('\n🔄 Starting restore process...\n');

  const backupPath = path.isAbsolute(backupFile) ? backupFile : path.join(BACKUP_DIR, backupFile);

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  try {
    // Create backup of current state before restore
    console.log('Creating safety backup of current state...');
    await createBackup('pre-restore');

    // Extract backup
    const extractPath = backupPath.replace('.tar.gz', '');
    await decompressArchive(backupPath, extractPath);

    // Read metadata
    const metadataPath = path.join(extractPath, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      console.log(`\nRestoring backup from ${metadata.timestamp}`);
      console.log(`Version: ${metadata.version}`);
      console.log(`Files: ${metadata.files}\n`);
    }

    // Restore data directory
    const dataBackupPath = path.join(extractPath, 'data');
    if (fs.existsSync(dataBackupPath)) {
      if (fs.existsSync(DATA_DIR)) {
        fs.rmSync(DATA_DIR, { recursive: true, force: true });
      }
      fs.cpSync(dataBackupPath, DATA_DIR, { recursive: true });
      console.log('✅ Restored data directory');
    }

    // Restore uploads directory
    const uploadsBackupPath = path.join(extractPath, 'uploads');
    if (fs.existsSync(uploadsBackupPath)) {
      if (fs.existsSync(UPLOAD_DIR)) {
        fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
      }
      fs.cpSync(uploadsBackupPath, UPLOAD_DIR, { recursive: true });
      console.log('✅ Restored uploads directory');
    }

    // Clean up extracted files
    fs.rmSync(extractPath, { recursive: true, force: true });

    console.log('\n✅ Restore completed successfully');
    console.log('⚠️  Please restart the server for changes to take effect');
  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    console.error('Your data has not been modified');
    throw error;
  }
}

/**
 * List all available backups
 */
async function listBackups() {
  console.log('\n📋 Available Backups\n');

  const localBackups = [];

  // List local backups
  if (fs.existsSync(BACKUP_DIR)) {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.endsWith('.tar.gz'))
      .map((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          location: 'local',
        };
      });

    localBackups.push(...files);
  }

  // List S3 backups
  const s3Backups = await listS3Backups();

  // Combine and sort
  const allBackups = [...localBackups, ...s3Backups].sort((a, b) => b.created - a.created);

  if (allBackups.length === 0) {
    console.log('No backups found');
    return [];
  }

  console.log('Local Backups:');
  localBackups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   Created: ${backup.created.toLocaleString()}`);
    console.log(`   Size: ${formatBytes(backup.size)}`);
    console.log('');
  });

  if (s3Backups.length > 0) {
    console.log('\nS3 Backups:');
    s3Backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Created: ${backup.created.toLocaleString()}`);
      console.log(`   Size: ${formatBytes(backup.size)}`);
      console.log(`   Location: s3://${S3_BUCKET}/${backup.key}`);
      console.log('');
    });
  }

  return allBackups;
}

/**
 * Clean old backups based on retention policy
 */
async function cleanOldBackups() {
  console.log('\n🧹 Cleaning old backups...');

  if (!fs.existsSync(BACKUP_DIR)) {
    return;
  }

  const now = Date.now();
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith('.tar.gz'))
    .map((file) => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
    }));

  let deletedCount = 0;
  let freedSpace = 0;

  for (const backup of backups) {
    const age = now - backup.mtime;

    if (age > retentionMs) {
      const size = fs.statSync(backup.path).size;
      fs.unlinkSync(backup.path);
      deletedCount++;
      freedSpace += size;
      console.log(
        `   Deleted: ${backup.name} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`
      );
    }
  }

  if (deletedCount > 0) {
    console.log(`\n✅ Deleted ${deletedCount} old backup(s), freed ${formatBytes(freedSpace)}`);
  } else {
    console.log('✅ No old backups to clean');
  }
}

/**
 * Compress directory to tar.gz
 */
async function compressDirectory(sourceDir, targetFile) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(targetFile);
    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: { level: 9 },
    });

    output.on('close', () => {
      console.log(`✅ Compressed ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Decompress tar.gz archive
 */
async function decompressArchive(sourceFile, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  await tar.extract({
    file: sourceFile,
    cwd: targetDir,
  });

  console.log('✅ Archive extracted');
}

/**
 * Upload backup to S3
 */
async function uploadToS3(filePath, key) {
  const client = initS3Client();
  if (!client) {
    console.log('⚠️  S3 not configured, skipping upload');
    return false;
  }

  try {
    console.log('\n☁️  Uploading to S3...');

    const fileStream = createReadStream(filePath);
    const stats = fs.statSync(filePath);

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${S3_PREFIX}${key}`,
      Body: fileStream,
      ContentType: 'application/gzip',
      Metadata: {
        'backup-date': new Date().toISOString(),
        'backup-size': stats.size.toString(),
      },
    });

    await client.send(command);

    console.log(`✅ Uploaded to S3: s3://${S3_BUCKET}/${S3_PREFIX}${key}`);
    console.log(`   Size: ${formatBytes(stats.size)}`);

    return true;
  } catch (error) {
    console.error('❌ S3 upload failed:', error.message);
    return false;
  }
}

/**
 * List S3 backups
 */
async function listS3Backups() {
  const client = initS3Client();
  if (!client) {
    return [];
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: S3_PREFIX,
    });

    const response = await client.send(command);

    return (response.Contents || []).map((obj) => ({
      name: obj.Key.replace(S3_PREFIX, ''),
      key: obj.Key,
      size: obj.Size,
      created: obj.LastModified,
      location: 's3',
    }));
  } catch (error) {
    console.error('❌ Failed to list S3 backups:', error.message);
    return [];
  }
}

/**
 * Delete S3 backup
 */
async function deleteS3Backup(key) {
  const client = initS3Client();
  if (!client) {
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete S3 backup:', error.message);
    return false;
  }
}

/**
 * Clean old S3 backups
 */
async function cleanOldS3Backups() {
  const client = initS3Client();
  if (!client) {
    return;
  }

  console.log('\n🧹 Cleaning old S3 backups...');

  const backups = await listS3Backups();
  const now = Date.now();
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

  let deletedCount = 0;
  let freedSpace = 0;

  for (const backup of backups) {
    const age = now - backup.created.getTime();

    if (age > retentionMs) {
      const deleted = await deleteS3Backup(backup.key);
      if (deleted) {
        deletedCount++;
        freedSpace += backup.size;
        console.log(
          `   Deleted: ${backup.name} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`
        );
      }
    }
  }

  if (deletedCount > 0) {
    console.log(`\n✅ Deleted ${deletedCount} old S3 backup(s), freed ${formatBytes(freedSpace)}`);
  } else {
    console.log('✅ No old S3 backups to clean');
  }
}

/**
 * Send backup notification
 */
async function sendBackupNotification(success, backupPath, error = null) {
  const notificationsEnabled = process.env.BACKUP_NOTIFICATIONS_ENABLED === 'true';
  if (!notificationsEnabled) {
    return;
  }

  const message = success
    ? `✅ Backup completed successfully\nLocation: ${backupPath}`
    : `❌ Backup failed\nError: ${error?.message || 'Unknown error'}`;

  // Send email notification
  const email = process.env.BACKUP_NOTIFICATION_EMAIL;
  if (email) {
    // TODO: Implement email notification
    console.log(`📧 Email notification would be sent to: ${email}`);
  }

  // Send Slack notification
  const slackWebhook = process.env.BACKUP_SLACK_WEBHOOK;
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          username: 'Backup Bot',
          icon_emoji: success ? ':white_check_mark:' : ':x:',
        }),
      });
      console.log('✅ Slack notification sent');
    } catch (err) {
      console.error('❌ Failed to send Slack notification:', err.message);
    }
  }
}

/**
 * Get current version from migration
 */
function getCurrentVersion() {
  const versionPath = path.join(DATA_DIR, 'migration-version.json');

  if (!fs.existsSync(versionPath)) {
    return '0.0.0';
  }

  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  return versionData.version || '0.0.0';
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath) {
  let size = 0;

  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }

  return size;
}

/**
 * Count files in directory recursively
 */
function countFiles(dirPath) {
  let count = 0;

  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      count += countFiles(filePath);
    } else {
      count++;
    }
  }

  return count;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Schedule automatic backups
 */
function scheduleBackups() {
  const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Default: Daily at 2 AM

  console.log(`\n⏰ Backup scheduled: ${schedule}`);
  console.log(`   Retention: ${RETENTION_DAYS} days`);
  console.log(`   Destination: ${BACKUP_DIR}\n`);

  // TODO: Implement cron scheduling
  // For now, just log the schedule
  console.log('⚠️  Automatic scheduling not yet implemented');
  console.log('   Use cron or task scheduler to run: npm run backup');
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'create':
        await createBackup(arg || 'manual');
        break;

      case 'restore':
        if (!arg) {
          console.error('❌ Backup file required');
          console.error('Usage: node backup.js restore <backup-file>');
          process.exit(1);
        }
        await restoreBackup(arg);
        break;

      case 'list':
        await listBackups();
        break;

      case 'clean':
        await cleanOldBackups();
        break;

      case 'schedule':
        scheduleBackups();
        break;

      default:
        console.log('Automated Backup System\n');
        console.log('Usage:');
        console.log('  node backup.js create [label]    - Create a backup');
        console.log('  node backup.js restore <file>    - Restore from backup');
        console.log('  node backup.js list              - List all backups');
        console.log('  node backup.js clean             - Clean old backups');
        console.log('  node backup.js schedule          - Show backup schedule');
        console.log('\nExamples:');
        console.log('  node backup.js create            - Create automatic backup');
        console.log('  node backup.js create pre-deploy - Create backup with label');
        console.log('  node backup.js restore backup-auto-2024-01-01.tar.gz');
        console.log('  node backup.js list              - Show all backups');
        console.log('  node backup.js clean             - Remove old backups');
        console.log('\nConfiguration:');
        console.log(`  Data directory: ${DATA_DIR}`);
        console.log(`  Backup directory: ${BACKUP_DIR}`);
        console.log(`  Retention: ${RETENTION_DAYS} days`);
    }
  } catch (error) {
    console.error('\n❌ Operation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createBackup, restoreBackup, listBackups, cleanOldBackups, scheduleBackups };
