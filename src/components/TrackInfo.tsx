/**
 * TrackInfo Component
 * Displays track metadata, progress bar, and AI attribution
 *
 * Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3
 */

import { useRef, useState, useCallback, useMemo, memo, useEffect } from 'react';
import type { TrackInfoProps } from '@/types/music';
import './TrackInfo.css';

/**
 * Format time in seconds to mm:ss format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * TrackInfo Component
 *
 * Displays:
 * - Track title (Requirement 4.1)
 * - Artist name (Requirement 4.2)
 * - Current time and duration (Requirement 4.3)
 * - AI creation attribution (Requirements 5.1, 5.2, 5.3)
 * - Seekable progress bar
 */
export const TrackInfo = memo(function TrackInfo({
  track,
  currentTime,
  duration,
  onSeek,
}: TrackInfoProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate progress percentage - memoized
  const progress = useMemo(
    () => (duration > 0 ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  );

  // Memoize formatted times
  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);

  /**
   * Handle seeking by clicking or dragging on progress bar
   */
  const handleSeek = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;

      onSeek(newTime);
    },
    [duration, onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleSeek(e.clientX);
    },
    [handleSeek]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        handleSeek(e.clientX);
      }
    },
    [isDragging, handleSeek]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      handleSeek(e.touches[0].clientX);
    },
    [handleSeek]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging) {
        handleSeek(e.touches[0].clientX);
      }
    },
    [isDragging, handleSeek]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Show enhanced placeholder if no track
  if (!track) {
    return (
      <div className="track-info opacity-60">
        <div className="track-metadata">
          <div className="track-title text-muted flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-pulse"
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
            <span>No track selected</span>
          </div>
          <div className="track-artist text-muted">Select a track to begin</div>
        </div>
        <div className="track-attribution text-muted">AI-generated music</div>
        <div className="progress-container">
          <div className="progress-bar" ref={progressBarRef}>
            <div className="progress-fill" style={{ width: '0%' }} />
          </div>
          <div className="time-display">
            <span className="current-time">0:00</span>
            <span className="duration">0:00</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="track-info">
      {/* Track Metadata - Requirements 4.1, 4.2 */}
      <div className="track-metadata">
        <div className="track-title" title={track.title}>
          {track.title}
        </div>
        <div className="track-artist" title={track.artist}>
          {track.artist}
        </div>
      </div>

      {/* AI Attribution - Requirements 5.1, 5.2, 5.3 */}
      <div className="track-attribution">Created by the website operator using Suno AI</div>

      {/* Progress Bar and Time Display - Requirement 4.3 */}
      <div className="progress-container">
        <div
          className="progress-bar"
          ref={progressBarRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="slider"
          aria-label="Seek position"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          tabIndex={0}
          onKeyDown={(e) => {
            // Keyboard seeking: arrow keys
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              onSeek(Math.max(0, currentTime - 5));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              onSeek(Math.min(duration, currentTime + 5));
            }
          }}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <div className="progress-handle" style={{ left: `${progress}%` }} />
        </div>

        {/* Time Display - Requirement 4.3 */}
        <div className="time-display">
          <span className="current-time">{formattedCurrentTime}</span>
          <span className="duration">{formattedDuration}</span>
        </div>
      </div>
    </div>
  );
});
