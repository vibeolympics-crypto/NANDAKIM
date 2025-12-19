/**
 * PlaybackControls Component
 * Provides user interface for controlling music playback
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useEffect, useCallback, memo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';
import type { PlaybackControlsProps } from '@/types/music';

/**
 * PlaybackControls component
 * Renders playback control buttons with keyboard shortcuts and accessibility features
 */
export const PlaybackControls = memo(function PlaybackControls({
  isPlaying,
  volume,
  isMuted,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onMuteToggle,
}: PlaybackControlsProps) {
  // Requirement 6.2: Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Prevent default behavior for our shortcuts
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Don't trigger shortcuts when typing in input fields
      if (isInputField) return;

      switch (event.key) {
        case ' ':
          // Space: play/pause
          event.preventDefault();
          onPlayPause();
          break;
        case 'ArrowLeft':
          // Arrow left: previous track
          event.preventDefault();
          onPrevious();
          break;
        case 'ArrowRight':
          // Arrow right: next track
          event.preventDefault();
          onNext();
          break;
        case 'ArrowUp':
          // Arrow up: increase volume
          event.preventDefault();
          onVolumeChange(Math.min(100, volume + 5));
          break;
        case 'ArrowDown':
          // Arrow down: decrease volume
          event.preventDefault();
          onVolumeChange(Math.max(0, volume - 5));
          break;
        case 'm':
        case 'M':
          // M: mute toggle
          event.preventDefault();
          onMuteToggle();
          break;
      }
    },
    [isPlaying, volume, onPlayPause, onNext, onPrevious, onVolumeChange, onMuteToggle]
  );

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle volume slider change
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value, 10);
    onVolumeChange(newVolume);
  };

  return (
    <div
      className="flex items-center gap-4 p-4 bg-background/80 backdrop-blur-sm rounded-lg"
      role="region"
      aria-label="Music playback controls"
    >
      {/* Previous Track Button - Requirement 3.3 */}
      <button
        onClick={onPrevious}
        className="p-2 rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Previous track (Arrow Left)"
        title="Previous track (Arrow Left)"
      >
        <SkipBack className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Play/Pause Button - Requirement 3.1 */}
      <button
        onClick={onPlayPause}
        className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110 shadow-2xl border-2 border-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        {isPlaying ? (
          <Pause
            className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            fill="white"
            aria-hidden="true"
          />
        ) : (
          <Play
            className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ml-1"
            fill="white"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Next Track Button - Requirement 3.2 */}
      <button
        onClick={onNext}
        className="p-2 rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Next track (Arrow Right)"
        title="Next track (Arrow Right)"
      >
        <SkipForward className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Volume Controls - Requirements 3.4, 3.5 */}
      <div className="flex items-center gap-2 ml-4">
        {/* Mute Toggle Button - Requirement 3.5 */}
        <button
          onClick={onMuteToggle}
          className="p-2 rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Volume2 className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        {/* Volume Slider - Requirement 3.4 */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-2 bg-accent rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
            aria-label="Volume control (Arrow Up/Down)"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volume}
            aria-valuetext={`${volume}%`}
          />
          <span
            className="text-sm text-muted-foreground min-w-[3ch]"
            aria-live="polite"
            aria-atomic="true"
          >
            {volume}%
          </span>
        </div>
      </div>

      {/* Screen reader announcements for state changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isPlaying ? 'Playing' : 'Paused'}
        {isMuted && ', Muted'}
      </div>
    </div>
  );
});
