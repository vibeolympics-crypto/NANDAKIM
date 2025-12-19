/**
 * Music Playlist Type Definitions
 * Types for the AI-generated music playlist feature
 */

// ============================================
// Track Types
// ============================================

/**
 * Represents a single music track in the playlist
 */
export interface Track {
  /** Unique identifier (UUID) */
  id: string;
  /** Track title (max 200 chars) */
  title: string;
  /** Artist/creator name (max 100 chars) */
  artist: string;
  /** Original filename */
  filename: string;
  /** Public URL to MP3 file */
  url: string;
  /** Duration in seconds */
  duration: number;
  /** File size in bytes */
  fileSize: number;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** ISO 8601 timestamp */
  updatedAt: string;
  /** Display order (0-based) */
  order: number;
}

// ============================================
// Playlist Configuration Types
// ============================================

/**
 * Player position options
 */
export type PlayerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'floating';

/**
 * Playback mode options
 */
export type PlaybackMode = 'random' | 'sequential';

/**
 * Visibility configuration
 */
export interface VisibilityConfig {
  /** Whether to show player on web/desktop browsers */
  showOnWeb: boolean;
  /** Whether to show player on mobile browsers */
  showOnMobile: boolean;
}

/**
 * Attribution configuration
 */
export interface AttributionConfig {
  /** Attribution text to display */
  text: string;
  /** Whether to show Suno AI reference */
  showSunoAI: boolean;
}

/**
 * Playlist configuration settings
 */
export interface PlaylistConfig {
  /** Whether the player is enabled */
  enabled: boolean;
  /** Whether to autoplay on page load */
  autoplay: boolean;
  /** Default volume level (0-100) */
  defaultVolume: number;
  /** Playback mode */
  playbackMode: PlaybackMode;
  /** Player position on screen */
  position: PlayerPosition;
  /** Maximum number of tracks (max 50) */
  maxTracks: number;
  /** Visibility settings for web and mobile */
  visibility: VisibilityConfig;
  /** Attribution settings */
  attribution: AttributionConfig;
}

// ============================================
// Playlist State Types
// ============================================

/**
 * Runtime state of the music player
 */
export interface PlaylistState {
  /** Array of all tracks */
  tracks: Track[];
  /** Index of currently playing track */
  currentTrackIndex: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current volume level (0-100) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Current playback mode */
  playbackMode: PlaybackMode;
  /** Shuffled indices for random playback */
  shuffledIndices: number[];
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration of current track in seconds */
  duration: number;
  /** Whether track is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

// ============================================
// Admin Interface Types
// ============================================

/**
 * Available MP3 file in the /public/music/ directory
 */
export interface AvailableFile {
  /** Filename */
  filename: string;
  /** Full path to file */
  path: string;
  /** File size in bytes */
  size: number;
  /** Whether file is already linked to a track */
  alreadyLinked: boolean;
}

/**
 * Form data for adding/editing track metadata
 */
export interface TrackMetadataForm {
  /** Selected filename from available files */
  filename: string;
  /** Track title */
  title: string;
  /** Artist/creator name */
  artist: string;
}

/**
 * Request body for reordering tracks
 */
export interface ReorderTracksRequest {
  /** Array of track IDs in new order */
  trackIds: string[];
}

// ============================================
// API Response Types
// ============================================

/**
 * Response from GET /api/music/playlist
 */
export interface PlaylistResponse {
  /** Array of tracks */
  tracks: Track[];
  /** Playlist configuration */
  config: PlaylistConfig;
}

/**
 * Response from GET /api/admin/music/tracks
 */
export interface TracksListResponse {
  /** Array of tracks with metadata */
  tracks: Track[];
}

/**
 * Response from GET /api/admin/music/files
 */
export interface AvailableFilesResponse {
  /** Array of available MP3 files */
  files: AvailableFile[];
}

/**
 * Response from POST /api/admin/music/tracks
 */
export interface CreateTrackResponse {
  /** Created track */
  track: Track;
}

/**
 * Response from PUT /api/admin/music/tracks/:id
 */
export interface UpdateTrackResponse {
  /** Updated track */
  track: Track;
}

/**
 * Response from DELETE /api/admin/music/tracks/:id
 */
export interface DeleteTrackResponse {
  /** Success message */
  message: string;
}

// ============================================
// Component Props Types
// ============================================

/**
 * Props for MusicPlayer component
 */
export interface MusicPlayerProps {
  /** Player position on screen */
  position?: PlayerPosition;
  /** Whether to autoplay on mount */
  autoplay?: boolean;
  /** Default volume level (0-100) */
  defaultVolume?: number;
}

/**
 * Props for CircularVisualizer component
 */
export interface CircularVisualizerProps {
  /** Array of tracks to display */
  tracks: Track[];
  /** Index of current track */
  currentIndex: number;
  /** Whether audio is playing */
  isPlaying: boolean;
  /** Theme mode */
  theme: 'light' | 'dark';
  /** Callback when track is selected */
  onTrackSelect: (index: number) => void;
}

/**
 * Props for PlaybackControls component
 */
export interface PlaybackControlsProps {
  /** Whether audio is playing */
  isPlaying: boolean;
  /** Current volume level (0-100) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Callback for play/pause toggle */
  onPlayPause: () => void;
  /** Callback for next track */
  onNext: () => void;
  /** Callback for previous track */
  onPrevious: () => void;
  /** Callback for volume change */
  onVolumeChange: (volume: number) => void;
  /** Callback for mute toggle */
  onMuteToggle: () => void;
}

/**
 * Props for TrackInfo component
 */
export interface TrackInfoProps {
  /** Current track (null if none) */
  track: Track | null;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Callback for seeking to specific time */
  onSeek: (time: number) => void;
}

/**
 * Return type for useAudioManager hook
 */
export interface UseAudioManagerReturn {
  /** Play audio */
  play: () => Promise<void>;
  /** Pause audio */
  pause: () => void;
  /** Seek to specific time */
  seek: (time: number) => void;
  /** Set volume level */
  setVolume: (volume: number) => void;
  /** Set muted state */
  setMuted: (muted: boolean) => void;
  /** Current playback time */
  currentTime: number;
  /** Total duration */
  duration: number;
  /** Whether track is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}
