import { useState, useEffect } from 'react';
import { BlogPost } from '@/lib/api';

// CORS 프록시 서비스 목록
// 프로덕션에서는 VITE_RSS_PROXY_URL 환경변수로 자체 프록시 설정 권장
const RSS_PROXIES = [
  // 자체 프록시가 설정되어 있으면 최우선 사용
  ...(import.meta.env.VITE_RSS_PROXY_URL 
    ? [(url: string) => `${import.meta.env.VITE_RSS_PROXY_URL}?url=${encodeURIComponent(url)}`]
    : []),
  // 폴백: 외부 프록시 서비스 (안정적인 서비스만 유지, Heroku 제거)
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

/**
 * RSS 피드를 파싱하여 블로그 포스트를 가져오는 훅
 * @param rssUrl - RSS 피드 URL
 * @param limit - 가져올 최대 포스트 수
 */
export const useRssFeed = (rssUrl: string, limit: number = 10) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // RSS URL이 없으면 로컬 블로그 데이터 로드 시도
    if (!rssUrl) {
      console.log('[RSS] RSS URL이 없음. 로컬 블로그 데이터 로드 시도...');
      const loadLocalBlogData = async () => {
        try {
          const response = await fetch('/blog.json');
          if (response.ok) {
            const data = await response.json();
            console.log('[RSS] ✅ 로컬 블로그 데이터 로드 성공:', data.posts?.length || 0, '개');
            setPosts(data.posts || []);
          } else {
            console.warn('[RSS] 로컬 블로그 데이터 HTTP 오류:', response.status);
            setPosts([]);
          }
        } catch (err) {
          console.warn('[RSS] 로컬 블로그 데이터 로드 실패:', err);
          setPosts([]);
        } finally {
          setLoading(false);
        }
      };
      loadLocalBlogData();
      return;
    }

    const fetchRssFeed = async () => {
      try {
        setLoading(true);
        setError(null);

        let xmlText: string | null = null;
        let lastError: Error | null = null;

        // 여러 프록시 시도
        for (let i = 0; i < RSS_PROXIES.length; i++) {
          try {
            const proxyUrl = RSS_PROXIES[i](rssUrl);
            console.log(`[RSS] 프록시 ${i + 1} 시도: ${proxyUrl.substring(0, 50)}...`);
            
            const response = await fetch(proxyUrl, {
              headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml',
              }
            });

            if (response.ok) {
              xmlText = await response.text();
              console.log(`[RSS] 프록시 ${i + 1} 성공!`);
              break;
            }
          } catch (err) {
            lastError = err instanceof Error ? err : new Error('Unknown error');
            console.warn(`[RSS] 프록시 ${i + 1} 실패:`, lastError.message);
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
          throw new Error('RSS 피드 파싱 오류');
        }

        const items = xmlDoc.getElementsByTagName('item');
        if (items.length === 0) {
          throw new Error('RSS 피드에 아이템이 없습니다');
        }

        // RSS 아이템을 BlogPost 형식으로 변환
        const parsedPosts: BlogPost[] = Array.from(items).slice(0, limit).map((item: any, index: number) => {
          // HTML 태그 제거
          const stripHtml = (html: string) => {
            if (!html) return '';
            return html.replace(/<[^>]*>/g, '').substring(0, 200);
          };

          // XML에서 텍스트 추출
          const getElementText = (element: Element, tagName: string): string => {
            const el = element.getElementsByTagName(tagName)[0];
            return el?.textContent || '';
          };

          // 이미지 추출 함수
          const extractImageFromContent = (html: string): string | undefined => {
            if (!html) {
              return undefined;
            }
            
            // img 태그에서 src 추출
            const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch?.[1]) {
              return imgMatch[1];
            }
            
            // picture 태그에서 src 추출
            const pictureMatch = html.match(/<picture[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
            if (pictureMatch?.[1]) {
              return pictureMatch[1];
            }
            
            return undefined;
          };

          const title = getElementText(item, 'title') || '제목 없음';
          const description = getElementText(item, 'description') || getElementText(item, 'content:encoded') || '';
          const contentHtml = description;
          const descriptionText = stripHtml(description);
          const pubDate = getElementText(item, 'pubDate') || new Date().toISOString();
          const link = getElementText(item, 'link') || '#';
          const author = getElementText(item, 'author') || getElementText(item, 'creator') || '작성자';
          
          let imageUrl = extractImageFromContent(contentHtml);

          // CORS 프록시를 통해 이미지 로드 (Naver 이미지 CORS 제한 우회)
          if (imageUrl && imageUrl.includes('blogthumb.pstatic.net')) {
            imageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}`;
          }

          const post = {
            id: `blog-rss-${index}`,
            title: title,
            summary: descriptionText,
            excerpt: descriptionText,
            content: descriptionText,
            author: author,
            date: new Date(pubDate).toISOString().split('T')[0],
            category: '블로그',
            tags: ['블로그'],
            image: imageUrl || '/placeholder.svg',
            readTime: Math.ceil(descriptionText.length / 200),
            featured: index === 0, // 첫 번째 항목을 featured로 설정
            status: 'published',
            url: link
          };
          
          return post;
        });

        setPosts(parsedPosts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'RSS 피드를 가져오는 중 오류가 발생했습니다';
        console.warn('[RSS] RSS 피드 로드 실패:', errorMessage);
        console.log('[RSS] 로컬 블로그 데이터 로드 시도...');
        
        // RSS 피드 로드 실패 시 로컬 블로그 데이터 로드 시도
        try {
          const response = await fetch('/blog.json');
          if (response.ok) {
            const data = await response.json();
            console.log('[RSS] ✅ 로컬 블로그 데이터 로드 성공:', data.posts?.length || 0, '개');
            setPosts(data.posts || []);
          } else {
            console.warn('[RSS] 로컬 블로그 데이터 HTTP 오류:', response.status);
            setPosts([]);
          }
        } catch (localErr) {
          console.warn('[RSS] 로컬 블로그 데이터 로드도 실패:', localErr);
          setPosts([]);
        }
        setError(null); // 에러 상태 해제 (블로그 데이터 표시 가능하도록)
      } finally {
        setLoading(false);
      }
    };

    if (rssUrl) {
      fetchRssFeed();
    }
  }, [rssUrl, limit]);

  return { posts, loading, error };
};
