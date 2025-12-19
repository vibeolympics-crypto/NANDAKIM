import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Data Migration Script
 *
 * This script migrates existing JSON data to the content service format.
 * It reads blog.json, sns.json, projects.json, and config.json, transforms
 * them to the expected format, and ensures data integrity.
 */

const dataDir = path.join(__dirname, '../../src/data');

/**
 * Read JSON file
 */
async function readJSONFile(filename) {
  const filePath = path.join(dataDir, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return null;
  }
}

/**
 * Write JSON file
 */
async function writeJSONFile(filename, data) {
  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Written ${filename}`);
}

/**
 * Create backup of existing data
 */
async function createBackup() {
  const backupDir = path.join(dataDir, 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, timestamp);

  try {
    await fs.mkdir(backupPath, { recursive: true });

    const files = ['blog.json', 'sns.json', 'projects.json', 'config.json'];
    for (const file of files) {
      try {
        const sourcePath = path.join(dataDir, file);
        const destPath = path.join(backupPath, file);
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        // File might not exist, skip
      }
    }

    console.log(`✓ Backup created at: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Error creating backup:', error.message);
    throw error;
  }
}

/**
 * Transform blog posts to new format
 */
function transformBlogPosts(posts) {
  return posts.map((post) => {
    // Generate slug from title if not present
    const slug =
      post.slug ||
      post.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return {
      id: post.id,
      title: post.title,
      slug: slug,
      summary: post.summary,
      content: post.content,
      author: post.author,
      tags: post.tags || [],
      image: post.image || '/assets/placeholder.svg',
      readTime: post.readTime || Math.ceil(post.content.length / 1000),
      publishedAt: post.date || post.publishedAt || new Date().toISOString(),
      date: post.date,
      updatedAt: post.updatedAt || new Date().toISOString(),
      status: post.status || 'published',
    };
  });
}

/**
 * Transform projects to new format
 */
function transformProjects(projects) {
  return projects.map((project, index) => {
    // Normalize image field to images array
    const images = project.images || (project.image ? [project.image] : []);

    // Normalize tags/technologies
    const technologies = project.technologies || project.tags || [];

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      images: images,
      image: project.image,
      technologies: technologies,
      tags: project.tags || [],
      category: project.category,
      liveUrl: project.liveUrl || project.link || '',
      githubUrl: project.githubUrl || '',
      link: project.link,
      featured: project.featured || false,
      order: project.order !== undefined ? project.order : index,
      date: project.date,
      createdAt: project.createdAt || project.date || new Date().toISOString(),
      updatedAt: project.updatedAt || new Date().toISOString(),
    };
  });
}

/**
 * Transform SNS feeds to new format
 */
function transformSNSFeeds(feeds) {
  return feeds.map((feed) => ({
    id: feed.id,
    platform: feed.platform,
    content: feed.content,
    image: feed.image,
    video: feed.video,
    url: feed.url,
    timestamp: feed.timestamp,
    likes: feed.likes || 0,
    comments: feed.comments || 0,
  }));
}

/**
 * Ensure config has hero section
 */
function ensureHeroConfig(config) {
  if (!config.hero) {
    config.hero = {
      title: config.site?.title || 'Won Kim Portfolio',
      subtitle:
        config.site?.description ||
        'Portfolio showcasing projects, events, and professional activities',
      backgroundImage: {
        light: '/assets/hero-bg.jpg',
        dark: '/assets/hero-bg.jpg',
      },
      ctaButtons: {
        primary: {
          text: 'View Projects',
          link: '#projects',
        },
        secondary: {
          text: 'Contact Me',
          link: '#contact',
        },
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'migration',
    };
  }
  return config;
}

/**
 * Validate data structure
 */
function validateData(data, type) {
  const errors = [];

  switch (type) {
    case 'blog':
      if (!data.posts || !Array.isArray(data.posts)) {
        errors.push('Blog data must have a "posts" array');
      } else {
        data.posts.forEach((post, index) => {
          if (!post.id) errors.push(`Blog post ${index} missing id`);
          if (!post.title) errors.push(`Blog post ${index} missing title`);
          if (!post.content) errors.push(`Blog post ${index} missing content`);
        });
      }
      break;

    case 'projects':
      if (!data.projects || !Array.isArray(data.projects)) {
        errors.push('Projects data must have a "projects" array');
      } else {
        data.projects.forEach((project, index) => {
          if (!project.id) errors.push(`Project ${index} missing id`);
          if (!project.title) errors.push(`Project ${index} missing title`);
          if (!project.description) errors.push(`Project ${index} missing description`);
        });
      }
      break;

    case 'sns':
      if (!data.feeds || !Array.isArray(data.feeds)) {
        errors.push('SNS data must have a "feeds" array');
      } else {
        data.feeds.forEach((feed, index) => {
          if (!feed.id) errors.push(`SNS feed ${index} missing id`);
          if (!feed.platform) errors.push(`SNS feed ${index} missing platform`);
          if (!feed.content) errors.push(`SNS feed ${index} missing content`);
          if (!feed.url) errors.push(`SNS feed ${index} missing url`);
        });
      }
      break;

    case 'config':
      if (!data.site) errors.push('Config missing site section');
      break;
  }

  return errors;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('Starting data migration...\n');

  try {
    // Create backup first
    console.log('Creating backup...');
    await createBackup();
    console.log('');

    // Read existing data
    console.log('Reading existing data...');
    const blogData = await readJSONFile('blog.json');
    const projectsData = await readJSONFile('projects.json');
    const snsData = await readJSONFile('sns.json');
    const configData = await readJSONFile('config.json');
    console.log('');

    // Validate existing data
    console.log('Validating data...');
    const validationErrors = [];

    if (blogData) {
      const errors = validateData(blogData, 'blog');
      validationErrors.push(...errors);
    }
    if (projectsData) {
      const errors = validateData(projectsData, 'projects');
      validationErrors.push(...errors);
    }
    if (snsData) {
      const errors = validateData(snsData, 'sns');
      validationErrors.push(...errors);
    }
    if (configData) {
      const errors = validateData(configData, 'config');
      validationErrors.push(...errors);
    }

    if (validationErrors.length > 0) {
      console.error('Validation errors found:');
      validationErrors.forEach((error) => console.error(`  - ${error}`));
      console.log('\nMigration aborted due to validation errors.');
      process.exit(1);
    }
    console.log('✓ Data validation passed');
    console.log('');

    // Transform data
    console.log('Transforming data...');
    let migratedCount = 0;

    if (blogData && blogData.posts) {
      const transformedPosts = transformBlogPosts(blogData.posts);
      await writeJSONFile('blog.json', { posts: transformedPosts });
      console.log(`  ✓ Migrated ${transformedPosts.length} blog posts`);
      migratedCount++;
    }

    if (projectsData && projectsData.projects) {
      const transformedProjects = transformProjects(projectsData.projects);
      await writeJSONFile('projects.json', { projects: transformedProjects });
      console.log(`  ✓ Migrated ${transformedProjects.length} projects`);
      migratedCount++;
    }

    if (snsData && snsData.feeds) {
      const transformedFeeds = transformSNSFeeds(snsData.feeds);
      await writeJSONFile('sns.json', { feeds: transformedFeeds });
      console.log(`  ✓ Migrated ${transformedFeeds.length} SNS feeds`);
      migratedCount++;
    }

    if (configData) {
      const updatedConfig = ensureHeroConfig(configData);
      await writeJSONFile('config.json', updatedConfig);
      console.log(`  ✓ Updated config with hero section`);
      migratedCount++;
    }

    console.log('');
    console.log(`✓ Migration completed successfully!`);
    console.log(`  ${migratedCount} file(s) migrated`);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

export { migrate, transformBlogPosts, transformProjects, transformSNSFeeds };

// Run migration if called directly
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
