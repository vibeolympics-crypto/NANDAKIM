import { useState, useEffect } from 'react';
import { BlogPost } from '@/lib/api';

const RSS_CORS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

// RSS 피드 소스별 정보 (가장 안정적인 소스)
const RSS_SOURCES = [
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', description: 'Ars Technica 뉴스', region: 'International' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', description: 'Ars Technica 뉴스', region: 'International' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', description: 'Ars Technica 뉴스', region: 'International' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', description: 'Ars Technica 뉴스', region: 'International' },
];

/**
 * 여러 RSS 피드를 병렬로 파싱하여 블로그 포스트를 가져오는 훅
 * @param rssUrls - RSS 피드 URL 배열
 * @param limit - 각 피드당 가져올 최대 포스트 수
 * @param refreshInterval - 자동 갱신 주기 (밀리초, 기본값: 30분)
 */
export const useMultipleRssFeed = (rssUrls: string[], limit: number = 3, refreshInterval: number = 30 * 60 * 1000) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllRssFeeds = async () => {
      console.log('[RSS Hook] 피드 로드 시작, URL:', rssUrls);
      try {
        setLoading(true);
        setError(null);

        // 모든 RSS 피드를 병렬로 가져오기
        const fetchPromises = rssUrls.map(async (rssUrl, feedIndex) => {
          try {
            const proxyUrl = `${RSS_CORS_PROXY}${encodeURIComponent(rssUrl)}`;
            console.log(`[RSS] 피드 #${feedIndex + 1} 로드 시작:`, rssUrl);
            console.log(`[RSS] 피드 #${feedIndex + 1} 프록시 URL:`, proxyUrl);
            
            const response = await fetch(proxyUrl);
            console.log(`[RSS] 피드 #${feedIndex + 1} 응답 상태: ${response.status}`);

            if (!response.ok) {
              throw new Error(`RSS 피드 로드 실패: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`[RSS] 피드 #${feedIndex + 1} JSON 파싱 완료, 아이템: ${data.items?.length || 0}개`);
            
            if (!data.items || data.items.length === 0) {
              console.warn(`[RSS] 피드 #${feedIndex + 1}에 아이템이 없습니다.`);
              return [];
            }

            console.log(`[RSS] 피드 #${feedIndex + 1} - ${data.items.length}개 아이템 로드, ${limit}개만 처리`);

            // RSS 아이템을 BlogPost 형식으로 변환
            const feedPosts: BlogPost[] = data.items.slice(0, limit).map((item: any, index: number) => {
              // HTML 태그 제거
              const stripHtml = (html: string) => {
                if (!html) return '';
                return html.replace(/<[^>]*>/g, '').substring(0, 200);
              };

              // 이미지 추출 함수
              const extractImageFromContent = (html: string): string | undefined => {
                if (!html) {
                  return undefined;
                }
                
                // img 태그에서 src 추출 (data-src 포함)
                const imgMatch = html.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
                if (imgMatch?.[1]) {
                  console.log(`[RSS] 피드 #${feedIndex + 1} 아이템 #${index + 1} 이미지 (img 태그):`, imgMatch[1]);
                  return imgMatch[1];
                }
                
                // picture 태그에서 src 추출
                const pictureMatch = html.match(/<picture[^>]*>[\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
                if (pictureMatch?.[1]) {
                  console.log(`[RSS] 피드 #${feedIndex + 1} 아이템 #${index + 1} 이미지 (picture 태그):`, pictureMatch[1]);
                  return pictureMatch[1];
                }

                // og:image 메타 태그 추출
                const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
                if (ogMatch?.[1]) {
                  console.log(`[RSS] 피드 #${feedIndex + 1} 아이템 #${index + 1} 이미지 (og:image):`, ogMatch[1]);
                  return ogMatch[1];
                }

                // data-src만 있는 경우
                const dataSrcMatch = html.match(/data-src=["']([^"']+)["']/i);
                if (dataSrcMatch?.[1]) {
                  console.log(`[RSS] 피드 #${feedIndex + 1} 아이템 #${index + 1} 이미지 (data-src):`, dataSrcMatch[1]);
                  return dataSrcMatch[1];
                }

                return undefined;
              };

              const title = item.title || '제목 없음';
              const description = stripHtml(item.description || item.content || '');
              const pubDate = item.pubDate || new Date().toISOString();
              const contentHtml = item.description || item.content || '';
              
              // 이미지 추출 - 여러 소스에서 시도
              const getImageUrl = (): string | undefined => {
                // 1. HTML 콘텐츠에서 이미지 추출
                const imageFromContent = extractImageFromContent(contentHtml);
                if (imageFromContent) return imageFromContent;

                // 2. 다양한 이미지 필드 확인
                const imageSources = [
                  item.image,
                  item.thumbnail,
                  item.media,
                  item['media:content'],
                  item.imageUrl,
                  item.image_url,
                  item.imageurl,
                ];

                for (const source of imageSources) {
                  if (source) {
                    if (typeof source === 'string') {
                      return source;
                    }
                    if (typeof source === 'object' && source.url) {
                      return source.url;
                    }
                    if (typeof source === 'object' && source.$) {
                      return source.$;
                    }
                  }
                }

                // 3. enclosure 확인 (이미지 타입만)
                if (item.enclosure) {
                  const enclosure = Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure;
                  if (enclosure?.url && enclosure?.type?.startsWith('image/')) {
                    return enclosure.url;
                  }
                }

                return undefined;
              };

              let imageUrl = getImageUrl();

              // 상대경로 이미지는 절대경로로 변환
              if (imageUrl && imageUrl.startsWith('/')) {
                try {
                  const domain = new URL(rssUrl).origin;
                  imageUrl = domain + imageUrl;
                  console.log(`[RSS] 피드 #${feedIndex + 1} 아이템 #${index + 1} 상대경로 → 절대경로:`, imageUrl);
                } catch (e) {
                  console.error(`[RSS] 피드 #${feedIndex + 1} URL 변환 실패:`, e);
                }
              }

              // 모든 외부 이미지에 CORS 프록시 적용
              if (imageUrl && !imageUrl.includes('placeholder') && imageUrl.startsWith('http')) {
                const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=600&h=400&fit=cover&q=80`;
                console.log(`[RSS] 피드 #${feedIndex + 1} 아이템 #${index + 1} 프록시 적용:`, proxyUrl);
                imageUrl = proxyUrl;
              }

              // 피드 소스명 설정
              const sourceName = RSS_SOURCES[feedIndex]?.name || 'AI News';

              const post = {
                id: `news-feed-${feedIndex}-${index}`,
                title: title,
                summary: description,
                excerpt: description,
                content: description,
                author: sourceName, // 피드 소스명 설정
                date: new Date(pubDate).toISOString().split('T')[0],
                category: 'AI News',
                tags: item.categories || ['AI', 'News'],
                image: imageUrl || '/placeholder.svg',
                readTime: Math.ceil(description.length / 200),
                featured: feedIndex === 0 && index === 0, // 첫 번째 피드의 첫 항목을 featured로 설정
                status: 'published',
                url: item.link || '#'
              };

              console.log(`[RSS] 피드 #${feedIndex + 1} 게시물 #${index + 1}: ${post.title.substring(0, 50)}... [${post.author}]`);
              
              return post;
            });

            console.log(`[RSS] 피드 #${feedIndex + 1} 최종 반환: ${feedPosts.length}개 게시물`);
            return feedPosts;
          } catch (err) {
            console.error(`[RSS] 피드 #${feedIndex + 1} 오류 발생:`, err);
            return [];
          }
        });

        // 모든 Promise 완료 대기
        const results = await Promise.all(fetchPromises);
        
        // 각 피드별 결과 로깅
        results.forEach((feedPosts, idx) => {
          console.log(`[RSS] 피드 #${idx + 1} 처리 결과: ${feedPosts.length}개 게시물`);
        });
        
        // 모든 피드의 포스트를 하나의 배열로 병합
        const mergedPosts: BlogPost[] = [];
        results.forEach(feedPosts => {
          mergedPosts.push(...feedPosts);
        });

        // 날짜순으로 정렬 (최신순)
        mergedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log(`[RSS] ✅ 최종: ${mergedPosts.length}개 뉴스 로드 (${results.map((r, i) => `피드${i + 1}:${r.length}`).join(', ')})`);
        console.log('[RSS] 최종 포스트:', mergedPosts.map(p => ({ title: p.title, date: p.date, author: p.author })));
        setPosts(mergedPosts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'RSS 피드를 가져오는 중 오류가 발생했습니다';
        setError(errorMessage);
        console.error('[RSS] 전체 피드 파싱 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    if (rssUrls && rssUrls.length > 0) {
      // 초기 로드
      fetchAllRssFeeds();

      // 자동 갱신 타이머 설정
      const intervalId = setInterval(() => {
        console.log('[RSS] 자동 갱신 시작...');
        fetchAllRssFeeds();
      }, refreshInterval);

      // 언마운트 또는 의존성 변경 시 타이머 정리
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [rssUrls, limit, refreshInterval]); // 직접 rssUrls 배열 비교 (메모이제이션된 배열 사용)

  return { posts, loading, error };
};
