import { useState, useEffect } from 'react';

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
}

// CORS 프록시 목록 (RSS 네이버 블로그 방식과 동일)
const YOUTUBE_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * YouTube 채널의 영상 정보를 가져옵니다.
 * RSS 피드를 파싱하여 최신 영상 정보를 반환합니다.
 * 
 * @param channelId - YouTube 채널 ID
 * @param limit - 가져올 최대 영상 수 (기본값: 5)
 * @param refreshInterval - 자동 갱신 주기 (밀리초, 기본값: 1시간)
 */
export const useYouTubeFeed = (
  channelId: string,
  limit: number = 5,
  refreshInterval: number = 60 * 60 * 1000
) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchYouTubeRSS = async () => {
    try {
      setLoading(true);
      setError(null);

      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

      let xmlText: string | null = null;
      let lastError: Error | null = null;

      // 여러 프록시 시도
      for (let i = 0; i < YOUTUBE_PROXIES.length; i++) {
        try {
          const proxyUrl = YOUTUBE_PROXIES[i](rssUrl);
          console.log(`[YouTube RSS] 프록시 ${i + 1} 시도 (채널: ${channelId.substring(0, 8)}...)`);
          
          const response = await Promise.race([
            fetch(proxyUrl, {
              headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml',
              }
            }),
            new Promise<Response>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 8000)
            ),
          ]);

          if (response.ok) {
            xmlText = await response.text();
            console.log(`[YouTube RSS] 프록시 ${i + 1} 성공! (채널: ${channelId.substring(0, 8)}...)`);
            break;
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');
          console.warn(`[YouTube RSS] 프록시 ${i + 1} 실패:`, lastError.message);
          continue;
        }
      }

      if (!xmlText) {
        throw lastError || new Error('모든 프록시 시도 실패');
      }

      // XML 파싱
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('YouTube RSS 파싱 오류');
      }

      const items = xmlDoc.getElementsByTagName('entry');
      if (items.length === 0) {
        console.log(`[YouTube RSS] 채널에서 영상을 찾을 수 없음: ${channelId}`);
        setVideos([]);
        return;
      }

      // XML에서 텍스트 추출
      const getElementText = (element: Element, tagName: string, namespace?: string): string => {
        let el: Element | null = null;
        if (namespace) {
          el = element.querySelector(`${namespace}\\:${tagName}`) || 
               element.querySelector(`[*|local-name()='${tagName}']`);
        } else {
          el = element.getElementsByTagName(tagName)[0];
        }
        return el?.textContent || '';
      };

      // RSS 아이템을 YouTubeVideo 형식으로 변환
      const youtubeVideos: YouTubeVideo[] = Array.from(items).slice(0, limit).map((item: any, index: number) => {
        // 제목 추출
        const title = getElementText(item, 'title') || '제목 없음';

        // 비디오 ID 추출 (yt:videoId)
        const videoIdElement = item.querySelector('[*|local-name()="videoId"]');
        const videoId = videoIdElement?.textContent || 
                        getElementText(item, 'videoId', 'yt') ||
                        `video-${index}`;

        // 썸네일 추출
        const thumbnailElement = item.querySelector('link[rel="alternate"]');
        const videoUrl = thumbnailElement?.getAttribute('href') || `https://www.youtube.com/watch?v=${videoId}`;
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        // 발행 날짜
        const publishedAt = getElementText(item, 'published') || new Date().toISOString();

        return {
          id: videoId,
          title: title,
          url: videoUrl,
          thumbnail: thumbnailUrl,
          publishedAt: publishedAt,
        };
      });

      console.log(`[YouTube RSS] ✅ ${youtubeVideos.length}개 영상 로드 완료 (채널: ${channelId.substring(0, 8)}...)`);
      setVideos(youtubeVideos);
    } catch (err) {
      console.error('[YouTube RSS] 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!channelId) {
      setError('채널 ID가 없습니다.');
      setLoading(false);
      return;
    }

    // 초기 로드
    fetchYouTubeRSS();

    // 주기적 갱신
    const interval = setInterval(fetchYouTubeRSS, refreshInterval);

    return () => clearInterval(interval);
  }, [channelId, limit, refreshInterval]);

  return { videos, loading, error };
};
