import { useState } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import { BlogPost } from '@/lib/api';

interface BlogTimelineSectionProps {
  posts: BlogPost[];
  onPostClick?: (postId: string) => void;
}

const INITIAL_VISIBLE_COUNT = 6;

const markdownImageRegex = /!\[[^\]]*\]\((.*?)\)/;
const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/i;

const getFirstImageFromContent = (content?: string) => {
  if (!content) return undefined;
  const htmlMatch = content.match(htmlImageRegex);
  if (htmlMatch?.[1]) {
    return htmlMatch[1];
  }

  const markdownMatch = content.match(markdownImageRegex);
  return markdownMatch?.[1];
};

export const getPostThumbnail = (post: BlogPost) => {
  return post.image || getFirstImageFromContent(post.content);
};

export function BlogTimelineSection({ posts, onPostClick }: BlogTimelineSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Determine which posts to display
  const visiblePosts = showAll ? sortedPosts : sortedPosts.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMorePosts = sortedPosts.length > INITIAL_VISIBLE_COUNT;

  // 이미지 로딩 실패 처리
  const handleImageError = (postId: string) => {
    setFailedImages(prev => new Set([...prev, postId]));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  };

  const handlePostClick = (post: BlogPost) => {
    // RSS 피드 게시물인 경우 (id가 'blog-rss-'로 시작) - 외부 링크로 열기
    if (post.id.startsWith('blog-rss-') && post.url && post.url !== '#') {
      window.open(post.url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // 로컬 블로그 게시물인 경우 - onPostClick 콜백 사용
    if (onPostClick) {
      onPostClick(post.id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Blog posts grid - 2 columns */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        role="feed"
        aria-label="블로그 피드"
      >
        {visiblePosts.map((post, index) => {
          const displayText = post.excerpt || post.summary || '';
          const readTimeText = post.readTime ? `${post.readTime}분` : '';
          const thumbnail = getPostThumbnail(post);

          return (
            <article
              key={post.id}
              className="group bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer stagger-item"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
              onClick={() => handlePostClick(post)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePostClick(post);
                }
              }}
              tabIndex={0}
              role="article"
              aria-posinset={index + 1}
              aria-setsize={sortedPosts.length}
              aria-label={`${post.title} - ${formatDate(post.date)}`}
            >
              <div className="flex gap-4 p-4">
                {/* Thumbnail - Left side */}
                <div className="flex-shrink-0 w-32 h-32 bg-muted rounded-lg overflow-hidden">
                  {thumbnail && !failedImages.has(post.id) ? (
                    <img
                      src={thumbnail}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={() => handleImageError(post.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-4xl font-bold text-primary/30">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content - Right side */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  {/* Meta information */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                    </div>
                    {readTimeText && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{readTimeText} 읽기</span>
                      </div>
                    )}
                  </div>

                  {/* Excerpt */}
                  <p className="text-sm text-foreground/70 line-clamp-2 flex-1 mb-3">{displayText}</p>

                  {/* More Indicator */}
                  <div className="flex justify-end mt-auto">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary rounded-full bg-primary/5 px-3 py-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <span>전체보기</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Show More button */}
      {hasMorePosts && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 py-3 text-foreground hover:text-primary transition-colors duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded min-h-[44px]"
            aria-label={
              showAll
                ? '블로그 게시물 접기'
                : `${sortedPosts.length - INITIAL_VISIBLE_COUNT}개의 블로그 게시물 더보기`
            }
            aria-expanded={showAll}
          >
            {showAll ? (
              <>
                <span>접기</span>
                <ChevronUp className="w-5 h-5" aria-hidden="true" />
              </>
            ) : (
              <>
                <span>더보기</span>
                <ChevronDown className="w-5 h-5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
