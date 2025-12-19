import { useEffect, useRef, useState, ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?:
    | 'fade-in'
    | 'slide-up'
    | 'fly-in'
    | 'scale-in'
    | 'morph'
    | 'wave'
    | 'flip'
    | 'zoom'
    | 'bounce'
    | 'elastic'
    | 'slide-left'
    | 'slide-right'
    | 'converge';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export function AnimatedSection({
  children,
  animation = 'fade-in',
  delay = 0,
  duration = 800,
  threshold = 0.1,
  className = '',
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const animationClass = isVisible ? `section-${animation}` : '';
  const style = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
  };

  return (
    <div
      ref={ref}
      className={`${animationClass} ${className}`}
      style={isVisible ? style : undefined}
    >
      {children}
    </div>
  );
}
