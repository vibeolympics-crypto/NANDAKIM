const NOTION_API_VERSION = '2022-06-28';
const NOTION_API_BASE = 'https://api.notion.com/v1';

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

async function createNotionPage(env, data) {
  const { name, email, subject, message } = data;
  const response = await fetch(`${NOTION_API_BASE}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_API_KEY}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: env.NOTION_DATABASE_ID },
      properties: {
        'Name': { title: [{ text: { content: name || 'Anonymous' } }] },
        'Email': { email: email || '' },
        'Subject': { rich_text: [{ text: { content: subject || 'No Subject' } }] },
        'Message': { rich_text: [{ text: { content: message || '' } }] },
        'Status': { select: { name: 'New' } },
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

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    try {
      if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
        throw new Error('Missing required environment variables');
      }
      const data = await request.json();
      if (!data.name || !data.email || !data.message) {
        return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      const result = await createNotionPage(env, data);
      return new Response(JSON.stringify({ success: true, message: 'Message sent successfully', id: result.id }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
