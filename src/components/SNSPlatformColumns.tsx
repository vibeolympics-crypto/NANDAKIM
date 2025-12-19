import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SNSDropdownCard, type SNSFeed } from './SNSDropdownCard';
import { type Platform } from './CardGlow';

/**
 * Props for the SNSPlatformColumns component.
 *
 * @interface SNSPlatformColumnsProps
 * @property {SNSFeed[]} feeds - Array of social media feed items to display
 * @property {function} [onCardInteraction] - Optional callback when cards are expanded/collapsed
 */
interface SNSPlatformColumnsProps {
  feeds: SNSFeed[];
  onCardInteraction?: (id: string, action: 'expand' | 'collapse') => void;
}

/**
 * Props for the PlatformColumn sub-component.
 *
 * @interface PlatformColumnProps
 * @property {Platform} platform - Platform type for this column
 * @property {SNSFeed[]} feeds - All feed items (will be filtered by platform)
 * @property {number} [maxItems] - Maximum items to display per column
 * @property {string | null} expandedCardId - ID of currently expanded card
 * @property {function} onToggle - Callback to toggle card expansion
 * @property {boolean} reducedMotion - Whether reduced motion is enabled
 */
interface PlatformColumnProps {
  platform: Platform;
  feeds: SNSFeed[];
  maxItems?: number;
  expandedCardId: string | null;
  onToggle: (id: string) => void;
  reducedMotion: boolean;
}

/**
 * Maps platform identifiers to their display names.
 * @constant
 */
const PLATFORM_NAMES = {
  twitter: 'Twitter',
  threads: 'Threads',
  instagram: 'Instagram',
  youtube: 'YouTube',
} as const;

/**
 * Platform icon components from lucide-react
 */
import { Twitter, Instagram, Youtube } from 'lucide-react';
import { ThreadsIcon } from './icons/ThreadsIcon';

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

// Keep platform ordering aligned with the grid so "first card" is predictable
const PLATFORM_ORDER: Platform[] = ['twitter', 'threads', 'instagram', 'youtube'];

type PlatformState = Record<Platform, string | null>;

const createEmptyPlatformState = (): PlatformState =>
  PLATFORM_ORDER.reduce((acc, platform) => {
    acc[platform] = null;
    return acc;
  }, {} as PlatformState);

// Pick the first feed per platform so we can keep it expanded by default
const getDefaultExpandedIds = (feeds: SNSFeed[]): PlatformState => {
  const defaults = createEmptyPlatformState();

  PLATFORM_ORDER.forEach((platform) => {
    const match = feeds.find((feed) => feed.platform === platform);
    defaults[platform] = match?.id ?? null;
  });

  return defaults;
};

/**
 * PlatformColumn - Displays SNS cards for a single platform in a vertical column.
 *
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Empty state handling
 * - Performance optimization with CSS containment
 * - Accessible with proper ARIA labels
 *
 * @component
 * @param {PlatformColumnProps} props - Component props
 * @returns {JSX.Element} Rendered platform column
 */
function PlatformColumn({
  platform,
  feeds,
  maxItems = 12,
  expandedCardId,
  onToggle,
  reducedMotion,
}: PlatformColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Use IntersectionObserver for lazy animation setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, we can disconnect the observer
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before entering viewport
        threshold: 0.1,
      }
    );

    if (columnRef.current) {
      observer.observe(columnRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Filter feeds for this platform and limit to maxItems
  const platformFeeds = feeds.filter((feed) => feed.platform === platform).slice(0, maxItems);

  // Empty state
  if (platformFeeds.length === 0) {
    return (
      <section
        ref={columnRef}
        className="platform-column"
        data-platform={platform}
        style={{ contain: 'layout style paint' }}
        aria-labelledby={`platform-header-${platform}`}
      >
        <header className="platform-column-header mb-4">
          <h3 id={`platform-header-${platform}`} className="text-lg font-semibold text-foreground">
            {PLATFORM_NAMES[platform]}
          </h3>
        </header>
        <div
          className="empty-state p-6 text-center text-muted-foreground bg-card/50 rounded-lg border border-border"
          role="status"
          aria-label={`${PLATFORM_NAMES[platform]} 빈 상태`}
        >
          <p className="text-sm">아직 {PLATFORM_NAMES[platform]} 게시물이 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={columnRef}
      className="platform-column"
      data-platform={platform}
      style={{ contain: 'layout style paint' }}
      aria-labelledby={`platform-header-${platform}`}
    >
      <header className="platform-column-header mb-6">
        <div className="flex items-center gap-3">
          {/* Platform Icon */}
          {(() => {
            const Icon = PLATFORM_ICONS[platform];
            const brandColor = PLATFORM_COLORS[platform];
            return (
              <div
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${brandColor}15`, // 15 = ~8% opacity in hex
                }}
              >
                <Icon className="w-5 h-5" style={{ color: brandColor }} aria-hidden="true" />
              </div>
            );
          })()}
          <div>
            <h3
              id={`platform-header-${platform}`}
              className="text-lg font-semibold text-foreground"
            >
              {PLATFORM_NAMES[platform]}
            </h3>
            <p
              className="text-xs text-muted-foreground"
              aria-label={`${platformFeeds.length}개의 ${PLATFORM_NAMES[platform]} 게시물`}
            >
              {platformFeeds.length}개의 게시물
            </p>
          </div>
        </div>
      </header>
      <div
        className="platform-column-content space-y-4"
        role="feed"
        aria-busy={!isVisible && !reducedMotion}
        aria-label={`${PLATFORM_NAMES[platform]} 게시물 목록`}
      >
        {/* Render cards directly to avoid visibility issues on mobile */}
        {platformFeeds.map((feed, index) => (
          <SNSDropdownCard
            key={feed.id}
            id={feed.id}
            data={feed}
            platform={feed.platform}
            isExpanded={expandedCardId === feed.id}
            onToggle={onToggle}
            reducedMotion={reducedMotion}
            isFirst={index === 0}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * SNSPlatformColumns - Organizes social media feeds into platform-specific columns.
 *
 * Features:
 * - Responsive grid layout (4 columns desktop, 2 tablet, 1 mobile)
 * - Single card expansion constraint
 * - Outside click detection for collapsing
 * - Lazy loading for performance
 * - Accessible with ARIA labels and live regions
 * - Theme-aware styling
 * - Reduced motion support
 *
 * Layout Breakpoints:
 * - Mobile (320px-767px): 1 column
 * - Tablet (768px-1023px): 2 columns
 * - Desktop (1024px+): 4 columns
 *
 * @component
 * @example
 * ```tsx
 * <SNSPlatformColumns
 *   feeds={snsFeeds}
 *   onCardInteraction={(id, action) => handleCardInteraction(id, action)}
 * />
 * ```
 *
 * @param {SNSPlatformColumnsProps} props - Component props
 * @returns {JSX.Element} Rendered platform columns grid
 */
export function SNSPlatformColumns({ feeds, onCardInteraction }: SNSPlatformColumnsProps) {
  const [defaultExpandedIds, setDefaultExpandedIds] = useState<PlatformState>(() =>
    getDefaultExpandedIds(feeds)
  );
  const [expandedIds, setExpandedIds] = useState<PlatformState>(() => getDefaultExpandedIds(feeds));

  // Use reduced motion hook
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const defaults = getDefaultExpandedIds(feeds);
    setDefaultExpandedIds(defaults);
    setExpandedIds((prev) => {
      const next = { ...prev };
      let changed = false;

      PLATFORM_ORDER.forEach((platform) => {
        const current = prev[platform];
        const fallback = defaults[platform];

        if (current && feeds.some((feed) => feed.id === current)) {
          return;
        }

        if (fallback !== current) {
          next[platform] = fallback;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [feeds]);

  // Handle outside click to collapse expanded card
  useEffect(() => {
    const hasExpanded = PLATFORM_ORDER.some((platform) => expandedIds[platform]);
    if (!hasExpanded) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside any SNS card
      const clickedCard = target.closest('.sns-dropdown-card');

      if (!clickedCard) {
        const pendingInteractions: { id: string; action: 'expand' | 'collapse' }[] = [];
        setExpandedIds((prev) => {
          const next = { ...prev };
          let changed = false;

          PLATFORM_ORDER.forEach((platform) => {
            const current = prev[platform];
            const fallback = defaultExpandedIds[platform];

            if (current === fallback) {
              return;
            }

            if (current) {
              pendingInteractions.push({ id: current, action: 'collapse' });
            }

            if (fallback) {
              pendingInteractions.push({ id: fallback, action: 'expand' });
            }

            next[platform] = fallback;
            changed = true;
          });

          return changed ? next : prev;
        });

        if (onCardInteraction && pendingInteractions.length) {
          pendingInteractions.forEach(({ id, action }) => onCardInteraction(id, action));
        }
      }
    };

    // Add listeners for both mouse and touch events
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [expandedIds, onCardInteraction, defaultExpandedIds]);

  const handleToggle = (platform: Platform, id: string) => {
    let pendingInteractions: { id: string; action: 'expand' | 'collapse' }[] = [];

    setExpandedIds((prev) => {
      const current = prev[platform];

      if (current === id) {
        const fallback = defaultExpandedIds[platform];
        if (!fallback || fallback === id) {
          return prev;
        }

        pendingInteractions = [
          { id, action: 'collapse' },
          { id: fallback, action: 'expand' },
        ];

        return {
          ...prev,
          [platform]: fallback,
        };
      }

      const updated: PlatformState = {
        ...prev,
        [platform]: id,
      };

      pendingInteractions = [];
      if (current) {
        pendingInteractions.push({ id: current, action: 'collapse' });
      }
      pendingInteractions.push({ id, action: 'expand' });

      return updated;
    });

    if (onCardInteraction && pendingInteractions.length) {
      pendingInteractions.forEach(({ id: feedId, action }) => onCardInteraction(feedId, action));
    }
  };

  const liveAnnouncement = PLATFORM_ORDER.map((platform) => expandedIds[platform]).find(
    (id): id is string => Boolean(id)
  )
    ? '게시물이 확장되었습니다.'
    : '';

  return (
    <div
      className="sns-platform-columns"
      data-testid="sns-platform-columns"
      role="region"
      aria-label="소셜 미디어 플랫폼별 게시물"
    >
      {/* CSS Grid with responsive breakpoints:
          - Mobile (320px-767px): 1 column
          - Tablet (768px-1023px): 2 columns
          - Desktop (1024px+): 4 columns
      */}
      <div
        className="grid gap-6 
          grid-cols-1 
          md:grid-cols-2 
          lg:grid-cols-4
          auto-rows-auto"
        style={{
          // Ensure proper containment for performance
          contain: 'layout style paint',
        }}
      >
        {PLATFORM_ORDER.map((platform) => (
          <PlatformColumn
            key={platform}
            platform={platform}
            feeds={feeds}
            maxItems={12}
            expandedCardId={expandedIds[platform]}
            onToggle={(id) => handleToggle(platform, id)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      {/* Live region for dynamic updates */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>
    </div>
  );
}
