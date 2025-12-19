import { useState, useEffect, useRef, CSSProperties } from 'react';

/**
 * Hook for managing layout stability during dynamic content loading
 * Prevents Cumulative Layout Shift (CLS) by reserving space before content loads
 *
 * Requirements: 5.4 - Dynamic content loading with stable layout positions
 *
 * @example
 * const { containerRef, isLoaded, containerStyle } = useLayoutStability({
 *   minHeight: 300,
 *   aspectRatio: '16/9'
 * });
 *
 * return (
 *   <div ref={containerRef} style={containerStyle}>
 *     {isLoaded ? <ActualContent /> : <Skeleton />}
 *   </div>
 * );
 */
export const useLayoutStability = (options: {
  minHeight?: number;
  aspectRatio?: string;
  width?: number | string;
  height?: number | string;
  reserveSpace?: boolean;
}) => {
  const { minHeight, aspectRatio, width, height, reserveSpace = true } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !reserveSpace) return;

    // Check if ResizeObserver is available (not in all test environments)
    if (typeof ResizeObserver === 'undefined') return;

    // Measure container dimensions before content loads
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [reserveSpace]);

  // Generate container styles with reserved space
  const containerStyle: CSSProperties = {
    ...(minHeight && { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }),
    ...(aspectRatio && { aspectRatio }),
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    ...(reserveSpace &&
      !isLoaded && {
        position: 'relative',
        overflow: 'hidden',
      }),
  };

  const markAsLoaded = () => setIsLoaded(true);

  return {
    containerRef,
    isLoaded,
    containerStyle,
    dimensions,
    markAsLoaded,
  };
};

/**
 * Hook for managing image loading with layout stability
 * Prevents CLS by reserving space based on image dimensions
 *
 * Requirements: 5.2 - Image loading without layout shift
 *
 * @example
 * const { imageRef, isLoaded, hasError } = useImageStability();
 *
 * return (
 *   <div style={{ aspectRatio: '16/9', width: '100%' }}>
 *     <img ref={imageRef} src={src} alt={alt} />
 *   </div>
 * );
 */
export const useImageStability = () => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const handleLoad = () => {
      setIsLoaded(true);
      setNaturalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    const handleError = () => {
      setHasError(true);
      setIsLoaded(true);
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, []);

  return {
    imageRef,
    isLoaded,
    hasError,
    naturalDimensions,
  };
};

/**
 * Hook for managing font loading with layout stability
 * Prevents CLS caused by font swapping
 *
 * Requirements: 5.3 - Font loading optimization with font-display: swap
 *
 * @example
 * const { fontsLoaded, fontLoadingClass } = useFontStability(['Roboto']);
 *
 * return (
 *   <div className={fontLoadingClass}>
 *     {fontsLoaded ? 'Fonts loaded!' : 'Loading...'}
 *   </div>
 * );
 */
export const useFontStability = (fontFamilies: string[] = []) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined' || !('fonts' in document)) {
      setFontsLoaded(true);
      return;
    }

    const checkFonts = async () => {
      try {
        if (fontFamilies.length === 0) {
          // Wait for all fonts to load
          await (document as any).fonts.ready;
          setFontsLoaded(true);
        } else {
          // Wait for specific fonts
          const fontPromises = fontFamilies.map((family) =>
            (document as any).fonts.load(`1em ${family}`)
          );
          await Promise.all(fontPromises);
          setFontsLoaded(true);
        }
      } catch (error) {
        console.error('Font loading error:', error);
        setFontsLoaded(true); // Fail gracefully
      }
    };

    checkFonts();
  }, [fontFamilies]);

  // CSS class to apply during font loading
  const fontLoadingClass = fontsLoaded ? 'fonts-loaded' : 'fonts-loading';

  return {
    fontsLoaded,
    fontLoadingClass,
  };
};

/**
 * Hook for managing ad loading with layout stability
 * Prevents CLS by reserving space for ads before they load
 *
 * Requirements: 5.1 - AdSense ad areas with reserved space
 *
 * @example
 * const { adContainerRef, adStyle } = useAdStability({
 *   adSize: 'MEDIUM_RECTANGLE'
 * });
 *
 * return (
 *   <div ref={adContainerRef} style={adStyle}>
 *     <AdSenseAd adSlot="1234567890" />
 *   </div>
 * );
 */
export const useAdStability = (options: {
  adSize?: 'MEDIUM_RECTANGLE' | 'LARGE_RECTANGLE' | 'LEADERBOARD' | 'MOBILE_BANNER' | 'CUSTOM';
  minHeight?: number;
  aspectRatio?: string;
}) => {
  const { adSize = 'MEDIUM_RECTANGLE', minHeight, aspectRatio } = options;

  const adContainerRef = useRef<HTMLDivElement>(null);

  // Predefined ad sizes
  const AD_DIMENSIONS = {
    MEDIUM_RECTANGLE: { minHeight: 250, aspectRatio: '300/250' },
    LARGE_RECTANGLE: { minHeight: 280, aspectRatio: '336/280' },
    LEADERBOARD: { minHeight: 90, aspectRatio: '728/90' },
    MOBILE_BANNER: { minHeight: 50, aspectRatio: '320/50' },
    CUSTOM: { minHeight: minHeight || 250, aspectRatio: aspectRatio || 'auto' },
  };

  const dimensions = AD_DIMENSIONS[adSize];

  const adStyle: CSSProperties = {
    minHeight: `${dimensions.minHeight}px`,
    aspectRatio: dimensions.aspectRatio,
    width: '100%',
    display: 'block',
    position: 'relative',
  };

  return {
    adContainerRef,
    adStyle,
    dimensions,
  };
};
