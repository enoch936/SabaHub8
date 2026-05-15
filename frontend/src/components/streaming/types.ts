// Streaming Platform Types
export interface StreamUser {
  id: string;
  name: string;
  role: 'host' | 'guest' | 'moderator' | 'viewer';
  avatar: string;
  isLive: boolean;
  isTyping: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  timestamp: number;
  reactions: ChatReaction[];
  isPinned?: boolean;
  isSystemMessage?: boolean;
}

export interface ChatReaction {
  type: 'heart' | 'fire' | 'clap' | 'like' | 'laugh' | 'thinking';
  emoji: string;
  count: number;
}

export interface AudienceReaction {
  id: string;
  type: 'heart' | 'fire' | 'clap' | 'like' | 'laugh' | 'thinking';
  emoji: string;
  x: number;
  y: number;
  timestamp: number;
  duration: number;
}

export interface StreamAnalytics {
  viewers: number;
  peakViewers: number;
  avgEngagement: number;
  bitrate: string;
  latency: number;
  fps: number;
  resolution: string;
  donations: number;
  likes: number;
  shares: number;
}

export interface DeviceConfig {
  type: 'webcam' | 'dslr' | 'obs' | 'vlc' | 'mixer' | 'capture_card';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  resolution?: string;
  framerate?: number;
}

export interface SceneConfig {
  id: string;
  name: string;
  thumbnail: string;
  layers: number;
  isActive: boolean;
}

export interface StreamSettings {
  quality: 'auto' | '1080p60' | '1080p30' | '720p60' | '720p30' | '480p30';
  bitrate: number;
  audio: boolean;
  video: boolean;
  screenShare: boolean;
  recordLocally: boolean;
  recordCloud: boolean;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'scene_change' | 'guest_join' | 'donation' | 'milestone' | 'clip';
  title: string;
  icon: string;
}

export interface MediaQueueItem {
  id: string;
  type: 'clip' | 'music' | 'video';
  title: string;
  duration: number;
  thumbnail: string;
  queued_by: string;
}
