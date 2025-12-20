import express from 'express';
import Parser from 'rss-parser';
import { logger } from '../utils/logger.js';

const router = express.Router();
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

const MAX_ITEMS = 9;

// Korean AI/IT/VIBE Coding news sources
const SOURCES = [
  {
    url: 'https://www.aitimes.com/rss/allArticle.xml',
    name: 'AI타임스',
    category: 'AI',
  },
  {
    url: 'https://zdnet.co.kr/rss/news.xml',
    name: 'ZDNet Korea',
    category: 'IT',
  },
  {
    url: 'https://www.bloter.net/feed',
    name: '블로터',
    category: 'VIBE Coding',
  },
  {
    url: 'https://www.itworld.co.kr/rss/feed.xml',
    name: 'ITWorld Korea',
    category: 'AI',
  },
  {
    url: 'https://yozm.wishket.com/magazine/list/develop/feed/',
    name: '요즘IT',
    category: 'VIBE Coding',
  },
];

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=AI+News';

const resolveImage = (item) => {
  const enclosureUrl = item.enclosure?.url;
  const mediaContent = item['media:content']?.url || item['media:thumbnail']?.url;
  const contentHtml = item.content || item['content:encoded'] || '';

  const imgFromHtmlMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);

  const rawUrl = enclosureUrl || mediaContent || imgFromHtmlMatch?.[1] || item.image || item.thumbnail;
  if (!rawUrl) return PLACEHOLDER_IMAGE;

  try {
    // Validate URL format
    const parsed = new URL(rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl);
    const urlString = parsed.toString();
    const needsProxy = ['pstatic.net', 'naver.com', 'kakaocdn.net', 'kakao.com'].some((domain) =>
      urlString.includes(domain)
    );

    if (needsProxy) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(urlString)}&w=400&h=300&fit=cover&q=85`;
    }

    return urlString;
  } catch (err) {
    logger.warn('[AI VIBE News] Invalid image URL, using placeholder', { rawUrl, error: err.message });
    return PLACEHOLDER_IMAGE;
  }
};

const mapItem = (item, sourceName, category) => {
  const summary = item.contentSnippet || item.content || item.summary || '';
  const isoDate = item.isoDate || item.pubDate || new Date().toISOString();

  return {
    id: `${sourceName}-${item.guid || item.link || Date.now()}`,
    title: item.title || '제목 없음',
    summary: summary.substring(0, 220),
    description: summary,
    source: sourceName,
    category,
    date: isoDate,
    image: resolveImage(item),
    url: item.link || item.url || '#',
  };
};

router.get('/ai-vibe', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || MAX_ITEMS, MAX_ITEMS);
  const perSourceLimit = Math.max(1, Math.ceil(limit / SOURCES.length));

  try {
    const results = await Promise.all(
      SOURCES.map(async (source) => {
        try {
          const feed = await parser.parseURL(source.url);
          if (!feed?.items?.length) return [];

          return feed.items
            .slice(0, perSourceLimit)
            .map((item) => mapItem(item, source.name, source.category));
        } catch (err) {
          logger.warn('[AI VIBE News] RSS load failed', { source: source.name, error: err.message });
          return [];
        }
      })
    );

    const merged = results
      .flat()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    res.json({
      ok: true,
      news: merged,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[AI VIBE News] Unexpected failure', { error: err.message });
    res.status(500).json({ ok: false, error: 'Failed to load AI VIBE news' });
  }
});

export default router;
