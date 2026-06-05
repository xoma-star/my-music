export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  trackNo?: number;
  durationSec: number;
  path: string;
  codec: string;
  bitrate?: number;
  hasCover: boolean;
  liked?: boolean;
}
