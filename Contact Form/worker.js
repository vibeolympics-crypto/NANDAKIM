/**
 * Cloudflare Worker: Notion Contact Form API
 * 
 * Contact Form 데이터를 Notion 데이터베이스에 저장
 */

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
        // 제목 (Name 또는 이름)
        'Name': {
          title: [{ text: { content: name || 'Anonymous' } }]
        },
        // 이메일
        'Email': {
          email: email || ''
        },
        // 제목/주제
        'Subject': {
          rich_text: [{ text: { content: subject || 'No Subject' } }]
        },
        // 메시지 내용
        'Message': {
          rich_text: [{ text: { content: message || '' } }]
        },
        // 상태 (기본값: New)
        'Status': {
          select: { name: 'New' }
        },
        // 제출 날짜
        'Date': {
          date: { start: new Date().toISOString().split('T')[0] }
        }
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

    // Preflight 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // POST 요청만 허용
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      // 환경 변수 확인
      if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
        throw new Error('Missing required environment variables');
      }

      // 요청 데이터 파싱
      const data = await request.json();

      // 필수 필드 검증
      if (!data.name || !data.email || !data.message) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields: name, email, message'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid email format'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Notion에 저장
      const result = await createNotionPage(env, data);

      return new Response(JSON.stringify({
        success: true,
        message: 'Message sent successfully',
        id: result.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (error) {
      console.error('Error saving to Notion:', error);

      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Failed to send message'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
