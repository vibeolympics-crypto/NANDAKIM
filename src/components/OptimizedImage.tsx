import { useState, ImgHTMLAttributes, CSSProperties } from 'react';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  webpSrc?: string;
  srcSet?: string;
  webpSrcSet?: string;
  sizes?: string;
  className?: string;
  placeholderClassName?: string;
  eager?: boolean; // Skip lazy loading
  // Responsive image widths for automatic srcset generation
  widths?: number[];
  // Aspect ratio for container (e.g., "16/9", "4/3", "1/1")
  aspectRatio?: string;
}

/**
 * Check if URL is external (starts with http:// or https://)
 */
const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Generate srcset string from base image path and widths
 * Example: generateSrcSet('/image.jpg', [320, 640, 1024])
 * Returns: '/image-320w.jpg 320w, /image-640w.jpg 640w, /image-1024w.jpg 1024w'
 *
 * For external URLs, returns empty string (no srcset generation)
 */
const generateSrcSet = (baseSrc: string, widths: number[]): string => {
  // Don't generate srcset for external URLs
  if (isExternalUrl(baseSrc)) {
    return '';
  }

  const extension = baseSrc.split('.').pop();
  const baseWithoutExt = baseSrc.substring(0, baseSrc.lastIndexOf('.'));

  return widths.map((width) => `${baseWithoutExt}-${width}w.${extension} ${width}w`).join(', ');
};

/**
 * Generate WebP source path from original image path
 * Example: generateWebPSrc('/image.jpg') returns '/image.webp'
 *
 * For external URLs, returns the original URL (no WebP conversion)
 */
const generateWebPSrc = (src: string): string => {
  // Don't convert external URLs to WebP
  if (isExternalUrl(src)) {
    return src;
  }

  const lastDotIndex = src.lastIndexOf('.');
  if (lastDotIndex === -1) return src;
  return src.substring(0, lastDotIndex) + '.webp';
};

/**
 * Optimized image component with lazy loading, WebP support, and responsive images
 *
 * Features:
 * - Automatic WebP format with JPEG/PNG fallback
 * - Automatic srcset generation (400w, 800w, 1200w, 1600w)
 * - Intersection Observer based lazy loading
 * - Predefined width/height to prevent layout shift
 * - aspect-ratio CSS property support
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  webpSrc,
  srcSet,
  webpSrcSet,
  sizes,
  className,
  placeholderClassName,
  eager = false,
  widths = [400, 800, 1200, 1600], // Default responsive widths
  aspectRatio,
  ...props
}: OptimizedImageProps) => {
  const { ref, isVisible } = useLazyLoad({ threshold: 0.1, rootMargin: '50px' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Load immediately if eager loading is enabled
  const shouldLoad = eager || isVisible;

  // Auto-generate WebP source if not provided (skip for external URLs)
  const computedWebpSrc = webpSrc || generateWebPSrc(src);

  // Generate srcset if widths are provided and no explicit srcset (skip for external URLs)
  const computedSrcSet = srcSet || generateSrcSet(src, widths);
  const computedWebpSrcSet = webpSrcSet || generateSrcSet(computedWebpSrc, widths);

  // Check if this is an external URL
  const isExternal = isExternalUrl(src);

  // Default sizes attribute for responsive images
  const computedSizes = sizes || '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // Container styles with aspect ratio and dimensions
  const containerStyle: CSSProperties = {
    ...(aspectRatio && { aspectRatio }),
    ...(width && { width: `${width}px` }),
    ...(height && { height: `${height}px` }),
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn('relative overflow-hidden', className)}
      style={containerStyle}
    >
      {/* Placeholder with blur effect */}
      {!isLoaded && (
        <div
          className={cn('absolute inset-0 bg-muted animate-pulse', placeholderClassName)}
          aria-hidden="true"
        />
      )}

      {/* Actual image - only render when visible */}
      {shouldLoad && !hasError && (
        <picture>
          {/* WebP sources with srcset for responsive images (skip for external URLs) */}
          {!isExternal && computedWebpSrcSet && (
            <source type="image/webp" srcSet={computedWebpSrcSet} sizes={computedSizes} />
          )}

          {/* Fallback to JPEG/PNG with srcset (skip for external URLs) */}
          {!isExternal && computedSrcSet && (
            <source srcSet={computedSrcSet} sizes={computedSizes} />
          )}

          {/* Final fallback image */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-500',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            loading={eager ? 'eager' : 'lazy'}
            {...props}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && (
        <div
          className={cn(
            'absolute inset-0 bg-muted flex items-center justify-center',
            placeholderClassName
          )}
        >
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};
