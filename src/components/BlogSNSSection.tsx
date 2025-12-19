import { useState, useEffect } from 'react';
import { BlogTimelineSection, getPostThumbnail } from './BlogTimelineSection';
import { BlogPost } from '@/lib/api';
import { YouTubeEmbed } from './YouTubeEmbed';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BlogSNSSectionProps {
  blogPosts: BlogPost[];
  youtubeChannelId?: string;
  isLoadingBlog?: boolean;
  blogError?: string | null;
  onRetryBlog?: () => void;
}

// CORS 프록시 목록
const YOUTUBE_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

// Blog 섹션 YouTube 영상 (고정)
// URL: https://youtu.be/A290RPBxIUw?si=21O6lD1I53Ee5v2J
const BLOG_YOUTUBE_VIDEO = {
  id: '21O6lD1I53Ee5v2J',
  title: '최신 기술 트렌드 요약',
  url: 'https://youtu.be/A290RPBxIUw?si=21O6lD1I53Ee5v2J',
  thumbnail: 'https://youtu.be/A290RPBxIUw?si=21O6lD1I53Ee5v2J/maxresdefault.jpg',
};

/**
 * YouTube RSS에서 첫 번째 영상 가져오기
 */
const fetchYouTubeVideo = async (rssUrl: string) => {
  try {
    let xmlText: string | null = null;
    
    // 여러 프록시 시도
    for (let i = 0; i < YOUTUBE_PROXIES.length; i++) {
      try {
        const proxyUrl = YOUTUBE_PROXIES[i](rssUrl);
        const response = await Promise.race([
          fetch(proxyUrl, {
            headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' }
          }),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 8000)
          ),
        ]);

        if (response.ok) {
          xmlText = await response.text();
          console.log(`[Blog YouTube RSS] 프록시 ${i + 1}에서 성공적으로 로드됨`);
          break;
        }
      } catch (err) {
        console.warn(`[Blog YouTube RSS] 프록시 ${i + 1} 실패:`, (err as Error).message);
        continue;
      }
    }

    if (!xmlText) {
      throw new Error('모든 프록시에서 실패');
    }

    // XML 파싱
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('XML 파싱 오류');
    }

    const entry = xmlDoc.getElementsByTagName('entry')[0];
    if (!entry) {
      console.warn('[Blog YouTube RSS] entry 요소 없음');
      return null;
    }

    // 제목 추출
    const titleEl = entry.getElementsByTagName('title')[0];
    const title = titleEl?.textContent || '제목 없음';

    // 비디오 ID 추출 (여러 방법 시도)
    let videoId = '';
    
    // 방법 1: 모든 요소를 순회하면서 videoId 찾기
    const allElements = entry.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.localName === 'videoId' || el.tagName.includes('videoId')) {
        videoId = el.textContent || '';
        if (videoId) {
          console.log('[Blog YouTube RSS] videoId (방법1):', videoId);
          break;
        }
      }
    }
    
    // 방법 2: id 요소에서 추출 (yt:video:XXXX 형식)
    if (!videoId) {
      const idEl = entry.getElementsByTagName('id')[0];
      const idText = idEl?.textContent || '';
      const match = idText.match(/yt:video:([a-zA-Z0-9_-]+)/);
      if (match) {
        videoId = match[1];
        console.log('[Blog YouTube RSS] videoId (방법2):', videoId);
      }
    }

    // 방법 3: link href에서 추출
    if (!videoId) {
      const links = entry.getElementsByTagName('link');
      for (let i = 0; i < links.length; i++) {
        const href = links[i].getAttribute('href') || '';
        const match = href.match(/v=([a-zA-Z0-9_-]+)/);
        if (match) {
          videoId = match[1];
          console.log('[Blog YouTube RSS] videoId (방법3):', videoId);
          break;
        }
      }
    }

    if (!videoId) {
      console.warn('[Blog YouTube RSS] videoId를 찾을 수 없음');
      return null;
    }

    // 썸네일 생성
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    console.log('[Blog YouTube RSS] ✅ 영상 로드 완료:', {
      videoId,
      title,
      url,
    });

    return { id: videoId, title, url, thumbnail };
  } catch (error) {
    console.error('[Blog YouTube RSS] 오류:', error);
    return null;
  }
};

export function BlogSNSSection({
  blogPosts,
  youtubeChannelId,
  isLoadingBlog = false,
  blogError = null,
  onRetryBlog,
}: BlogSNSSectionProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [youtubeVideo, setYoutubeVideo] = useState<any>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(true);

  // YouTube 고정 영상 로드
  useEffect(() => {
    console.log('[BlogSNSSection] YouTube 고정 영상 로드:', BLOG_YOUTUBE_VIDEO);
    setYoutubeVideo(BLOG_YOUTUBE_VIDEO);
    setYoutubeLoading(false);
  }, []);

  // 디버깅 로그
  if (process.env.NODE_ENV === 'development') {
    console.log('[BlogSNSSection] Props:', {
      blogPostsCount: blogPosts.length,
      youtubeVideoLoaded: !!youtubeVideo,
      isLoadingBlog,
      blogError,
    });
  }

  // YouTube URL 생성
  const youtubeUrl = youtubeVideo?.url || 'https://www.youtube.com/@freeCodeCamp';

  const renderLoadingState = (type: 'blog') => {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
        role="status"
        aria-label={type === 'blog' ? '블로그 게시물 로딩 중' : 'SNS 피드 로딩 중'}
        aria-busy="true"
      >
        <Loader2 className="w-8 h-8 animate-spin mb-4" aria-hidden="true" />
        <p>{type === 'blog' ? '블로그 게시물 로딩 중...' : 'SNS 피드 로딩 중...'}</p>
      </div>
    );
  };

  const renderErrorState = (type: 'blog', error: string, onRetry?: () => void) => (
    <div
      className="flex flex-col items-center justify-center py-12 text-muted-foreground"
      role="alert"
      aria-live="assertive"
      aria-label={`${type === 'blog' ? '블로그' : 'SNS'} 로딩 오류`}
    >
      <AlertCircle className="w-8 h-8 mb-4 text-destructive" aria-hidden="true" />
      <p className="mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]"
          aria-label={`${type === 'blog' ? '블로그 게시물' : 'SNS 피드'} 다시 불러오기`}
        >
          다시 시도
        </button>
      )}
    </div>
  );

  const renderBlogSection = () => {
    if (isLoadingBlog) {
      return renderLoadingState('blog');
    }

    if (blogError) {
      return renderErrorState('blog', blogError, onRetryBlog);
    }

    if (blogPosts.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center py-12 text-muted-foreground"
          role="status"
          aria-label="블로그 빈 상태"
        >
          <p>아직 블로그 게시물이 없습니다.</p>
        </div>
      );
    }

    return <BlogTimelineSection posts={blogPosts} onPostClick={(id) => {
      const post = blogPosts.find(p => p.id === id);
      if (post) setSelectedPost(post);
    }} />;
  };

  return (
    <section id="blog" className="py-10 md:py-14 px-4 bg-background" aria-labelledby="blog-social-heading">
      {/* SNS navigation anchor */}
      <div id="sns" className="absolute -mt-24" aria-hidden="true" />
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <header className="text-center mb-12 md:mb-16 animate-fade-in-up">
          <h2 id="blog-social-heading" className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
            <span className="gradient-text-animated">Blog & Social</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            최근 블로그 소식 입니다.
          </p>
        </header>

        {/* Content - Blog, YouTube Stack */}
        <div className="space-y-6 md:space-y-8">
          {/* Blog Timeline Section */}
          <section aria-labelledby="blog-section-heading">
            <h3 id="blog-section-heading" className="sr-only">
              블로그 게시물
            </h3>
            {renderBlogSection()}
          </section>

          {/* YouTube Video Section */}
          <section id="youtube" aria-labelledby="youtube-section-heading" className="mt-[50px]">
            <YouTubeEmbed 
              url={youtubeUrl} 
              title="YouTube 영상"
              className="max-w-4xl mx-auto"
            />
          </section>
        </div>
      </div>

      {/* Full Content Modal */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPost.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>{selectedPost.author || 'Won Kim'} • {selectedPost.date}</p>
              </div>
              {(selectedPost.thumbnail || selectedPost.image) && (
                <img 
                  src={selectedPost.thumbnail || selectedPost.image} 
                  alt={selectedPost.title}
                  className="w-full h-auto rounded-lg"
                />
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {selectedPost.content || selectedPost.summary}
              </div>
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {selectedPost.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-secondary rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
