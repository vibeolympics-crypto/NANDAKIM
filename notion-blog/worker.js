/**
 * Integrated Notion Worker
 * - GET / or /blog → Blog posts from Notion
 * - POST /contact → Save contact form to Notion
 * - GET /health → Health check
 */

const NOTION_API_VERSION = '2022-06-28';
const NOTION_API_BASE = 'https://api.notion.com/v1';

// CORS Headers
function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:8093').split(',').map(o => o.trim());
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// ============ BLOG FUNCTIONS ============

function richTextToPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(item => item.plain_text || '').join('');
}

function transformNotionPage(page) {
  const properties = page.properties || {};

  // Title
  let title = '';
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === 'title') {
      title = richTextToPlainText(prop.title);
      break;
    }
  }

  // Summary
  const summary = properties.Summary?.rich_text
    ? richTextToPlainText(properties.Summary.rich_text)
    : properties['AI 자동 입력']?.rich_text
      ? richTextToPlainText(properties['AI 자동 입력'].rich_text)
      : '';

  // Date
  let date = '';
  if (properties['게시일']?.date?.start) {
    date = properties['게시일'].date.start;
  } else if (properties.Date?.date?.start) {
    date = properties.Date.date.start;
  } else if (page.created_time) {
    date = page.created_time.split('T')[0];
  }

  // Tags
  const tags = [];
  if (properties['태그']?.multi_select) {
    properties['태그'].multi_select.forEach(tag => tags.push(tag.name));
  } else if (properties.Tags?.multi_select) {
    properties.Tags.multi_select.forEach(tag => tags.push(tag.name));
  }

  // Thumbnail
  let thumbnail = '';
  if (page.cover) {
    thumbnail = page.cover.type === 'external'
      ? page.cover.external.url
      : page.cover.file?.url || '';
  }

  // URL
  let url = page.url || '';
  if (properties.URL?.url) url = properties.URL.url;

  // Author
  let author = 'Won Kim';
  if (properties['생성자']?.people?.[0]?.name) {
    author = properties['생성자'].people[0].name;
  }

  return { id: page.id, title: title || 'Untitled', summary, date, tags, thumbnail, url, author };
}

async function queryBlogDatabase(env, limit = 10) {
  const databaseId = env.NOTION_BLOG_DATABASE_ID;

  const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_API_KEY}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json; charset=utf-8',
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

async function handleBlogRequest(request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);

  const notionResponse = await queryBlogDatabase(env, limit);
  const posts = (notionResponse.results || []).map(transformNotionPage);

  return { success: true, posts, total: posts.length };
}

// ============ CONTACT FUNCTIONS ============

async function createContactPage(env, data) {
  const { name, email, subject, message } = data;
  const databaseId = env.NOTION_CONTACT_DATABASE_ID;

  const response = await fetch(`${NOTION_API_BASE}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_API_KEY}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        'Name': { title: [{ text: { content: name || 'Anonymous' } }] },
        'Email': { email: email || '' },
        'Subject': { rich_text: [{ text: { content: subject || 'No Subject' } }] },
        'Message': { rich_text: [{ text: { content: message || '' } }] },
        'Date': { date: { start: new Date().toISOString().split('T')[0] } }
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

async function handleContactRequest(request, env) {
  const data = await request.json();

  if (!data.name || !data.email || !data.message) {
    return { success: false, error: 'Missing required fields', status: 400 };
  }

  const result = await createContactPage(env, data);
  return { success: true, message: 'Message sent successfully', id: result.id };
}

// ============ MAIN HANDLER ============

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request, env);
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        hasApiKey: !!env.NOTION_API_KEY,
        hasBlogDb: !!env.NOTION_BLOG_DATABASE_ID,
        hasContactDb: !!env.NOTION_CONTACT_DATABASE_ID
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    try {
      // Check API Key
      if (!env.NOTION_API_KEY) {
        throw new Error('Missing NOTION_API_KEY');
      }

      let result;

      // Route: POST /contact → Contact Form
      if (request.method === 'POST' && (path === '/contact' || path === '/')) {
        if (!env.NOTION_CONTACT_DATABASE_ID) {
          throw new Error('Missing NOTION_CONTACT_DATABASE_ID');
        }
        result = await handleContactRequest(request, env);

        if (result.status === 400) {
          return new Response(JSON.stringify(result), {
            status: 400,
            headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
          });
        }
      }
      // Route: GET / or /blog → Blog Posts
      else if (request.method === 'GET') {
        if (!env.NOTION_BLOG_DATABASE_ID) {
          throw new Error('Missing NOTION_BLOG_DATABASE_ID');
        }
        result = await handleBlogRequest(request, env);
      }
      // Method not allowed
      else {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': request.method === 'GET' ? 'public, max-age=300' : 'no-store',
          ...corsHeaders
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      });
    }
  },
};
