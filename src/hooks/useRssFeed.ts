import { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '@/lib/api';

// Notion Blog Feed API URL (환경 변수 또는 기본값)
const NOTION_BLOG_API_URL = import.meta.env.VITE_NOTION_BLOG_API_URL || '';
// Fallback: 정적 JSON 파일
const BLOG_JSON_URL = '/blog.json';

interface NotionBlogResponse {
  success: boolean;
  posts: NotionBlogPost[];
  total: number;
  hasMore: boolean;
  error?: string;
}

interface NotionBlogPost {
  id: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  thumbnail: string;
  url: string;
  author: string;
  status: string;
}

/**
 * Notion 블로그 포스트를 BlogPost 형식으로 변환
 */
function transformNotionPost(post: NotionBlogPost): BlogPost {
  return {
    id: post.id,
    title: post.title,
    summary: post.summary,
    content: post.summary,
    date: formatDate(post.date),
    tags: post.tags,
    thumbnail: post.thumbnail,
    image: post.thumbnail,
    url: post.url,
    author: post.author,
    category: post.tags[0] || 'Blog',
  };
}

/**
 * 날짜 형식 변환 (YYYY-MM-DD -> 읽기 쉬운 형식)
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Notion Blog Feed API에서 블로그 포스트를 가져오는 훅
 * Cloudflare Worker를 통해 Notion 데이터베이스 연동
 * API 실패 시 정적 JSON 파일로 fallback
 *
 * @param _rssUrl - (미사용) 하위 호환성을 위해 유지
 * @param limit - 가져올 최대 포스트 수
 */
export const useRssFeed = (_rssUrl: string, limit: number = 10) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFromNotionAPI = useCallback(async (): Promise<BlogPost[]> => {
    if (!NOTION_BLOG_API_URL) {
      throw new Error('NOTION_BLOG_API_URL not configured');
    }

    const url = new URL(NOTION_BLOG_API_URL);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data: NotionBlogResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API 응답 오류');
    }

    return data.posts.map(transformNotionPost);
  }, [limit]);

  const fetchFromStaticJSON = useCallback(async (): Promise<BlogPost[]> => {
    const response = await fetch(BLOG_JSON_URL);
    if (!response.ok) {
      throw new Error(`정적 파일 로드 실패: ${response.status}`);
    }

    const data = await response.json();
    return (data?.posts || []).slice(0, limit);
  }, [limit]);

  const loadBlogData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Notion API 시도
      if (NOTION_BLOG_API_URL) {
        try {
          const notionPosts = await fetchFromNotionAPI();
          setPosts(notionPosts);
          return;
        } catch (notionError) {
          console.warn('Notion API 실패, 정적 파일로 fallback:', notionError);
        }
      }

      // 2. 정적 JSON 파일 fallback
      const staticPosts = await fetchFromStaticJSON();
      setPosts(staticPosts);

    } catch (err) {
      const message = err instanceof Error ? err.message : '블로그를 불러오지 못했습니다.';
      setError(message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFromNotionAPI, fetchFromStaticJSON]);

  useEffect(() => {
    loadBlogData();
  }, [loadBlogData]);

  const retry = useCallback(() => {
    loadBlogData();
  }, [loadBlogData]);

  return { posts, loading, error, retry };
};
