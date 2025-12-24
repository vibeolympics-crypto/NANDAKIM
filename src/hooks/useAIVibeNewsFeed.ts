import { useState, useEffect, useCallback } from 'react';
import { NewsItem } from '@/lib/api';

const NEWS_JSON_URL = '/news.json';
const TOTAL_NEWS_LIMIT = 9;

/**
 * AI & VIBE 뉴스 피드를 정적 JSON 파일에서 가져오는 훅
 * 정적 사이트 배포를 위해 백엔드 API 대신 public/news.json 사용
 * @param limit - 가져올 최대 뉴스 수 (기본값: 9)
 * @param refreshInterval - 자동 갱신 주기 (밀리초, 기본값: 30분)
 */
export const useAIVibeNewsFeed = (limit: number = TOTAL_NEWS_LIMIT, refreshInterval: number = 30 * 60 * 1000) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWithTimeout = (url: string, timeout = 10000): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  };

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 정적 JSON 파일에서 뉴스 로드
      const response = await fetchWithTimeout(NEWS_JSON_URL);
      if (!response.ok) {
        throw new Error(`뉴스 파일 로드 실패: ${response.status}`);
      }

      const payload = await response.json();
      const items: NewsItem[] = (payload?.news || []).slice(0, limit);

      setNews(items);
      if (payload?.lastUpdated) {
        setLastUpdated(new Date(payload.lastUpdated));
      } else {
        setLastUpdated(new Date());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '뉴스를 불러오지 못했습니다.';
      setError(message);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, refreshInterval);
    return () => clearInterval(interval);
  }, [loadNews, refreshInterval]);

  return {
    news,
    loading,
    error,
    lastUpdated,
    refresh: loadNews,
  };
};
