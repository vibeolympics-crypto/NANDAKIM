import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Floating "Back to top" button with responsive positioning.
 * Keeps padding above the music player on mobile while staying accessible.
 */
export const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const bottomOffset = isMobile ? 112 : 48;

  const positionStyle = useMemo(
    () => ({
      bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
    }),
    [bottomOffset]
  );

  const handleClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed right-4 sm:right-5 md:right-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      style={{ ...positionStyle, zIndex: 40 }}
      aria-label="Back to top"
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      <span className="sm:inline">Top</span>
    </button>
  );
};
