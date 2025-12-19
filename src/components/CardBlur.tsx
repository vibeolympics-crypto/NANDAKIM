import { useMemo } from 'react';

/**
 * Props for the CardBlur component.
 *
 * @interface CardBlurProps
 * @property {number} amount - Blur amount in pixels (0-3px)
 * @property {boolean} isAnimating - Whether to animate blur transitions
 * @property {'light' | 'dark'} theme - Current theme mode
 * @property {React.ReactNode} children - Child elements to apply blur to
 * @property {boolean} [reducedMotion] - Whether reduced motion is enabled
 */
interface CardBlurProps {
  amount: number; // 0-3px
  isAnimating: boolean;
  theme: 'light' | 'dark';
  children: React.ReactNode;
  reducedMotion?: boolean;
}

/**
 * CardBlur - Wrapper component that applies blur effects to card content.
 *
 * Features:
 * - Smooth blur transitions (300ms ease-in-out)
 * - Clamped blur range (0-3px)
 * - Reduced motion support (disables blur when enabled)
 * - Memoized for performance
 * - GPU-accelerated CSS filter
 *
 * Blur Behavior:
 * - 0px: No blur (active/expanded state)
 * - 2px: Light blur (light theme default)
 * - 3px: Medium blur (dark theme default)
 *
 * Accessibility:
 * - Respects prefers-reduced-motion
 * - Disables all blur effects when reducedMotion is true
 *
 * @component
 * @example
 * ```tsx
 * <CardBlur
 *   amount={2}
 *   isAnimating={true}
 *   theme="light"
 *   reducedMotion={false}
 * >
 *   <div>Blurred content</div>
 * </CardBlur>
 * ```
 *
 * @param {CardBlurProps} props - Component props
 * @returns {JSX.Element} Wrapped children with blur effect
 */
export function CardBlur({
  amount,
  isAnimating,
  theme,
  children,
  reducedMotion = false,
}: CardBlurProps) {
  const blurStyle = useMemo(() => {
    // If reduced motion is enabled, disable blur effects
    if (reducedMotion) {
      return {
        filter: 'none',
        transition: 'none',
      };
    }

    // Clamp blur amount between 0 and 3
    const clampedAmount = Math.max(0, Math.min(3, amount));

    return {
      filter: clampedAmount > 0 ? `blur(${clampedAmount}px)` : 'none',
      transition: isAnimating ? 'filter 300ms ease-in-out' : 'none',
    };
  }, [amount, isAnimating, reducedMotion]);

  return (
    <div
      className="card-blur-wrapper"
      style={blurStyle}
      data-blur-amount={amount}
      data-theme={theme}
    >
      {children}
    </div>
  );
}
