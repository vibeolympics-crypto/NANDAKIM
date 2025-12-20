import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Allowed domains for RSS proxy (security whitelist)
const ALLOWED_DOMAINS = [
  'rss.blog.naver.com',
  'blog.rss.naver.com',
  'www.youtube.com',
  'youtube.com',
  'feeds.feedburner.com',
];

/**
 * Validate URL and check against whitelist
 */
const validateProxyUrl = (url) => {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return { valid: false, error: 'Domain not allowed' };
    }

    return { valid: true, url: parsedUrl.href };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

/**
 * GET /api/proxy/rss
 * Proxy for RSS feeds (Naver Blog, YouTube, etc.)
 */
router.get('/rss', async (req, res) => {
  const { url } = req.query;

  const validation = validateProxyUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(validation.url, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'application/xml';
    const data = await response.text();

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.send(data);

    logger.info(`[Proxy] RSS fetched successfully: ${validation.url.substring(0, 50)}...`);
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn(`[Proxy] RSS request timeout: ${url}`);
      return res.status(504).json({ error: 'Request timeout' });
    }

    logger.error(`[Proxy] RSS fetch failed: ${error.message}`);
    res.status(502).json({ error: 'Failed to fetch RSS feed' });
  }
});

/**
 * GET /api/proxy/youtube
 * Proxy specifically for YouTube RSS feeds
 */
router.get('/youtube', async (req, res) => {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ error: 'channelId is required' });
  }

  // Validate channelId format (UC followed by 22 characters)
  if (!/^UC[\w-]{22}$/.test(channelId)) {
    return res.status(400).json({ error: 'Invalid channelId format' });
  }

  const youtubeRssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(youtubeRssUrl, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`YouTube returned ${response.status}`);
    }

    const data = await response.text();

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=600'); // Cache for 10 minutes
    res.send(data);

    logger.info(`[Proxy] YouTube RSS fetched: ${channelId}`);
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn(`[Proxy] YouTube request timeout: ${channelId}`);
      return res.status(504).json({ error: 'Request timeout' });
    }

    logger.error(`[Proxy] YouTube fetch failed: ${error.message}`);
    res.status(502).json({ error: 'Failed to fetch YouTube feed' });
  }
});

export default router;
