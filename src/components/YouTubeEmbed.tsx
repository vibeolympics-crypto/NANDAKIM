import { memo, useMemo } from 'react';

interface YouTubeEmbedProps {
  /**
   * YouTube URL (can be watch URL or embed URL)
   * Examples: https://youtube.com/watch?v=xxx or https://youtu.be/xxx
   */
  url: string;
  /**
   * Title for accessibility
   */
  title?: string;
  /**
   * Custom container class name
   */
  className?: string;
  /**
   * Show loading state
   */
  isLoading?: boolean;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Handle youtube.com/watch?v=xxx
  const match1 = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (match1) return match1[1];

  // Handle youtu.be/xxx
  const match2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match2) return match2[1];

  // Handle youtube.com/embed/xxx
  const match3 = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match3) return match3[1];

  // Handle youtube-nocookie.com/embed/xxx
  const match4 = url.match(/youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match4) return match4[1];

  return null;
}

/**
 * YouTubeEmbed - Responsive YouTube video embed component
 * 
 * Features:
 * - Responsive design with 16:9 aspect ratio
 * - Works with various YouTube URL formats
 * - Accessibility compliant with iframe title
 * - Graceful error handling
 * 
 * @example
 * ```tsx
 * <YouTubeEmbed url="https://youtube.com/watch?v=dQw4w9WgXcQ" />
 * ```
 */
export const YouTubeEmbed = memo(function YouTubeEmbed({
  url,
  title = 'YouTube Video',
  className = '',
  isLoading = false,
}: YouTubeEmbedProps) {
  const videoId = useMemo(() => extractYouTubeVideoId(url), [url]);

  // If no valid video ID, show error state
  if (!videoId) {
    return (
      <div
        className={`w-full bg-muted/50 rounded-lg shadow-lg flex items-center justify-center min-h-[360px] sm:min-h-[480px] md:min-h-[600px] ${className}`}
        role="alert"
      >
        <div className="text-center">
          <p className="text-muted-foreground text-sm md:text-base">
            올바른 YouTube URL을 제공해 주세요.
          </p>
        </div>
      </div>
    );
  }

  // Embed URL
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg shadow-lg ${className}`}
      style={{
        aspectRatio: '16 / 9',
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 animate-pulse" aria-hidden="true" />
      )}
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        allowFullScreen
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        style={{
          border: 'none',
        }}
        aria-label={title}
      />
    </div>
  );
});

YouTubeEmbed.displayName = 'YouTubeEmbed';

export default YouTubeEmbed;
