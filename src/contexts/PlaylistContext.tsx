/**
 * PlaylistContext
 * Manages playlist state and playback logic
 *
 * Requirements: 2.2, 2.3, 2.4, 3.2, 3.3
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { PlaylistState, Track, PlaybackMode } from '@/types/music';

// ============================================
// Types
// ============================================

type PlaylistAction =
  | { type: 'SET_TRACKS'; payload: Track[] }
  | { type: 'SET_CURRENT_TRACK_INDEX'; payload: number }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_PLAYBACK_MODE'; payload: PlaybackMode }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'SHUFFLE' }
  | { type: 'RESHUFFLE_AND_CONTINUE' };

interface PlaylistContextValue {
  state: PlaylistState;
  dispatch: React.Dispatch<PlaylistAction>;
  // Convenience methods
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setCurrentTime: (time: number) => void;
  shuffle: () => void;
  getCurrentTrack: () => Track | null;
}

// ============================================
// Shuffle Algorithm - Requirement 2.2
// ============================================

/**
 * Fisher-Yates shuffle algorithm
 * Generates a random permutation of indices
 *
 * Property 2: For any playlist with N tracks, shuffle produces
 * an array containing exactly 0 through N-1, each appearing once
 */
function shuffleArray(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

// ============================================
// Initial State
// ============================================

const initialState: PlaylistState = {
  tracks: [],
  currentTrackIndex: 0,
  isPlaying: false,
  volume: 30,
  isMuted: false,
  playbackMode: 'random',
  shuffledIndices: [],
  currentTime: 0,
  duration: 0,
  isLoading: false,
  error: null,
};

// ============================================
// Reducer
// ============================================

function playlistReducer(state: PlaylistState, action: PlaylistAction): PlaylistState {
  switch (action.type) {
    case 'SET_TRACKS': {
      const tracks = action.payload;
      const shuffledIndices =
        state.playbackMode === 'random'
          ? shuffleArray(tracks.length)
          : Array.from({ length: tracks.length }, (_, i) => i);

      return {
        ...state,
        tracks,
        shuffledIndices,
        currentTrackIndex: 0,
      };
    }

    case 'SET_CURRENT_TRACK_INDEX':
      return {
        ...state,
        currentTrackIndex: action.payload,
        currentTime: 0,
      };

    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload,
      };

    case 'SET_VOLUME':
      return {
        ...state,
        volume: action.payload,
      };

    case 'SET_MUTED':
      return {
        ...state,
        isMuted: action.payload,
      };

    case 'SET_PLAYBACK_MODE': {
      const playbackMode = action.payload;
      const shuffledIndices =
        playbackMode === 'random'
          ? shuffleArray(state.tracks.length)
          : Array.from({ length: state.tracks.length }, (_, i) => i);

      return {
        ...state,
        playbackMode,
        shuffledIndices,
      };
    }

    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: action.payload,
      };

    case 'SET_DURATION':
      return {
        ...state,
        duration: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    // Requirement 3.2: Next track navigation
    // Property 6: For any current index, next sets index to (currentIndex + 1) % N
    case 'NEXT_TRACK': {
      const N = state.tracks.length;
      if (N === 0) return state;

      const nextIndex = (state.currentTrackIndex + 1) % N;

      // Requirement 2.4: Reshuffle at end of playlist
      if (nextIndex === 0 && state.playbackMode === 'random') {
        return {
          ...state,
          currentTrackIndex: 0,
          shuffledIndices: shuffleArray(N),
          currentTime: 0,
        };
      }

      return {
        ...state,
        currentTrackIndex: nextIndex,
        currentTime: 0,
      };
    }

    // Requirement 3.3: Previous track navigation
    // Property 7: For any current index, previous sets index to (currentIndex - 1 + N) % N
    case 'PREVIOUS_TRACK': {
      const N = state.tracks.length;
      if (N === 0) return state;

      const previousIndex = (state.currentTrackIndex - 1 + N) % N;

      return {
        ...state,
        currentTrackIndex: previousIndex,
        currentTime: 0,
      };
    }

    // Requirement 3.1: Play/pause toggle
    // Property 5: Toggle results in opposite state
    case 'TOGGLE_PLAY_PAUSE':
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };

    // Requirement 2.2: Shuffle
    case 'SHUFFLE': {
      const shuffledIndices = shuffleArray(state.tracks.length);
      return {
        ...state,
        shuffledIndices,
        currentTrackIndex: 0,
      };
    }

    // Requirement 2.4: Reshuffle and continue
    case 'RESHUFFLE_AND_CONTINUE': {
      const shuffledIndices = shuffleArray(state.tracks.length);
      return {
        ...state,
        shuffledIndices,
        currentTrackIndex: 0,
        currentTime: 0,
      };
    }

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

const PlaylistContext = createContext<PlaylistContextValue | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface PlaylistProviderProps {
  children: React.ReactNode;
  initialPlaybackMode?: PlaybackMode;
  initialVolume?: number;
}

export function PlaylistProvider({
  children,
  initialPlaybackMode = 'random',
  initialVolume = 70,
}: PlaylistProviderProps) {
  const [state, dispatch] = useReducer(playlistReducer, {
    ...initialState,
    playbackMode: initialPlaybackMode,
    volume: initialVolume,
  });

  // Convenience methods
  const play = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', payload: true });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', payload: false });
  }, []);

  const togglePlayPause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
  }, []);

  const nextTrack = useCallback(() => {
    dispatch({ type: 'NEXT_TRACK' });
  }, []);

  const previousTrack = useCallback(() => {
    dispatch({ type: 'PREVIOUS_TRACK' });
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    dispatch({ type: 'SET_MUTED', payload: muted });
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
  }, []);

  const shuffle = useCallback(() => {
    dispatch({ type: 'SHUFFLE' });
  }, []);

  const getCurrentTrack = useCallback((): Track | null => {
    if (state.tracks.length === 0) return null;

    const actualIndex =
      state.playbackMode === 'random'
        ? state.shuffledIndices[state.currentTrackIndex]
        : state.currentTrackIndex;

    return state.tracks[actualIndex] || null;
  }, [state.tracks, state.currentTrackIndex, state.shuffledIndices, state.playbackMode]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      play,
      pause,
      togglePlayPause,
      nextTrack,
      previousTrack,
      setVolume,
      setMuted,
      setCurrentTime,
      shuffle,
      getCurrentTrack,
    }),
    [
      state,
      play,
      pause,
      togglePlayPause,
      nextTrack,
      previousTrack,
      setVolume,
      setMuted,
      setCurrentTime,
      shuffle,
      getCurrentTrack,
    ]
  );

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function usePlaylist(): PlaylistContextValue {
  const context = useContext(PlaylistContext);

  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }

  return context;
}
