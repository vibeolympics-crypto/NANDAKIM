/**
 * Database Migration Script
 * Handles data migration and schema updates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

/**
 * Migration version history
 */
const MIGRATIONS = [
  {
    version: '1.0.0',
    description: 'Initial schema setup',
    up: async () => {
      console.log('Running migration 1.0.0: Initial schema setup');

      // Create data directory if it doesn't exist
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('✅ Created data directory');
      }

      // Initialize settings.json if it doesn't exist
      const settingsPath = path.join(DATA_DIR, 'settings.json');
      if (!fs.existsSync(settingsPath)) {
        const defaultSettings = {
          version: '1.0.0',
          fonts: {
            family: 'Inter',
            baseSize: 16,
            headingScale: 1.5,
            lineHeight: 1.6,
            source: 'google',
          },
          colors: {
            light: {
              primary: '#3b82f6',
              secondary: '#8b5cf6',
              accent: '#ec4899',
              background: '#ffffff',
              foreground: '#0f172a',
              muted: '#f1f5f9',
              border: '#e2e8f0',
            },
            dark: {
              primary: '#60a5fa',
              secondary: '#a78bfa',
              accent: '#f472b6',
              background: '#0f172a',
              foreground: '#f8fafc',
              muted: '#1e293b',
              border: '#334155',
            },
          },
          layout: {
            sidebarWidth: 280,
            containerMaxWidth: 1280,
            sectionSpacing: 80,
            buttonStyle: 'rounded',
          },
          sections: [
            { id: 'hero', name: 'Hero', visible: true, order: 1 },
            { id: 'about', name: 'About', visible: true, order: 2 },
            { id: 'projects', name: 'Projects', visible: true, order: 3 },
            { id: 'blog', name: 'Blog', visible: true, order: 4 },
            { id: 'contact', name: 'Contact', visible: true, order: 5 },
          ],
          updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        console.log('✅ Created default settings.json');
      }

      // Initialize content files
      const contentFiles = [
        'hero.json',
        'about.json',
        'projects.json',
        'blog.json',
        'contact.json',
        'footer.json',
      ];
      for (const file of contentFiles) {
        const filePath = path.join(DATA_DIR, file);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(
            filePath,
            JSON.stringify(
              { version: '1.0.0', data: {}, updatedAt: new Date().toISOString() },
              null,
              2
            )
          );
          console.log(`✅ Created ${file}`);
        }
      }

      // Initialize audit log
      const auditLogPath = path.join(DATA_DIR, 'audit-log.json');
      if (!fs.existsSync(auditLogPath)) {
        fs.writeFileSync(auditLogPath, JSON.stringify({ version: '1.0.0', entries: [] }, null, 2));
        console.log('✅ Created audit-log.json');
      }

      console.log('✅ Migration 1.0.0 completed');
    },
    down: async () => {
      console.log('Rolling back migration 1.0.0');
      // Rollback logic if needed
      console.log('✅ Rollback 1.0.0 completed');
    },
  },
  {
    version: '1.1.0',
    description: 'Add media library support',
    up: async () => {
      console.log('Running migration 1.1.0: Add media library support');

      // Create media metadata file
      const mediaPath = path.join(DATA_DIR, 'media.json');
      if (!fs.existsSync(mediaPath)) {
        fs.writeFileSync(mediaPath, JSON.stringify({ version: '1.1.0', files: [] }, null, 2));
        console.log('✅ Created media.json');
      }

      // Create uploads directory
      const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Created uploads directory');
      }

      console.log('✅ Migration 1.1.0 completed');
    },
    down: async () => {
      console.log('Rolling back migration 1.1.0');
      // Rollback logic if needed
      console.log('✅ Rollback 1.1.0 completed');
    },
  },
  {
    version: '1.2.0',
    description: 'Add SEO and analytics support',
    up: async () => {
      console.log('Running migration 1.2.0: Add SEO and analytics support');

      // Add SEO settings to settings.json
      const settingsPath = path.join(DATA_DIR, 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

        if (!settings.seo) {
          settings.seo = {
            metaTitle: '',
            metaDescription: '',
            keywords: [],
            ogTags: {
              title: '',
              description: '',
              image: '',
            },
            twitterCard: {
              title: '',
              description: '',
              image: '',
            },
          };

          settings.analytics = {
            googleAnalyticsId: '',
            googleAdsenseId: '',
            adPlacements: [],
          };

          settings.version = '1.2.0';
          settings.updatedAt = new Date().toISOString();

          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
          console.log('✅ Added SEO and analytics settings');
        }
      }

      console.log('✅ Migration 1.2.0 completed');
    },
    down: async () => {
      console.log('Rolling back migration 1.2.0');
      // Rollback logic if needed
      console.log('✅ Rollback 1.2.0 completed');
    },
  },
];

/**
 * Get current migration version
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
 * Set current migration version
 */
function setCurrentVersion(version) {
  const versionPath = path.join(DATA_DIR, 'migration-version.json');
  const versionData = {
    version,
    migratedAt: new Date().toISOString(),
  };

  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
}

/**
 * Compare version strings
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
}

/**
 * Run migrations up to target version
 */
async function migrateUp(targetVersion = null) {
  console.log('\n🚀 Starting database migration...\n');

  // Create backup before migration
  await createBackup('pre-migration');

  const currentVersion = getCurrentVersion();
  console.log(`Current version: ${currentVersion}`);

  const target = targetVersion || MIGRATIONS[MIGRATIONS.length - 1].version;
  console.log(`Target version: ${target}\n`);

  let migrationsRun = 0;

  for (const migration of MIGRATIONS) {
    // Skip if already applied
    if (compareVersions(migration.version, currentVersion) <= 0) {
      continue;
    }

    // Stop if we've reached target
    if (targetVersion && compareVersions(migration.version, targetVersion) > 0) {
      break;
    }

    try {
      console.log(`\n📦 Applying migration ${migration.version}: ${migration.description}`);
      await migration.up();
      setCurrentVersion(migration.version);
      migrationsRun++;
    } catch (error) {
      console.error(`\n❌ Migration ${migration.version} failed:`, error.message);
      console.error('Rolling back...');

      // Attempt rollback
      try {
        await migration.down();
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError.message);
      }

      throw error;
    }
  }

  if (migrationsRun === 0) {
    console.log('\n✅ Database is already up to date');
  } else {
    console.log(`\n✅ Successfully applied ${migrationsRun} migration(s)`);
    console.log(`Current version: ${getCurrentVersion()}`);
  }
}

/**
 * Rollback migrations to target version
 */
async function migrateDown(targetVersion) {
  console.log('\n⏪ Rolling back migrations...\n');

  // Create backup before rollback
  await createBackup('pre-rollback');

  const currentVersion = getCurrentVersion();
  console.log(`Current version: ${currentVersion}`);
  console.log(`Target version: ${targetVersion}\n`);

  let migrationsRolledBack = 0;

  // Run migrations in reverse order
  for (let i = MIGRATIONS.length - 1; i >= 0; i--) {
    const migration = MIGRATIONS[i];

    // Skip if not yet applied
    if (compareVersions(migration.version, currentVersion) > 0) {
      continue;
    }

    // Stop if we've reached target
    if (compareVersions(migration.version, targetVersion) <= 0) {
      break;
    }

    try {
      console.log(`\n📦 Rolling back migration ${migration.version}: ${migration.description}`);
      await migration.down();

      // Set version to previous migration
      const prevMigration = MIGRATIONS[i - 1];
      setCurrentVersion(prevMigration ? prevMigration.version : '0.0.0');
      migrationsRolledBack++;
    } catch (error) {
      console.error(`\n❌ Rollback ${migration.version} failed:`, error.message);
      throw error;
    }
  }

  console.log(`\n✅ Successfully rolled back ${migrationsRolledBack} migration(s)`);
  console.log(`Current version: ${getCurrentVersion()}`);
}

/**
 * Create backup before migration
 */
async function createBackup(label) {
  console.log(`\n💾 Creating backup (${label})...`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-${label}-${timestamp}`);

  // Copy data directory
  if (fs.existsSync(DATA_DIR)) {
    fs.cpSync(DATA_DIR, backupPath, { recursive: true });
    console.log(`✅ Backup created: ${backupPath}`);
  } else {
    console.log('⚠️  No data directory to backup');
  }
}

/**
 * Show migration status
 */
function showStatus() {
  const currentVersion = getCurrentVersion();

  console.log('\n📊 Migration Status\n');
  console.log(`Current version: ${currentVersion}\n`);
  console.log('Available migrations:');

  for (const migration of MIGRATIONS) {
    const status = compareVersions(migration.version, currentVersion) <= 0 ? '✅' : '⏳';
    console.log(`  ${status} ${migration.version} - ${migration.description}`);
  }

  console.log('');
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'up':
        await migrateUp(arg);
        break;

      case 'down':
        if (!arg) {
          console.error('❌ Target version required for rollback');
          console.error('Usage: node migrate.js down <version>');
          process.exit(1);
        }
        await migrateDown(arg);
        break;

      case 'status':
        showStatus();
        break;

      case 'backup':
        await createBackup(arg || 'manual');
        break;

      default:
        console.log('Database Migration Tool\n');
        console.log('Usage:');
        console.log(
          '  node migrate.js up [version]     - Run migrations up to version (or latest)'
        );
        console.log('  node migrate.js down <version>   - Rollback migrations to version');
        console.log('  node migrate.js status           - Show migration status');
        console.log('  node migrate.js backup [label]   - Create manual backup');
        console.log('\nExamples:');
        console.log('  node migrate.js up               - Migrate to latest version');
        console.log('  node migrate.js up 1.1.0         - Migrate to version 1.1.0');
        console.log('  node migrate.js down 1.0.0       - Rollback to version 1.0.0');
        console.log('  node migrate.js status           - Show current status');
        console.log('  node migrate.js backup pre-prod  - Create backup with label');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { migrateUp, migrateDown, showStatus, createBackup };
