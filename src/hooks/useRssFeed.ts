import { useState, useEffect } from 'react';
import { BlogPost } from '@/lib/api';

// API 베이스 URL (개발/프로덕션 환경 지원)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 자체 프록시 사용 (보안상 외부 프록시 사용 금지)
const getProxyUrl = (url: string): string => {
  return `${API_BASE}/api/proxy/rss?url=${encodeURIComponent(url)}`;
};

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
      const loadLocalBlogData = async () => {
        try {
          const response = await fetch('/blog.json');
          if (response.ok) {
            const data = await response.json();
            setPosts(data.posts || []);
          } else {
            setPosts([]);
          }
        } catch {
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

        // 자체 프록시로 RSS 피드 가져오기
        try {
          const proxyUrl = getProxyUrl(rssUrl);

          const response = await fetch(proxyUrl, {
            headers: {
              'Accept': 'application/rss+xml, application/xml, text/xml',
            }
          });

          if (response.ok) {
            xmlText = await response.text();
          } else {
            throw new Error(`프록시 응답 오류: ${response.status}`);
          }
        } catch (err) {
          throw err instanceof Error ? err : new Error('RSS 피드 가져오기 실패');
        }

        if (!xmlText) {
          throw new Error('RSS 피드를 가져올 수 없습니다');
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
      } catch {
        // RSS 피드 로드 실패 시 로컬 블로그 데이터 로드 시도
        try {
          const response = await fetch('/blog.json');
          if (response.ok) {
            const data = await response.json();
            setPosts(data.posts || []);
          } else {
            setPosts([]);
          }
        } catch {
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
