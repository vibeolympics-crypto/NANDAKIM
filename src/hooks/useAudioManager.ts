/**
 * useAudioManager Hook
 * Manages HTML5 Audio element for music playback
 *
 * Requirements: 3.1, 3.4, 3.5, 10.1
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { UseAudioManagerReturn } from '@/types/music';

interface UseAudioManagerOptions {
  /** URL of the track to play */
  trackUrl: string | null;
  /** Callback when track ends */
  onEnded: () => void;
  /** Callback when time updates */
  onTimeUpdate: (time: number) => void;
  /** Initial volume (0-1) */
  initialVolume?: number;
  /** Initial muted state */
  initialMuted?: boolean;
}

/**
 * Custom hook for managing audio playback
 *
 * @param options - Configuration options
 * @returns Audio manager interface
 */
export function useAudioManager({
  trackUrl,
  onEnded,
  onTimeUpdate,
  initialVolume = 0.7,
  initialMuted = false,
}: UseAudioManagerOptions): UseAudioManagerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.volume = initialVolume;
    audio.muted = initialMuted;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [initialVolume, initialMuted]);

  // Handle track URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (trackUrl) {
      console.log(`[useAudioManager] Loading track: ${trackUrl}`);
      setIsLoading(true);
      setError(null);
      audio.src = trackUrl;
      audio.load();
    } else {
      console.log(`[useAudioManager] No trackUrl provided, pausing audio`);
      audio.pause();
      audio.src = '';
      setCurrentTime(0);
      setDuration(0);
    }
  }, [trackUrl]);

  // Set up event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate(time);
    };

    const handleEnded = () => {
      setCurrentTime(0);
      onEnded();
    };

    const handleError = (e: ErrorEvent | Event) => {
      const errorMessage = 'Failed to load audio track';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Audio error:', e);
      // Note: Error handling for skipping is done in MusicPlayer component
      // to prevent double-calling nextTrack
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [onEnded, onTimeUpdate]);

  // Play method - Requirement 3.1
  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !trackUrl) {
      console.log(`[useAudioManager] Play failed: audio=${!!audio}, trackUrl=${trackUrl}`);
      return;
    }

    try {
      console.log(`[useAudioManager] Playing track: ${trackUrl}, audio.readyState=${audio.readyState}`);
      setError(null);
      await audio.play();
      console.log(`[useAudioManager] Play succeeded`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
      setError(errorMessage);
      console.error(`[useAudioManager] Play error: ${errorMessage}`, err);
      // Error handling for skipping is done in MusicPlayer component
      // to prevent double-calling nextTrack
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        console.error('Play error:', err);
      }
    }
  }, [trackUrl]);

  // Pause method - Requirement 3.1
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
  }, []);

  // Seek method
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
  }, []);

  // Set volume method - Requirement 3.4
  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clamp volume between 0 and 1
    audio.volume = Math.max(0, Math.min(1, volume));
  }, []);

  // Set muted method - Requirement 3.5
  const setMuted = useCallback((muted: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = muted;
  }, []);

  return {
    play,
    pause,
    seek,
    setVolume,
    setMuted,
    currentTime,
    duration,
    isLoading,
    error,
  };
}
