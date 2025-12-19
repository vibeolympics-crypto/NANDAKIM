import { Twitter, Instagram, Youtube, ExternalLink } from 'lucide-react';
import { ThreadsIcon } from './icons/ThreadsIcon';
import { OptimizedImage } from './OptimizedImage';

interface SNSFeed {
  id: string;
  platform: 'twitter' | 'threads' | 'instagram' | 'youtube';
  content: string;
  image?: string;
  video?: string;
  url: string;
  timestamp: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface SNSGridSectionProps {
  feeds: SNSFeed[];
  columns?: { desktop: number; tablet: number; mobile: number };
}

interface PlatformConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  name: string;
}

const platformConfigs: Record<string, PlatformConfig> = {
  twitter: { icon: Twitter, color: '#1DA1F2', name: 'Twitter' },
  threads: { icon: ThreadsIcon, color: '#000000', name: 'Threads' },
  instagram: { icon: Instagram, color: '#E4405F', name: 'Instagram' },
  youtube: { icon: Youtube, color: '#FF0000', name: 'YouTube' },
};

export const SNSGridSection = ({
  feeds,
  columns = { desktop: 3, tablet: 2, mobile: 1 },
}: SNSGridSectionProps) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGridColumns = () => {
    return `grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`;
  };

  return (
    <div className="w-full">
      <div className={`grid ${getGridColumns()} gap-6`} role="list" aria-label="소셜 미디어 피드">
        {feeds.map((feed) => {
          const config = platformConfigs[feed.platform];
          const Icon = config.icon;

          return (
            <a
              key={feed.id}
              href={feed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sns-card card-morph parallax-layer block bg-card border border-border rounded-lg overflow-hidden transition-all duration-500 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background hover:shadow-xl"
              aria-label={`${config.name}에서 보기: ${feed.content.substring(0, 50)}${feed.content.length > 50 ? '...' : ''}`}
              role="listitem"
            >
              {/* Platform Header */}
              <div
                className="flex items-center gap-2 p-4 border-b border-border"
                style={{ borderLeftColor: config.color, borderLeftWidth: '4px' }}
              >
                <div style={{ color: config.color }}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="font-semibold text-sm" style={{ color: config.color }}>
                  {config.name}
                </span>
                <ExternalLink
                  className="w-4 h-4 ml-auto text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              {/* Image/Video Thumbnail */}
              {(feed.image || feed.video) && (
                <div className="relative w-full h-48 bg-muted">
                  <OptimizedImage
                    src={feed.image || '/placeholder.svg'}
                    alt={`${config.name} post thumbnail`}
                    width={800}
                    height={600}
                    aspectRatio="4/3"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    widths={[400, 800, 1200]}
                  />
                  {feed.video && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Youtube className="w-12 h-12 text-white" aria-hidden="true" />
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-foreground line-clamp-3 mb-3">{feed.content}</p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <time dateTime={feed.timestamp}>{formatTimestamp(feed.timestamp)}</time>
                  <div className="flex items-center gap-3" aria-label="참여 통계">
                    {feed.likes !== undefined && (
                      <span aria-label={`좋아요 ${feed.likes}개`}>
                        <span aria-hidden="true">❤️</span> {feed.likes}
                      </span>
                    )}
                    {feed.comments !== undefined && (
                      <span aria-label={`댓글 ${feed.comments}개`}>
                        <span aria-hidden="true">💬</span> {feed.comments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
