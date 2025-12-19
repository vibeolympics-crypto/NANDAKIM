import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Temporarily disable AdSense rendering until re-enabled (user request)
const ADSENSE_ENABLED = false;

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
  // Layout stability props (Requirements: 5.1, 5.2)
  minHeight?: number;
  aspectRatio?: string;
}

/**
 * AdSense Ad Component with Layout Stability
 *
 * Features:
 * - Reserved space with aspect-ratio or min-height to prevent CLS (Requirements: 5.1)
 * - Predefined dimensions to maintain stable layout (Requirements: 5.2)
 * - Lazy loading support
 * - Responsive ad formats
 *
 * @example
 * // Standard display ad (300x250)
 * <AdSenseAd adSlot="1234567890" minHeight={250} aspectRatio="300/250" />
 *
 * // Responsive ad
 * <AdSenseAd adSlot="1234567890" adFormat="auto" minHeight={90} />
 */
export const AdSenseAd = ({
  adSlot,
  adFormat = 'auto',
  className,
  style,
  minHeight = 250,
  aspectRatio = '300/250',
}: AdSenseAdProps) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ADSENSE_ENABLED) {
      return;
    }

    // Load AdSense script if not already loaded
    if (typeof window !== 'undefined' && !(window as any).adsbygoogle) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push ad to AdSense queue
    try {
      if (adRef.current && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Container styles with layout stability (Requirements: 5.1, 5.2)
  const containerStyle: React.CSSProperties = {
    minHeight: `${minHeight}px`,
    aspectRatio: aspectRatio,
    display: 'block',
    width: '100%',
    ...style,
  };

  if (!ADSENSE_ENABLED) {
    return null;
  }

  return (
    <div ref={adRef} className={cn('ad-container', className)} style={containerStyle}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-xxxxxxxxxxxxxxxx'}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

/**
 * Common AdSense ad sizes with predefined dimensions for layout stability
 */
export const AD_SIZES = {
  // Standard display ads
  MEDIUM_RECTANGLE: { minHeight: 250, aspectRatio: '300/250' },
  LARGE_RECTANGLE: { minHeight: 280, aspectRatio: '336/280' },
  LEADERBOARD: { minHeight: 90, aspectRatio: '728/90' },
  WIDE_SKYSCRAPER: { minHeight: 600, aspectRatio: '160/600' },

  // Mobile ads
  MOBILE_BANNER: { minHeight: 50, aspectRatio: '320/50' },
  MOBILE_LARGE_BANNER: { minHeight: 100, aspectRatio: '320/100' },

  // Responsive
  RESPONSIVE: { minHeight: 90, aspectRatio: 'auto' },
} as const;
