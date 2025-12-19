import { useMemo, memo } from 'react';

/**
 * Supported social media platforms.
 * @typedef {'twitter' | 'threads' | 'instagram' | 'youtube'} Platform
 */
export type Platform = 'twitter' | 'threads' | 'instagram' | 'youtube';

/**
 * Glow effect intensity levels.
 * @typedef {'dim' | 'normal' | 'enhanced'} GlowIntensity
 */
export type GlowIntensity = 'dim' | 'normal' | 'enhanced';

/**
 * Props for the CardGlow component.
 *
 * @interface CardGlowProps
 * @property {GlowIntensity} intensity - Intensity level of the glow effect
 * @property {Platform} platform - Platform for color selection
 * @property {'light' | 'dark'} theme - Current theme mode
 * @property {boolean} isActive - Whether the card is in an active state
 * @property {React.ReactNode} children - Child elements to wrap with glow
 */
interface CardGlowProps {
  intensity: GlowIntensity;
  platform: Platform;
  theme: 'light' | 'dark';
  isActive: boolean;
  children: React.ReactNode;
}

/**
 * Platform-specific brand colors for glow effects.
 *
 * Colors:
 * - Twitter: #1DA1F2 (Twitter Blue)
 * - Threads: #000000 (Threads Black)
 * - Instagram: Multi-color gradient (pink to purple)
 * - YouTube: #FF0000 (YouTube Red)
 *
 * @constant
 */
const PLATFORM_COLORS = {
  twitter: '#1DA1F2',
  threads: '#000000',
  instagram:
    'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
  youtube: '#FF0000',
} as const;

/**
 * CardGlow - Wrapper component that applies platform-specific glow effects.
 *
 * Features:
 * - Platform-specific brand colors
 * - Theme-aware opacity and blur radius
 * - Smooth transitions (200ms)
 * - Special handling for Instagram gradient
 * - Memoized for performance
 *
 * Glow Intensity Levels:
 * - dim: Subtle glow for inactive state (2px blur)
 * - normal: Standard glow for default state (4px blur)
 * - enhanced: Intense glow for active state (4-8px blur based on theme)
 *
 * Theme Behavior:
 * - Light theme: Lower opacity, smaller blur radius
 * - Dark theme: Higher opacity, larger blur radius
 *
 * @component
 * @example
 * ```tsx
 * <CardGlow
 *   intensity="enhanced"
 *   platform="twitter"
 *   theme="dark"
 *   isActive={true}
 * >
 *   <div>Card content</div>
 * </CardGlow>
 * ```
 *
 * @param {CardGlowProps} props - Component props
 * @returns {JSX.Element} Wrapped children with glow effect
 */
export const CardGlow = memo(function CardGlow({
  intensity,
  platform,
  theme,
  isActive,
  children,
}: CardGlowProps) {
  const glowStyle = useMemo(() => {
    const color = PLATFORM_COLORS[platform];

    // For Instagram gradient, we need special handling
    const isInstagram = platform === 'instagram';

    // Calculate opacity based on theme and intensity
    let opacity = 0.15;
    if (theme === 'dark') {
      opacity = intensity === 'dim' ? 0.2 : intensity === 'normal' ? 0.35 : 0.5;
    } else {
      opacity = intensity === 'dim' ? 0.1 : intensity === 'normal' ? 0.2 : 0.3;
    }

    // Calculate blur radius based on theme and intensity
    let blurRadius = 4;
    if (intensity === 'dim') {
      blurRadius = 2;
    } else if (intensity === 'enhanced') {
      blurRadius = theme === 'dark' ? 8 : 4;
    }

    // For Instagram, use a multi-color shadow approximation
    if (isInstagram) {
      return {
        boxShadow: `
          0 0 ${blurRadius}px rgba(240, 148, 51, ${opacity}),
          0 0 ${blurRadius * 1.5}px rgba(220, 39, 67, ${opacity * 0.8}),
          0 0 ${blurRadius * 2}px rgba(188, 24, 136, ${opacity * 0.6})
        `,
      };
    }

    // For other platforms, use single color shadow
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    const rgb = hexToRgb(color);

    return {
      boxShadow: `0 0 ${blurRadius}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
    };
  }, [intensity, platform, theme]);

  return (
    <div
      className="card-glow-wrapper"
      style={{
        ...glowStyle,
        transition: 'box-shadow 200ms ease-in-out',
      }}
      data-platform={platform}
      data-intensity={intensity}
      data-active={isActive}
      data-theme={theme}
    >
      {children}
    </div>
  );
});

export { PLATFORM_COLORS };
