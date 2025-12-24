/**
 * Cloudflare Worker: Notion Blog Feed API
 */

const NOTION_API_VERSION = '2022-06-28';
const NOTION_API_BASE = 'https://api.notion.com/v1';

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function richTextToPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(item => item.plain_text || '').join('');
}

function transformNotionPage(page) {
  const properties = page.properties || {};
  let title = '';
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === 'title') {
      title = richTextToPlainText(prop.title);
      break;
    }
  }

  const summary = properties.Summary?.rich_text
    ? richTextToPlainText(properties.Summary.rich_text)
    : properties['AI 자동 입력']?.rich_text
      ? richTextToPlainText(properties['AI 자동 입력'].rich_text)
      : '';

  let date = '';
  if (properties['게시일']?.date?.start) {
    date = properties['게시일'].date.start;
  } else if (properties.Date?.date?.start) {
    date = properties.Date.date.start;
  } else if (page.created_time) {
    date = page.created_time.split('T')[0];
  }

  const tags = [];
  if (properties['태그']?.multi_select) {
    properties['태그'].multi_select.forEach(tag => tags.push(tag.name));
  } else if (properties.Tags?.multi_select) {
    properties.Tags.multi_select.forEach(tag => tags.push(tag.name));
  }

  let thumbnail = '';
  if (page.cover) {
    thumbnail = page.cover.type === 'external' 
      ? page.cover.external.url 
      : page.cover.file?.url || '';
  }

  let url = page.url || '';
  if (properties.URL?.url) url = properties.URL.url;

  let author = 'Won Kim';
  if (properties['생성자']?.people?.[0]?.name) {
    author = properties['생성자'].people[0].name;
  }

  return { id: page.id, title: title || 'Untitled', summary, date, tags, thumbnail, url, author };
}

async function queryNotionDatabase(env, limit = 10) {
  const response = await fetch(`${NOTION_API_BASE}/databases/${env.NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_API_KEY}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page_size: limit,
      sorts: [{ property: '게시일', direction: 'descending' }],
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    try {
      if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
        throw new Error('Missing required environment variables');
      }
      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
      const notionResponse = await queryNotionDatabase(env, limit);
      const posts = (notionResponse.results || []).map(transformNotionPage);
      return new Response(JSON.stringify({ success: true, posts, total: posts.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', ...corsHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message, posts: [] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      });
    }
  },
};
