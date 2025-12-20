import { useState, useEffect } from 'react';
import { BlogPost } from '@/lib/api';

const BLOG_JSON_URL = '/blog.json';

/**
 * 정적 JSON 파일에서 블로그 포스트를 가져오는 훅
 * 정적 사이트 배포를 위해 백엔드 API 대신 public/blog.json 사용
 * @param rssUrl - RSS 피드 URL (사용하지 않음 - 정적 배포용)
 * @param limit - 가져올 최대 포스트 수
 */
export const useRssFeed = (rssUrl: string, limit: number = 10) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBlogData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 정적 JSON 파일에서 블로그 데이터 로드
        const response = await fetch(BLOG_JSON_URL);
        if (!response.ok) {
          throw new Error(`블로그 파일 로드 실패: ${response.status}`);
        }

        const data = await response.json();
        const blogPosts: BlogPost[] = (data?.posts || []).slice(0, limit);

        setPosts(blogPosts);
      } catch (err) {
        const message = err instanceof Error ? err.message : '블로그를 불러오지 못했습니다.';
        setError(message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadBlogData();
  }, [limit]);

  return { posts, loading, error };
};
