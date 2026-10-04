import type { FeedContent } from '../types';

export const mimeTypes = {
  MP4: 'video/mp4',
  HLS: 'video/mp4', // Represent HLS as mp4 for podcast player compatibility
  MP3: 'audio/mp3',
  M4B: 'audio/mp4',
  HLS_ALTERNATE: 'application/x-mpegURL',
} as const satisfies Record<FeedContent['contentType'] | 'HLS_ALTERNATE', string>;
