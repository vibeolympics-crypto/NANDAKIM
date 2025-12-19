import { useState, useEffect, useCallback, useRef } from 'react';
import { NewsItem } from '@/lib/api';

const RSS_CORS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

// RSS 피드 소스 설정 (국내 AI/IT/코딩 뉴스) - 3개 소스 x 3개 = 9개
const RSS_NEWS_SOURCES = [
  {
    url: 'https://www.aitimes.com/rss/allArticle.xml',
    name: 'AI타임스',
    category: 'AI',
    priority: 1,
  },
  {
    url: 'https://zdnet.co.kr/rss/news.xml',
    name: 'ZDNet Korea',
    category: 'IT',
    priority: 1,
  },
  {
    url: 'https://www.bloter.net/feed',
    name: '블로터',
    category: 'VIBE Coding',
    priority: 2,
  },
];

/**
 * AI & VIBE 뉴스 피드를 여러 RSS 소스에서 가져오는 훅
 * @param limit - 각 피드당 가져올 최대 뉴스 수
 * @param refreshInterval - 자동 갱신 주기 (밀리초, 기본값: 30분)
 */
export const useAIVibeNewsFeed = (limit: number = 5, refreshInterval: number = 30 * 60 * 1000) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 이미지 추출 캐시 (성능 최적화) - useRef로 변경하여 리렌더링 시에도 유지
  const imageCacheRef = useRef<Map<string, string>>(new Map());
  
  // 번역 캐시 (성능 최적화) - useRef로 변경하여 리렌더링 시에도 유지
  const translationCacheRef = useRef<Map<string, string>>(new Map());

  /**
   * 이미지 URL 검증 및 최적화
   * @param url - 이미지 URL
   * @returns 최적화된 이미지 URL
   */
  const optimizeImageUrl = (url: string): string => {
    if (!url) {
      return `https://via.placeholder.com/400x300?text=No+Image`;
    }

    try {
      // URL 유효성 검사
      const urlObj = new URL(url);
      
      // 상대 경로 URL은 절대 경로로 변환하지 않음 (프록시 처리 필요)
      if (!urlObj.protocol.startsWith('http')) {
        console.warn('[이미지] 프로토콜 오류:', url);
        return `https://via.placeholder.com/400x300?text=Invalid+Protocol`;
      }
    } catch (err) {
      console.warn('[이미지] URL 검증 실패:', url, err);
      return `https://via.placeholder.com/400x300?text=Invalid+URL`;
    }

    // 이미 최적화된 URL이면 그대로 반환
    if (url.includes('via.placeholder.com') || url.includes('weserv.nl')) {
      return url;
    }

    // CORS 프록시를 통해 이미지 최적화
    // - 한국 사이트: weserv.nl (CORS 안전)
    // - 제한된 CORS 사이트: weserv.nl
    // - 일반 사이트: 직접 사용 (대부분 CORS 허용)
    const corsRestrictedDomains = [
      'pstatic.net', 'naver.com', 'kakao.com',
      'arstechnica.com', // Ars Technica 이미지
      'cdn-images-1.medium.com', // Medium 이미지
      'images1.ycombinator.com', // Hacker News 이미지
    ];

    if (corsRestrictedDomains.some(domain => url.includes(domain))) {
      console.log('[이미지] weserv.nl 프록시 적용:', url.substring(0, 60));
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400&h=300&fit=cover&q=80`;
    }

    // 일반 URL은 직접 사용
    console.log('[이미지] 직접 사용:', url.substring(0, 60));
    return url;
  };

  // 타임아웃이 있는 fetch (너무 오래 걸리는 요청 방지)
  const fetchWithTimeout = (url: string, timeout: number = 5000): Promise<Response> => {
    return Promise.race([
      fetch(url),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), timeout)
      ),
    ]);
  };

  /**
   * 번역 기능 임시 비활성화 - 무한 새로고침 문제 해결
   * LibreTranslate API 호출 시 무한 갱신 문제 발생
   * 향후 백엔드에서 번역 처리 후 재활성화 예정
   * @param text - 번역할 텍스트 (영문)
   * @returns 원본 텍스트 (번역 제외)
   */
  const translateTitleToKorean = async (text: string): Promise<string> => {
    // 번역 비활성화 - 원본 텍스트 그대로 반환
    // 이유: LibreTranslate API 호출로 인한 무한 새로고침 문제
    // 향후: 백엔드에서 번역 후 제공하도록 개선 예정
    return text;
  };

  // Hacker News 기사에서 og:image 추출 (타임아웃 포함)
  const extractImageFromHackerNewsArticle = async (articleUrl: string): Promise<string | null> => {
    try {
      // 캐시 확인
      if (imageCacheRef.current.has(articleUrl)) {
        const cached = imageCacheRef.current.get(articleUrl);
        return cached || null;
      }

      // CORS 프록시를 통해 기사 HTML 가져오기 (5초 타임아웃)
      const corsProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(articleUrl)}`;

      const response = await fetchWithTimeout(corsProxy, 5000);
      
      if (!response.ok) {
        imageCacheRef.current.set(articleUrl, ''); // 실패도 캐시 (반복 요청 방지)
        return null;
      }

      const html = await response.text();
      
      // og:image 메타 태그 추출
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      if (ogImageMatch?.[1]) {
        imageCacheRef.current.set(articleUrl, ogImageMatch[1]); // 캐시에 저장
        return ogImageMatch[1];
      }

      // twitter:image 메타 태그 추출
      const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
      if (twitterImageMatch?.[1]) {
        imageCacheRef.current.set(articleUrl, twitterImageMatch[1]); // 캐시에 저장
        return twitterImageMatch[1];
      }

      imageCacheRef.current.set(articleUrl, ''); // 실패도 캐시
      return null;
    } catch (err) {
      console.error(`[HN Image] 추출 중 오류:`, err);
      imageCacheRef.current.set(articleUrl, ''); // 실패도 캐시
      return null;
    }
  };

  const fetchAllNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[AI VIBE News] ========== 뉴스 피드 로드 시작 ==========');

      // 모든 RSS 피드를 병렬로 가져오기
      const fetchPromises = RSS_NEWS_SOURCES.map(async (source) => {
        try {
          console.log(`[RSS] ${source.name} 로드 시작...`);
          const proxyUrl = `${RSS_CORS_PROXY}${encodeURIComponent(source.url)}`;
          console.log(`[RSS] 프록시 URL: ${proxyUrl.substring(0, 80)}...`);

          const response = await fetchWithTimeout(proxyUrl, 8000); // 8초 타임아웃

          if (!response.ok) {
            throw new Error(`${source.name} 로드 실패: ${response.statusText}`);
          }

          const data = await response.json();

          if (!data.items || data.items.length === 0) {
            console.warn(`[RSS] ${source.name}에 아이템이 없습니다.`);
            return [];
          }

          console.log(`[RSS] ✅ ${source.name} - ${data.items.length}개 아이템 발견, ${limit}개 처리`);

          // RSS 아이템을 NewsItem 형식으로 변환
          const newsItems: NewsItem[] = await Promise.all(
            data.items.slice(0, limit).map(async (item: any, index: number) => {
              // 첫 번째 아이템의 전체 구조 로깅 (디버깅 용)
              if (index === 0) {
                console.log(`[RSS] ${source.name} - 첫 번째 아이템 구조:`, {
                  keys: Object.keys(item),
                  item: {
                    title: item.title?.substring(0, 50),
                    enclosure: item.enclosure,
                    media: item.media,
                    image: item.image?.substring(0, 80),
                    thumbnail: item.thumbnail?.substring(0, 80),
                    description: item.description?.substring(0, 50),
                    content: item.content?.substring(0, 50),
                    link: item.link,
                  },
                });
              }

              // 이미지 추출 함수 - 여러 방식으로 시도
              const extractImage = (item: any, contentHtml: string): string | undefined => {
                // 0. rss2json이 직접 제공하는 enclosure 확인 (가장 신뢰할 수 있는 소스)
                if (item.enclosure?.link) {
                  console.log('[이미지] enclosure.link에서 추출:', item.enclosure.link.substring(0, 60));
                  return item.enclosure.link;
                }

                // 0-1. rss2json의 media 필드 (배열 형태)
                if (item.media && Array.isArray(item.media) && item.media.length > 0) {
                  const mediaItem = item.media[0];
                  if (mediaItem.url) {
                    console.log('[이미지] item.media[0].url에서 추출:', mediaItem.url.substring(0, 60));
                    return mediaItem.url;
                  }
                  if (mediaItem.thumbnail) {
                    console.log('[이미지] item.media[0].thumbnail에서 추출:', mediaItem.thumbnail.substring(0, 60));
                    return mediaItem.thumbnail;
                  }
                }

                // 0-2. rss2json의 첫 번째 media 객체
                if (item.media?.url) {
                  console.log('[이미지] item.media.url에서 추출:', item.media.url.substring(0, 60));
                  return item.media.url;
                }

                if (item.media?.thumbnail) {
                  console.log('[이미지] item.media.thumbnail에서 추출:', item.media.thumbnail.substring(0, 60));
                  return item.media.thumbnail;
                }

                // 1. 직접 제공된 이미지 필드들
                if (item.image) {
                  console.log('[이미지] item.image에서 추출:', item.image.substring(0, 60));
                  return item.image;
                }

                if (item.thumbnail) {
                  console.log('[이미지] item.thumbnail에서 추출:', item.thumbnail.substring(0, 60));
                  return item.thumbnail;
                }

                if (item.picture) {
                  console.log('[이미지] item.picture에서 추출:', item.picture.substring(0, 60));
                  return item.picture;
                }

                if (!contentHtml) return undefined;

                // 2. img 태그에서 src 추출 (가장 일반적)
                const imgMatch = contentHtml.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
                if (imgMatch?.[1]) {
                  console.log('[이미지] img 태그에서 추출:', imgMatch[1].substring(0, 60));
                  return imgMatch[1];
                }

                // 3. picture 태그에서 source/img 추출
                const pictureMatch = contentHtml.match(/<picture[^>]*>[\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
                if (pictureMatch?.[1]) {
                  console.log('[이미지] picture 태그에서 추출:', pictureMatch[1].substring(0, 60));
                  return pictureMatch[1];
                }

                // 4. og:image 메타 태그 추출
                const ogMatch = contentHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
                if (ogMatch?.[1]) {
                  console.log('[이미지] og:image에서 추출:', ogMatch[1].substring(0, 60));
                  return ogMatch[1];
                }

                // 5. twitter:image 메타 태그 추출
                const twitterMatch = contentHtml.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
                if (twitterMatch?.[1]) {
                  console.log('[이미지] twitter:image에서 추출:', twitterMatch[1].substring(0, 60));
                  return twitterMatch[1];
                }

                console.log('[이미지] 추출 실패 - 모든 소스에서 이미지를 찾을 수 없음');
                return undefined;
              };

              let title = item.title || '제목 없음';
              const stripHtml = (html: string) => {
                if (!html) return '';
                return html.replace(/<[^>]*>/g, '').substring(0, 250);
              };
              const description = stripHtml(item.description || item.content || '');
              const pubDate = item.pubDate || new Date().toISOString();
              const contentHtml = item.description || item.content || '';
              
              // 제목 한글 번역 (병렬 처리로 성능 영향 최소화)
              try {
                const translatedTitle = await translateTitleToKorean(title);
                title = translatedTitle;
              } catch (err) {
                console.error('[Title Translation] 번역 중 예상치 못한 오류:', err);
                // 번역 실패해도 원본 제목 유지
              }
              
              // 이미지 추출 - 여러 소스에서 시도
              let imageUrl = extractImage(item, contentHtml);
              let imageSource = 'extracted';
              
              if (imageUrl) {
                imageSource = 'direct-extraction';
              } else {
                imageSource = 'placeholder';
              }

              // Hacker News의 경우 별도로 기사에서 og:image 추출
              if (!imageUrl && source.name === 'Hacker News' && item.link) {
                console.log(`[RSS] [HN] ${item.link}에서 이미지 추출 시도 중...`);
                imageUrl = await extractImageFromHackerNewsArticle(item.link);
                imageSource = 'hacker-news-article';
              }

              // 기본 이미지 사용
              if (!imageUrl) {
                imageUrl = `https://via.placeholder.com/400x300?text=${encodeURIComponent(source.name)}`;
                imageSource = 'placeholder';
              }

              // 이미지 URL 검증 및 최적화
              const originalImage = imageUrl;
              imageUrl = optimizeImageUrl(imageUrl);

              const newsItem: NewsItem = {
                id: `${source.name}-${index}-${Date.now()}`,
                title,
                summary: description,
                description,
                source: source.name,
                date: pubDate,
                category: source.category,
                image: imageUrl,
                url: item.link || item.url || '#',
              };

              console.log(`[RSS] ${source.name} #${index + 1}:`, {
                title: newsItem.title.substring(0, 50),
                image: {
                  source: imageSource,
                  original: originalImage.substring(0, 70),
                  optimized: imageUrl.substring(0, 70),
                },
                url: newsItem.url,
              });

              return newsItem;
            })
          );

          return newsItems;
        } catch (err) {
          console.error(`[RSS] ${source.name} 로드 실패:`, err);
          return [];
        }
      });

      // 모든 피드 로드 대기
      const allResults = await Promise.all(fetchPromises);
      
      // 모든 뉴스를 병합하고 날짜순으로 정렬
      const mergedNews = allResults
        .flat()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setNews(mergedNews);
      setLastUpdated(new Date());
      console.log(`[AI VIBE News] ✅ 총 ${mergedNews.length}개 뉴스 로드 완료`);
      console.log('[AI VIBE News] 뉴스 데이터:', mergedNews.slice(0, 3)); // 첫 3개 뉴스 출력
      console.log('[AI VIBE News] ========== 뉴스 피드 로드 완료 ==========');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load news';
      console.error('[AI VIBE News] ❌ 로드 실패:', errorMessage);
      // 오류를 무시하고 빈 배열 유지 (무한 새로고침 방지)
      setNews([]);
      setError(null); // 에러 상태 해제
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // 초기 로드 및 주기적 갱신
  useEffect(() => {
    fetchAllNews();

    // 주기적 갱신 설정
    const interval = setInterval(fetchAllNews, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllNews, refreshInterval]);

  return {
    news,
    loading,
    error,
    lastUpdated,
    refresh: fetchAllNews,
  };
};
