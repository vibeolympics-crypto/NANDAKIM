/**
 * MusicPlayer Component
 * Main container component that orchestrates the entire music player experience
 *
 * Requirements: 1.1, 2.1, 6.1, 6.2, 6.3, 10.1, 10.2, 10.3, 10.4
 */

import React, {
  useEffect,
  memo,
  useState,
  useRef,
  useMemo,
  useCallback,
  ReactPortal
} from 'react';

import { usePlaylist, PlaylistProvider } from '../contexts/PlaylistContext';
import { useAudioManager } from '../hooks/useAudioManager';
import {
  Track,
  PlayerPosition,
  PlaylistResponse,
  MusicPlayerProps
} from '../types/music';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music as MusicIcon,
  Loader2
} from 'lucide-react';

import './MusicPlayer.css';

const MIN_AUDIO_FILE_SIZE_BYTES = 1024;

const sanitizeTracks = (tracks: Track[] = []): Track[] => {
  return tracks.filter((track) => {
    if (!track || !track.url) {
      return false;
    }

    if (
      typeof track.fileSize === 'number' &&
      track.fileSize > 0 &&
      track.fileSize < MIN_AUDIO_FILE_SIZE_BYTES
    ) {
      return false;
    }

    return true;
  });
};

// ============================================
// Position Styles - Requirement 6.1, 6.2
// ============================================

/**
 * Position styles for the music player
 * - bottom-right/left: Non-intrusive placement at bottom corners
 * - top-right/left: Alternative placement at top corners (below header)
 * - floating: Centered vertically on right side
 * - z-50: High z-index to stay above footer and most content but below modals
 * - Mobile z-45: Lower than z-50 to ensure proper stacking with other floating elements
 */
const POSITION_STYLES: Record<PlayerPosition, string> = {
  'bottom-right': 'fixed bottom-6 right-6 z-50',
  'bottom-left': 'fixed bottom-8 left-6 z-50',
  'top-right': 'fixed top-24 right-6 z-50', // top-24 to avoid header
  'top-left': 'fixed top-24 left-6 z-50', // top-24 to avoid header
  floating: 'fixed bottom-1/4 right-6 z-50',
};

// ============================================
// Inner Component (with context access)
// ============================================

interface MusicPlayerInnerProps {
  position: PlayerPosition;
  autoplay: boolean;
}

interface MusicPlayerInnerPropsExtended extends MusicPlayerInnerProps {
  tracks: Track[];
}

const MusicPlayerInner = memo(function MusicPlayerInner({
  position,
  autoplay,
  tracks,
}: MusicPlayerInnerPropsExtended) {

  const {
    state,
    dispatch,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume: setPlaylistVolume,
    setMuted: setPlaylistMuted,
    setCurrentTime,
    getCurrentTrack,
  } = usePlaylist();

  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(false);
  const tracksLoadedRef = useRef(false);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup volume timeout
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, []);

  // Requirement 6.3: Detect viewport size for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typical mobile breakpoint
    };

    // Check on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load tracks into playlist context - only once using ref
  useEffect(() => {
    if (tracks.length > 0 && !tracksLoadedRef.current) {
      dispatch({ type: 'SET_TRACKS', payload: tracks });
      tracksLoadedRef.current = true;
    }
  }, [tracks, dispatch]);

  // Requirement 6.3: Apply mobile-specific layout adjustments - memoized
  // Fix: Add explicit display property, CSS class for visibility, and ensure proper stacking
  const containerClasses = useMemo(() => {
    const baseClasses = 'music-player-container';
    const deviceClass = isMobile ? 'mobile' : 'desktop';

    return isMobile
      ? `${baseClasses} ${deviceClass} music-player-glow fixed bottom-0 left-1/2 -translate-x-1/2 z-[45] flex items-center gap-1.5 bg-gradient-to-b from-background/95 to-background/85 backdrop-blur-xl border border-white/10 rounded-t-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] px-2.5 py-1.5 transition-all duration-300 max-w-[calc(100%-1rem)] min-w-fit w-full`
      : `${baseClasses} ${deviceClass} music-player-glow fixed bottom-6 left-6 z-50 flex items-center gap-2.5 bg-gradient-to-br from-background/70 to-background/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 transition-all duration-300 hover:from-background/80 hover:to-background/70 hover:scale-[1.02] w-fit`;
  }, [isMobile, position]);

  const contentClasses = useMemo(
    () => (isMobile ? 'flex flex-col gap-2 w-full' : 'flex flex-col gap-4 w-full max-w-md'),
    [isMobile]
  );

  // Get current track - memoized to avoid recalculation
  const currentTrack = useMemo(() => {
    const track = getCurrentTrack();
    console.log(`[MusicPlayer] Current track updated: index=${state.currentTrackIndex}, track=${track?.title || 'null'}, url=${track?.url || 'null'}`);
    return track;
  }, [getCurrentTrack, state.currentTrackIndex]);

  // Preload next track for smoother transitions
  const nextTrackUrl = useMemo(() => {
    if (state.tracks.length === 0) return null;
    const nextIndex = (state.currentTrackIndex + 1) % state.tracks.length;
    const actualIndex =
      state.playbackMode === 'random' ? state.shuffledIndices[nextIndex] : nextIndex;
    return state.tracks[actualIndex]?.url || null;
  }, [state.tracks, state.currentTrackIndex, state.shuffledIndices, state.playbackMode]);

  // Preload next track
  useEffect(() => {
    if (nextTrackUrl) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'audio';
      link.href = nextTrackUrl;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [nextTrackUrl]);

  // Audio manager hook
  const audioManager = useAudioManager({
    trackUrl: currentTrack?.url || null,
    onEnded: () => {
      // Requirement 2.3: Automatically play next track on completion
      nextTrack();
    },
    onTimeUpdate: (time) => {
      setCurrentTime(time);
    },
    initialVolume: state.volume / 100,
    initialMuted: state.isMuted,
  });

  // Sync audio manager with playlist state
  useEffect(() => {
    if (state.isPlaying) {
      audioManager.play().catch((error) => {
        // Requirement 10.3: Detect autoplay blocking - silently handle
        if (error.name === 'NotAllowedError' && !hasUserInteracted) {
          setAutoplayBlocked(true);
          dispatch({ type: 'SET_PLAYING', payload: false });
          // Don't log - this is expected browser behavior
        } else {
          // Silently handle unexpected errors
        }
      });
    } else {
      audioManager.pause();
    }
  }, [state.isPlaying, audioManager, hasUserInteracted, dispatch]);

  // Local volume state - completely independent from context
  const [localVolume, setLocalVolume] = useState(state.volume);
  const volumeTimeoutRef = useRef<NodeJS.Timeout>();
  const [showVolumePanel, setShowVolumePanel] = useState(false);

  // Initialize local volume only once on mount
  useEffect(() => {
    setLocalVolume(state.volume);
  }, []); // Empty deps - only run once

  // Sync muted state to audio manager only (one-way)
  useEffect(() => {
    audioManager.setMuted(state.isMuted);
  }, [state.isMuted, audioManager]);

  // Update duration from audio manager
  useEffect(() => {
    if (audioManager.duration > 0) {
      dispatch({ type: 'SET_DURATION', payload: audioManager.duration });
    }
  }, [audioManager.duration, dispatch]);

  // Debounce ref for error handling to prevent infinite loop
  const errorSkipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastErrorTimeRef = useRef<number>(0);

  // Requirement 10.1: Handle track loading failures with debounce
  useEffect(() => {
    if (audioManager.error) {
      // Only handle if it's not an autoplay error
      if (
        !audioManager.error.includes('NotAllowedError') &&
        !audioManager.error.includes("user didn't interact")
      ) {
        const now = Date.now();
        // Debounce: prevent rapid track skipping (minimum 1 second between skips)
        if (now - lastErrorTimeRef.current < 1000) {
          console.log('[MusicPlayer] Debouncing error skip - too fast');
          return;
        }

        // Clear any pending timeout
        if (errorSkipTimeoutRef.current) {
          clearTimeout(errorSkipTimeoutRef.current);
        }

        // Delay the skip to allow state to settle
        errorSkipTimeoutRef.current = setTimeout(() => {
          lastErrorTimeRef.current = Date.now();
          console.log('[MusicPlayer] Skipping to next track due to error');
          nextTrack();
        }, 500);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (errorSkipTimeoutRef.current) {
        clearTimeout(errorSkipTimeoutRef.current);
      }
    };
  }, [audioManager.error, nextTrack]);

  // Requirement 2.1: Attempt autoplay on mount
  useEffect(() => {
    if (autoplay && state.tracks.length > 0 && !state.isPlaying) {
      dispatch({ type: 'SET_PLAYING', payload: true });
    }
  }, [autoplay, state.tracks.length]); // Only run on mount

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    setHasUserInteracted(true);
    setAutoplayBlocked(false);
    togglePlayPause();
  }, [togglePlayPause]);

  // Handle volume change - only update audio, never update context during playback
  const handleVolumeChange = useCallback(
    (volume: number) => {
      // Update local state immediately for responsive UI
      setLocalVolume(volume);
      // Apply volume directly to audio manager
      audioManager.setVolume(volume / 100);

      // Don't update context at all - it causes remount
      // Volume will be saved when component unmounts or track changes
    },
    [audioManager]
  );

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    setPlaylistMuted(!state.isMuted);
  }, [state.isMuted, setPlaylistMuted]);

  // Handle seek
  const handleSeek = useCallback(
    (time: number) => {
      audioManager.seek(time);
      setCurrentTime(time);
    },
    [audioManager, setCurrentTime]
  );

  // Handle track selection from visualizer
  const handleTrackSelect = useCallback(
    (index: number) => {
      console.log(`[MusicPlayer] Track selected: index=${index}, trackId=${state.tracks[index]?.id}`);
      setHasUserInteracted(true);
      setAutoplayBlocked(false);
      dispatch({ type: 'SET_CURRENT_TRACK_INDEX', payload: index });
      dispatch({ type: 'SET_PLAYING', payload: true });
      console.log(`[MusicPlayer] Dispatched SET_CURRENT_TRACK_INDEX and SET_PLAYING`);
    },
    [dispatch, state.tracks]
  );

  // Requirement 10.2: Display empty playlist message with enhanced styling
  // Fix: Add explicit display property and CSS class for visibility
  if (state.tracks.length === 0) {
    const emptyStateClass = isMobile
      ? `z-[45] fixed bottom-0 left-1/2 -translate-x-1/2 w-full rounded-t-2xl`
      : `${POSITION_STYLES[position]}`;

    return (
      <div
        className={`music-player-container music-player-glow desktop position-${position} ${emptyStateClass} flex bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 animate-in fade-in duration-500`}
      >
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/10 flex items-center justify-center border border-white/10">
            <MusicIcon className="w-8 h-8 text-primary/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">♫ No music available</p>
            <p className="text-xs text-muted-foreground">Check back later for updates</p>
          </div>
        </div>
      </div>
    );
  }

  // Safeguard: Ensure we have a valid current track or show empty state
  if (!currentTrack && state.tracks.length > 0) {
    // Silently handle - not an error condition
  }

  return (
    <div
      className={containerClasses}
      role="region"
      aria-label="Music player"
      data-testid="music-player"
      style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Requirement 10.3: Show manual play button if autoplay blocked */}
      {autoplayBlocked && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center z-10 animate-in fade-in">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-xs font-medium shadow-lg shadow-primary/20"
            aria-label="Start playing music"
          >
            Click to Play
          </button>
        </div>
      )}

      {/* Main Container - Horizontal Layout */}
      <div className={`flex items-center w-full ${isMobile ? 'gap-1 flex-nowrap overflow-x-auto' : 'gap-2'}`}>
        
        {/* 1. Album Art / Playback Status Icon */}
        <div className={`relative flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner group-hover:shadow-primary/20 transition-all duration-500 ${
          isMobile ? 'w-8 h-8' : 'w-10 h-10'
        }`}>
          {state.isPlaying ? (
            <div className={`flex gap-[2px] items-end ${isMobile ? 'h-3' : 'h-4'}`}>
              <div className={`bg-gradient-to-t from-cyan-400 to-cyan-500 animate-music-bar-1 rounded-full ${isMobile ? 'w-[2px] h-1.5' : 'w-[3px] h-2'}`}></div>
              <div className={`bg-gradient-to-t from-green-400 to-emerald-500 animate-music-bar-2 rounded-full ${isMobile ? 'w-[2px] h-3' : 'w-[3px] h-4'}`}></div>
              <div className={`bg-gradient-to-t from-purple-400 to-pink-500 animate-music-bar-3 rounded-full ${isMobile ? 'w-[2px] h-2' : 'w-[3px] h-3'}`}></div>
              <div className={`bg-gradient-to-t from-yellow-400 to-orange-500 animate-music-bar-4 rounded-full ${isMobile ? 'w-[2px] h-1.5' : 'w-[3px] h-2'}`}></div>
            </div>
          ) : (
            <MusicIcon className={isMobile ? 'w-4 h-4 text-primary' : 'w-5 h-5 text-primary'} />
          )}
        </div>

        {/* 2. Track Info */}
        <div className={`flex flex-col overflow-hidden flex-shrink-0 ${
          isMobile ? 'min-w-[60px] max-w-[70px]' : 'min-w-[120px] max-w-[150px]'
        }`}>
          <span className={`font-semibold truncate text-foreground/90 ${
            isMobile ? 'text-[8px]' : 'text-[11px]'
          }`}>
            {currentTrack?.title || 'No track'}
          </span>
          <span className={`text-muted-foreground truncate font-medium ${
            isMobile ? 'text-[7px]' : 'text-[9px]'
          }`}>
            {currentTrack?.artist || 'Unknown'}
          </span>
        </div>

        {/* 3. Previous Button */}
        <button
          onClick={previousTrack}
          className={`hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-90 rounded-full cursor-pointer touch-none flex-shrink-0 ${
            isMobile ? 'p-1' : 'p-1.5'
          }`}
          aria-label="Previous track"
          type="button"
        >
          <SkipBack className={isMobile ? 'w-3 h-3 fill-current' : 'w-3.5 h-3.5 fill-current'} />
        </button>

        {/* 4. Play/Pause Button - Main Action */}
        <button
          onClick={handlePlayPause}
          type="button"
          className={`flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-110 active:scale-95 rounded-full cursor-pointer touch-none flex-shrink-0 ${
            isMobile ? 'w-9 h-9' : 'w-10 h-10'
          }`}
          aria-label={state.isPlaying ? 'Pause' : 'Play'}
        >
          {state.isPlaying ? (
            <Pause className={isMobile ? 'w-4 h-4 fill-current' : 'w-5 h-5 fill-current'} />
          ) : (
            <Play className={isMobile ? 'w-4 h-4 fill-current ml-0.5' : 'w-5 h-5 fill-current ml-0.5'} />
          )}
        </button>

        {/* 5. Next Button */}
        <button
          onClick={nextTrack}
          type="button"
          className={`hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-90 rounded-full cursor-pointer touch-none flex-shrink-0 ${
            isMobile ? 'p-1' : 'p-1.5'
          }`}
          aria-label="Next track"
        >
          <SkipForward className={isMobile ? 'w-3 h-3 fill-current' : 'w-3.5 h-3.5 fill-current'} />
        </button>

        {/* 6. Playlist Toggle */}
        <div className="relative group/playlist flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylistPanel(!showPlaylistPanel);
            }}
            className={`rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer active:scale-90 touch-none ${
              isMobile ? 'p-1.5' : 'p-2'
            }`}
            aria-label="Toggle playlist"
            type="button"
            title="Show playlist"
          >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isMobile ? 'w-3 h-3' : 'w-4 h-4'}
          >
            <path d="M21 15V6" />
            <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            <path d="M12 12H3" />
            <path d="M16 6H3" />
            <path d="M12 18H3" />
          </svg>
        </button>

        {/* Playlist Panel - Fixed overlay without Portal for better event handling */}
        {showPlaylistPanel && (
          <div
            className={`fixed bg-gradient-to-b from-background/98 to-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-y-auto z-50`}
            style={{ 
              width: '288px',
              maxHeight: '384px',
              left: isMobile ? 'auto' : '24px',
              right: isMobile ? '24px' : 'auto',
              bottom: isMobile ? '100px' : '100px',
              top: 'auto',
              scrollbarWidth: 'thin',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={isMobile ? 'p-3' : 'p-4'}>
              <h3 className="text-sm font-semibold mb-3 text-foreground/90 flex items-center justify-between">
                <span>Playlist ({state.tracks.length})</span>
                <button
                  onClick={() => setShowPlaylistPanel(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close playlist"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </h3>
              <div className="space-y-1">
                {state.tracks.map((track, index) => (
                  <button
                    key={track.id || index}
                    onClick={() => {
                      console.log(`[Playlist Item Click] Clicked track: index=${index}, title=${track.title}`);
                      handleTrackSelect(index);
                      setShowPlaylistPanel(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 hover:bg-primary/10 ${
                      index === state.currentTrackIndex
                        ? 'bg-primary/20 text-primary'
                        : 'text-foreground/70 hover:text-foreground'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium w-6 text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artist}
                        </p>
                      </div>
                      {index === state.currentTrackIndex && state.isPlaying && (
                        <div className="flex gap-[2px] items-end h-3">
                          <div className="w-[2px] bg-primary animate-music-bar-1 h-1 rounded-full"></div>
                          <div className="w-[2px] bg-primary animate-music-bar-2 h-3 rounded-full"></div>
                          <div className="w-[2px] bg-primary animate-music-bar-3 h-2 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Volume Control */}
      <div className="relative group/volume flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowVolumePanel(!showVolumePanel);
          }}
          className={`rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer active:scale-90 touch-none ${
            isMobile ? 'p-1' : 'p-1.5'
          }`}
          aria-label={state.isMuted ? 'Unmute' : 'Mute'}
          type="button"
          title="Volume control"
        >
          {state.isMuted || state.volume === 0 ? (
            <VolumeX className={isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          ) : (
            <Volume2 className={isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          )}
        </button>

        {/* Vertical Volume Slider Panel - Fixed overlay without Portal for better event handling */}
        {showVolumePanel && (
          <div
            className={`fixed bg-gradient-to-b from-background/98 to-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              height: '160px',
              width: '52px',
              right: isMobile ? '24px' : '24px',
              bottom: isMobile ? '100px' : '100px',
              top: 'auto',
              left: 'auto',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%'
            }}>
              <input
                type="range"
                min="0"
                max="100"
                value={localVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="volume-slider appearance-none bg-transparent cursor-pointer"
                aria-label="Volume"
                aria-orientation="vertical"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  width: '100%',
                  height: '100%',
                  accentColor: 'hsl(152 75% 35%)'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {audioManager.isLoading && (
        <div className="absolute top-0 right-0 -mt-1 -mr-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>
      )}
      
      </div>
      {/* End of Main Container */}
    </div>
  );
});

// ============================================
// Main Component (with provider)
// ============================================

export function MusicPlayer({
  position = 'bottom-left',
  autoplay = true,
  defaultVolume = 70,
}: MusicPlayerProps) {
  const [playlistData, setPlaylistData] = useState<PlaylistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Requirement 5.3, 5.4: Detect device type for visibility control
  useEffect(() => {
    const checkDevice = () => {
      // Check both screen size and user agent for mobile detection
      const isMobileScreen = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobileDevice(isMobileScreen || isMobileUA);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Fetch playlist data on mount (using static JSON file)
  useEffect(() => {
    async function fetchPlaylist() {
      try {
        setIsLoading(true);
        setError(null);

        // Use static JSON file instead of API endpoint for static hosting
        const response = await fetch('/music-playlist.json');

        if (!response.ok) {
          throw new Error(`Failed to fetch playlist: ${response.statusText}`);
        }

        const responseData = await response.json();
        // Handle response format: { ok: true, data: { config, tracks } }
        const data: PlaylistResponse = responseData.data || responseData;
        const sanitizedTracks = sanitizeTracks(data.tracks);

        // Tracks have been sanitized

        setPlaylistData({
          ...data,
          tracks: sanitizedTracks,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load playlist';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylist();
  }, []);

  // Show loading state with animation
  // Fix: Add explicit display property and CSS class for visibility
  if (isLoading) {
    const loadingStateClass = isMobileDevice
      ? `z-[45] fixed bottom-0 left-1/2 -translate-x-1/2 w-full rounded-t-2xl`
      : `${POSITION_STYLES[position]}`;

    return (
      <div
        className={`music-player-container music-player-glow desktop position-${position} ${loadingStateClass} flex bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 animate-in fade-in duration-300`}
      >
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading music player...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !playlistData) {
    // Requirement 10.4: Silently handle errors without showing technical details
    return null; // Don't show player if there's an error
  }

  // Don't render if player is disabled or config is missing
  if (!playlistData.config || !playlistData.config.enabled) {
    return null;
  }

  // Requirement 5.3, 5.4, 5.5: Check visibility settings based on device type
  const visibility = playlistData.config.visibility;
  
  if (visibility) {
    // If on mobile and mobile visibility is disabled, don't render
    const mobileVisible = visibility.showOnMobile ?? true;
    const desktopVisible = visibility.showOnWeb ?? true;
    
    if (isMobileDevice && !mobileVisible) {
      return null;
    }
    // If on web/desktop and web visibility is disabled, don't render
    if (!isMobileDevice && !desktopVisible) {
      return null;
    }
  }

  // Use config values or props
  const effectivePosition = playlistData.config.position || position;
  const effectiveAutoplay = playlistData.config.autoplay ?? autoplay;
  const effectiveVolume = playlistData.config.defaultVolume || defaultVolume;

  // Wrap in error boundary-like try-catch for rendering
  try {
    return (
      <PlaylistProvider
        initialPlaybackMode={playlistData.config.playbackMode}
        initialVolume={effectiveVolume}
      >
        <MusicPlayerInner
          position={effectivePosition}
          autoplay={effectiveAutoplay}
          tracks={playlistData.tracks}
        />
      </PlaylistProvider>
    );
  } catch (error) {
    // Silently handle rendering errors
    return null;
  }
}
