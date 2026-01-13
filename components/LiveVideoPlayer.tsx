'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

interface LiveVideoPlayerProps {
  liveStreamId: string;
  playbackUrl: string;
  replayUrl?: string | null;
  isLive: boolean;
}

export function LiveVideoPlayer({ liveStreamId, playbackUrl, replayUrl, isLive }: LiveVideoPlayerProps) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!isLive) return;

    loadViewerCount();

    const channel = supabase
      .channel(`live_viewers_${liveStreamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_viewers',
          filter: `live_stream_id=eq.${liveStreamId}`,
        },
        () => {
          loadViewerCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveStreamId, isLive]);

  async function loadViewerCount() {
    const { count } = await supabase
      .from('live_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('live_stream_id', liveStreamId)
      .eq('is_active', true);

    setViewerCount(count || 0);
  }

  const videoUrl = isLive ? playbackUrl : (replayUrl || playbackUrl);
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const embedUrl = isYouTube
    ? videoUrl.replace('watch?v=', 'embed/').split('&')[0]
    : videoUrl;

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      {isYouTube ? (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          src={embedUrl}
          className="w-full h-full"
          controls
          autoPlay={isLive}
        />
      )}

      {isLive && (
        <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
          <Badge className="bg-red-600 text-white px-3 py-1.5 animate-pulse shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span className="font-bold">EN DIRECT</span>
            </div>
          </Badge>

          <Badge className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-semibold">{viewerCount} Copinettes</span>
            </div>
          </Badge>
        </div>
      )}
    </div>
  );
}
