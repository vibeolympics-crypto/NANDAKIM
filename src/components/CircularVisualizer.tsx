/**
 * CircularVisualizer Component
 * Renders a rotating circular dial with radiant lighting effects
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.4, 4.5
 */

import { useMemo, memo } from 'react';
import { useTheme } from 'next-themes';
import type { CircularVisualizerProps } from '@/types/music';

// ============================================
// Constants
// ============================================

const CIRCLE_RADIUS = 120; // Radius of the main circle
const TRACK_INDICATOR_RADIUS = 8; // Radius of each track indicator
const GLOW_RADIUS = 16; // Radius of the glow effect for active track

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate position of a track indicator around the circle
 * @param index - Track index
 * @param total - Total number of tracks
 * @param radius - Radius of the circle
 * @returns {x, y} coordinates
 */
function calculateTrackPosition(index: number, total: number, radius: number) {
  // Start from top (270 degrees) and go clockwise
  const angle = (270 + (360 / total) * index) * (Math.PI / 180);
  const x = radius + radius * Math.cos(angle);
  const y = radius + radius * Math.sin(angle);
  return { x, y };
}

/**
 * Calculate rotation angle for the current track
 * @param currentIndex - Current track index
 * @param total - Total number of tracks
 * @returns Rotation angle in degrees
 */
function calculateRotation(currentIndex: number, total: number): number {
  if (total === 0) return 0;
  // Rotate so current track is at the top
  return -(360 / total) * currentIndex;
}

// ============================================
// Component
// ============================================

export const CircularVisualizer = memo(function CircularVisualizer({
  tracks,
  currentIndex,
  isPlaying,
  theme,
  onTrackSelect,
}: CircularVisualizerProps) {
  const { resolvedTheme } = useTheme();
  const effectiveTheme = theme || resolvedTheme || 'dark';

  // Calculate rotation angle for current track
  const rotation = useMemo(
    () => calculateRotation(currentIndex, tracks.length),
    [currentIndex, tracks.length]
  );

  // Calculate positions for all track indicators
  const trackPositions = useMemo(
    () => tracks.map((_, index) => calculateTrackPosition(index, tracks.length, CIRCLE_RADIUS)),
    [tracks.length]
  );

  // Theme-specific colors using CSS custom properties approach
  const colors = useMemo(() => {
    if (effectiveTheme === 'dark') {
      return {
        // Dark mode: Deep slate background with blue accents
        background: 'rgba(15, 23, 42, 0.8)', // slate-900 with opacity
        trackInactive: 'rgba(148, 163, 184, 0.4)', // slate-400
        trackActive: 'rgba(59, 130, 246, 1)', // blue-500
        glowColor: 'rgba(59, 130, 246, 0.6)', // blue-500 with opacity
        gradientStart: 'rgba(59, 130, 246, 0.8)',
        gradientEnd: 'rgba(59, 130, 246, 0)',
        centerFill: 'rgba(59, 130, 246, 1)', // blue-500
        iconColor: 'rgba(255, 255, 255, 1)', // white
      };
    } else {
      return {
        // Light mode: Soft slate background with darker blue accents
        background: 'rgba(248, 250, 252, 0.9)', // slate-50 with opacity
        trackInactive: 'rgba(100, 116, 139, 0.4)', // slate-500
        trackActive: 'rgba(37, 99, 235, 1)', // blue-600
        glowColor: 'rgba(37, 99, 235, 0.6)', // blue-600 with opacity
        gradientStart: 'rgba(37, 99, 235, 0.8)',
        gradientEnd: 'rgba(37, 99, 235, 0)',
        centerFill: 'rgba(37, 99, 235, 1)', // blue-600
        iconColor: 'rgba(255, 255, 255, 1)', // white
      };
    }
  }, [effectiveTheme]);

  // Handle empty playlist with enhanced empty state
  if (tracks.length === 0) {
    return (
      <div className="flex items-center justify-center w-64 h-64 animate-in fade-in duration-500">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">No tracks available</p>
        </div>
      </div>
    );
  }

  const viewBoxSize = CIRCLE_RADIUS * 2 + 40; // Add padding

  return (
    <div
      className="relative w-full h-full flex items-center justify-center transition-colors duration-300"
      data-theme={effectiveTheme}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="max-w-sm max-h-sm transition-all duration-300"
      >
        {/* Define gradients */}
        <defs>
          {/* Radial gradient for active track glow */}
          <radialGradient id="activeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.gradientStart} />
            <stop offset="100%" stopColor={colors.gradientEnd} />
          </radialGradient>

          {/* Filter for glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={CIRCLE_RADIUS}
          fill={colors.background}
          stroke={colors.trackInactive}
          strokeWidth="2"
        />

        {/* Rotating group for track indicators - Enhanced smooth rotation */}
        <g
          transform={`rotate(${rotation} ${viewBoxSize / 2} ${viewBoxSize / 2})`}
          style={{
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'center',
          }}
        >
          {/* Track indicators */}
          {tracks.map((track, index) => {
            const { x, y } = trackPositions[index];
            const isActive = index === currentIndex;
            const centerX = viewBoxSize / 2 - CIRCLE_RADIUS + x;
            const centerY = viewBoxSize / 2 - CIRCLE_RADIUS + y;

            return (
              <g key={track.id}>
                {/* Glow effect for active track - enhanced pulsing animation */}
                {isActive && (
                  <>
                    {/* Outer glow ring - always visible for active track */}
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={GLOW_RADIUS}
                      fill="url(#activeGlow)"
                      opacity={isPlaying ? '0.6' : '0.3'}
                      style={{
                        transition: 'opacity 0.5s ease, r 0.5s ease',
                      }}
                    />

                    {/* Pulsing glow - only when playing with enhanced animation */}
                    {isPlaying && (
                      <>
                        <circle
                          cx={centerX}
                          cy={centerY}
                          r={GLOW_RADIUS}
                          fill="url(#activeGlow)"
                          opacity="0.8"
                          className="animate-pulse"
                        />
                        <circle
                          cx={centerX}
                          cy={centerY}
                          r={GLOW_RADIUS * 1.3}
                          fill="url(#activeGlow)"
                          opacity="0.4"
                          style={{
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                      </>
                    )}
                  </>
                )}

                {/* Track indicator with enhanced scale and color animation */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={isActive ? TRACK_INDICATOR_RADIUS * 1.2 : TRACK_INDICATOR_RADIUS}
                  fill={isActive ? colors.trackActive : colors.trackInactive}
                  stroke={isActive ? colors.glowColor : 'transparent'}
                  strokeWidth={isActive ? '2' : '0'}
                  filter={isActive ? 'url(#glow)' : undefined}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformOrigin: `${centerX}px ${centerY}px`,
                  }}
                  onClick={() => onTrackSelect(index)}
                  className="hover:opacity-80"
                />

                {/* Track number label (only for active track) with enhanced fade-in */}
                {isActive && (
                  <text
                    x={centerX}
                    y={centerY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    pointerEvents="none"
                    style={{
                      opacity: 1,
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                      animation: 'fadeIn 0.5s ease-out',
                    }}
                  >
                    {index + 1}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Center indicator with enhanced animation */}
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={12}
          fill={colors.centerFill}
          filter="url(#glow)"
          style={{
            transition: 'fill 0.3s ease, r 0.3s ease',
          }}
          className={isPlaying ? 'animate-pulse' : ''}
        />

        {/* Center play/pause indicator */}
        {isPlaying ? (
          // Pause icon
          <g transform={`translate(${viewBoxSize / 2 - 4}, ${viewBoxSize / 2 - 6})`}>
            <rect x="0" y="0" width="3" height="12" fill={colors.iconColor} />
            <rect x="5" y="0" width="3" height="12" fill={colors.iconColor} />
          </g>
        ) : (
          // Play icon
          <polygon
            points={`${viewBoxSize / 2 - 3},${viewBoxSize / 2 - 6} ${viewBoxSize / 2 - 3},${
              viewBoxSize / 2 + 6
            } ${viewBoxSize / 2 + 5},${viewBoxSize / 2}`}
            fill={colors.iconColor}
          />
        )}
      </svg>
    </div>
  );
});
