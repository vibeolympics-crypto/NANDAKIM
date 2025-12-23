/**
 * Cloudflare Worker: Notion Blog Feed API
 *
 * Notion 데이터베이스에서 블로그 게시물을 가져와 JSON으로 반환
 *
 * 환경 변수 (Workers Secrets):
 * - NOTION_API_KEY: Notion Integration Token
 * - NOTION_DATABASE_ID: 블로그 데이터베이스 ID
 * - ALLOWED_ORIGINS: 허용된 Origin (쉼표로 구분, 예: "https://example.com,https://www.example.com")
 */

const NOTION_API_VERSION = '2022-06-28';
const NOTION_API_BASE = 'https://api.notion.com/v1';

// CORS 헤더 생성
function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(o => o.trim());

  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// Notion 리치 텍스트를 일반 텍스트로 변환
function richTextToPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(item => item.plain_text || '').join('');
}

// Notion 페이지를 블로그 포스트 형식으로 변환
function transformNotionPage(page) {
  const properties = page.properties || {};

  // 제목 추출 (Title 타입 속성 찾기)
  let title = '';
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === 'title') {
      title = richTextToPlainText(prop.title);
      break;
    }
  }

  // 요약/설명 추출
  const summary = properties.Summary?.rich_text
    ? richTextToPlainText(properties.Summary.rich_text)
    : properties.Description?.rich_text
      ? richTextToPlainText(properties.Description.rich_text)
      : '';

  // 날짜 추출
  let date = '';
  if (properties.Date?.date?.start) {
    date = properties.Date.date.start;
  } else if (properties.Created?.created_time) {
    date = properties.Created.created_time.split('T')[0];
  } else if (page.created_time) {
    date = page.created_time.split('T')[0];
  }

  // 태그 추출
  const tags = [];
  if (properties.Tags?.multi_select) {
    properties.Tags.multi_select.forEach(tag => tags.push(tag.name));
  } else if (properties.Category?.select) {
    tags.push(properties.Category.select.name);
  }

  // 커버 이미지 추출
  let thumbnail = '';
  if (page.cover) {
    if (page.cover.type === 'external') {
      thumbnail = page.cover.external.url;
    } else if (page.cover.type === 'file') {
      thumbnail = page.cover.file.url;
    }
  }

  // 썸네일 속성이 있으면 우선 사용
  if (properties.Thumbnail?.files?.[0]) {
    const file = properties.Thumbnail.files[0];
    thumbnail = file.external?.url || file.file?.url || thumbnail;
  }

  // URL 추출 (외부 링크 또는 Notion 페이지 URL)
  let url = page.url || '';
  if (properties.URL?.url) {
    url = properties.URL.url;
  } else if (properties.Link?.url) {
    url = properties.Link.url;
  }

  // 작성자 추출
  let author = 'Won Kim';
  if (properties.Author?.people?.[0]?.name) {
    author = properties.Author.people[0].name;
  } else if (properties.Author?.rich_text) {
    author = richTextToPlainText(properties.Author.rich_text) || author;
  }

  // 상태 추출 (Published만 반환할지 여부)
  const status = properties.Status?.select?.name || 'Published';

  return {
    id: page.id,
    title: title || 'Untitled',
    summary,
    date,
    tags,
    thumbnail,
    url,
    author,
    status,
  };
}

// Notion 데이터베이스 쿼리
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
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
      filter: {
        or: [
          {
            property: 'Status',
            select: {
              equals: 'Published',
            },
          },
          {
            property: 'Status',
            select: {
              equals: '발행됨',
            },
          },
          // Status 속성이 없는 경우를 위한 fallback
          {
            property: 'Status',
            select: {
              is_empty: true,
            },
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// 메인 핸들러
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request, env);

    // Preflight 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // GET 요청만 허용
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    try {
      // 환경 변수 확인
      if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
        throw new Error('Missing required environment variables: NOTION_API_KEY or NOTION_DATABASE_ID');
      }

      // URL 파라미터에서 limit 추출
      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);

      // Notion 데이터베이스 쿼리
      const notionResponse = await queryNotionDatabase(env, limit);

      // 결과 변환
      const posts = (notionResponse.results || []).map(transformNotionPage);

      // 응답 반환
      return new Response(JSON.stringify({
        success: true,
        posts,
        total: posts.length,
        hasMore: notionResponse.has_more || false,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300', // 5분 캐시
          ...corsHeaders,
        },
      });

    } catch (error) {
      console.error('Error fetching Notion blog feed:', error);

      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch blog posts',
        posts: [],
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...corsHeaders,
        },
      });
    }
  },
};
