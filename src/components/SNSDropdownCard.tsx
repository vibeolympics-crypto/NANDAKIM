import { useState, useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CardGlow, type Platform, type GlowIntensity } from './CardGlow';
import { Twitter, Instagram, Youtube, Heart, MessageCircle, Share2 } from 'lucide-react';
import { ThreadsIcon } from './icons/ThreadsIcon';

/**
 * Represents a social media feed item from various platforms.
 *
 * @interface SNSFeed
 * @property {string} id - Unique identifier for the feed item
 * @property {Platform} platform - Social media platform (twitter, threads, instagram, youtube)
 * @property {string} content - Text content of the post
 * @property {string} [image] - Optional image URL
 * @property {string} [video] - Optional video URL
 * @property {string} url - Link to the original post
 * @property {string} timestamp - ISO 8601 timestamp of when the post was created
 * @property {number} [likes] - Number of likes/reactions
 * @property {number} [comments] - Number of comments
 * @property {number} [shares] - Number of shares/retweets
 */
export interface SNSFeed {
  id: string;
  platform: Platform;
  content: string;
  image?: string;
  video?: string;
  url: string;
  timestamp: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

/**
 * Props for the SNSDropdownCard component.
 *
 * @interface SNSDropdownCardProps
 * @property {string} id - Unique identifier for the card
 * @property {SNSFeed} data - Social media feed data to display
 * @property {Platform} platform - Platform type for styling and icons
 * @property {boolean} isExpanded - Whether the card is currently expanded
 * @property {function} onToggle - Callback when card expansion state changes
 * @property {boolean} [reducedMotion] - Optional override for reduced motion preference
 */
interface SNSDropdownCardProps {
  id: string;
  data: SNSFeed;
  platform: Platform;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  reducedMotion?: boolean; // Optional, will use hook if not provided
  isFirst?: boolean; // Whether this is the first card in the column
}

/**
 * Maps platform names to their corresponding Lucide icon components.
 * @constant
 */
const PLATFORM_ICONS = {
  twitter: Twitter,
  threads: ThreadsIcon,
  instagram: Instagram,
  youtube: Youtube,
} as const;

/**
 * Platform brand colors
 * @constant
 */
const PLATFORM_COLORS = {
  twitter: '#1DA1F2', // Twitter Blue
  threads: '#000000', // Threads Black
  instagram: '#E4405F', // Instagram Pink/Red
  youtube: '#FF0000', // YouTube Red
} as const;

/**
 * SNSDropdownCard - A dropdown card component for displaying social media posts.
 *
 * Features:
 * - Hover-based expansion with smooth animations
 * - Platform-specific glow effects and colors
 * - Blur effects that fade on interaction
 * - Keyboard navigation support (Tab, Enter, Space)
 * - Touch device support with tap-to-toggle
 * - Auto-collapse after focus loss (2 seconds)
 * - Theme-aware styling (light/dark mode)
 * - Reduced motion support for accessibility
 * - GPU-accelerated animations for performance
 * - WCAG 2.1 AA compliant with ARIA labels
 *
 * @component
 * @example
 * ```tsx
 * <SNSDropdownCard
 *   id="post-123"
 *   data={snsFeedData}
 *   platform="twitter"
 *   isExpanded={false}
 *   onToggle={(id) => handleToggle(id)}
 * />
 * ```
 *
 * @param {SNSDropdownCardProps} props - Component props
 * @returns {JSX.Element} Rendered dropdown card
 */
export const SNSDropdownCard = memo(function SNSDropdownCard({
  id,
  data,
  platform,
  isExpanded,
  onToggle,
  reducedMotion: reducedMotionProp,
  isFirst = false,
}: SNSDropdownCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [wasExpandedByTouch, setWasExpandedByTouch] = useState(false);

  // Use theme hook from next-themes
  const { theme: nextTheme, resolvedTheme } = useTheme();
  const theme = (resolvedTheme || nextTheme || 'dark') as 'light' | 'dark';

  // Use reduced motion hook
  const reducedMotionHook = useReducedMotion();
  const reducedMotion = reducedMotionProp !== undefined ? reducedMotionProp : reducedMotionHook;

  // Clear collapse timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Handle auto-collapse after focus loss
  useEffect(() => {
    if (!isFocused && isExpanded) {
      collapseTimeoutRef.current = setTimeout(() => {
        onToggle(id);
      }, 2000);
    } else if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, [isFocused, isExpanded, id, onToggle]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Always expand on hover (supports both up and down transitions)
    if (!isExpanded) {
      onToggle(id);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Collapse on mouse leave
    if (isExpanded && !isFocused) {
      onToggle(id);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Detect if this is a touch event
    const isTouchEvent = e.nativeEvent && 'touches' in e.nativeEvent;

    if (isTouchEvent) {
      setWasExpandedByTouch(true);
    }

    onToggle(id);
  };

  // Calculate visual states
  const isActive = isHovered || isFocused || isExpanded;
  const glowIntensity: GlowIntensity = isActive ? 'enhanced' : 'dim';

  // Remove blur effect completely
  const blurAmount = 0;

  // Full opacity for all cards
  const opacity = 1;

  const PlatformIcon = PLATFORM_ICONS[platform];
  const brandColor = PLATFORM_COLORS[platform];

  /**
   * Formats a timestamp into a human-readable relative time string.
   *
   * @param {string} timestamp - ISO 8601 timestamp
   * @returns {string} Formatted time string (e.g., "2시간 전", "3일 전")
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  /**
   * Truncates content to a maximum length for compact view display.
   *
   * @param {string} content - Full content text
   * @param {number} [maxLength=100] - Maximum character length
   * @returns {string} Truncated content with ellipsis if needed
   */
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Get platform display name
  const platformDisplayName = {
    twitter: 'Twitter',
    threads: 'Threads',
    instagram: 'Instagram',
    youtube: 'YouTube',
  }[platform];

  return (
    <CardGlow intensity={glowIntensity} platform={platform} theme={theme} isActive={isActive}>
      <div
        ref={cardRef}
        className={`sns-dropdown-card relative bg-card text-card-foreground rounded-xl overflow-hidden cursor-pointer
          transition-all ${reducedMotion ? 'duration-0' : 'duration-300 ease-in-out'}
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
          min-h-[44px] min-w-[44px]
          border-2 ${isActive ? 'border-primary/40 shadow-xl' : 'border-border/50 shadow-md'}
          hover:shadow-2xl hover:border-primary/60
          ${isActive ? 'scale-[1.02]' : 'scale-100'}`}
        style={{
          opacity,
          transform: isExpanded ? 'translateY(0)' : 'translateY(0)',
          willChange: isActive && !reducedMotion ? 'transform, box-shadow' : 'auto',
          contain: 'layout style paint',
          transformOrigin: 'top center',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        tabIndex={0}
        role="article"
        aria-expanded={isExpanded}
        aria-label={`${platformDisplayName} 게시물${isExpanded ? ' 확장됨' : ''}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`}
        aria-describedby={`sns-card-time-${id}`}
        data-testid={`sns-card-${id}`}
        data-platform={platform}
        data-expanded={isExpanded}
      >
        <div className="p-5">
          {/* Compact View */}
          <div className="compact-view">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0" aria-hidden="true">
                <PlatformIcon className="w-5 h-5" style={{ color: brandColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2" role="text">
                  {isExpanded ? data.content : truncateContent(data.content)}
                </p>
                <time
                  id={`sns-card-time-${id}`}
                  className="text-xs text-muted-foreground mt-1 block"
                  dateTime={data.timestamp}
                >
                  {formatTimestamp(data.timestamp)}
                </time>
              </div>
            </div>
          </div>

          {/* Expanded View */}
          {isExpanded && (
            <div
              className={`expanded-view mt-4 pt-4 border-t border-border
                  ${reducedMotion ? '' : 'animate-fade-in'}`}
              role="region"
              aria-label="확장된 게시물 상세 정보"
            >
              {/* Full content is already shown above */}

              {/* Media */}
              {data.image && (
                <figure className="mt-3 rounded-md overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={data.image}
                    alt={`${platformDisplayName} 게시물 이미지`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width="600"
                    height="338"
                  />
                </figure>
              )}

              {/* Engagement Metrics */}
              {(data.likes !== undefined ||
                data.comments !== undefined ||
                data.shares !== undefined) && (
                  <div
                    className="flex items-center gap-4 mt-3 text-sm text-muted-foreground"
                    role="group"
                    aria-label="참여 지표"
                  >
                    {data.likes !== undefined && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" aria-hidden="true" />
                        <span aria-label={`좋아요 ${data.likes.toLocaleString()}개`}>
                          {data.likes.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {data.comments !== undefined && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                        <span aria-label={`댓글 ${data.comments.toLocaleString()}개`}>
                          {data.comments.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {data.shares !== undefined && (
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" aria-hidden="true" />
                        <span aria-label={`공유 ${data.shares.toLocaleString()}개`}>
                          {data.shares.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

              {/* Link to original post */}
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  // Prevent card toggle when interacting with link
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                aria-label={`${platformDisplayName}에서 원본 게시물 보기 (새 창에서 열림)`}
              >
                원본 게시물 보기 →
              </a>
            </div>
          )}
        </div>

        {/* Live region for screen reader announcements */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {isExpanded && `${platformDisplayName} 게시물이 확장되었습니다.`}
          {!isExpanded && wasExpandedByTouch && `${platformDisplayName} 게시물이 축소되었습니다.`}
        </div>
      </div>
    </CardGlow>
  );
});
