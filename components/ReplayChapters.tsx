'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Chapter {
  id: string;
  timestamp: number;
  title: string;
  thumbnail_url: string | null;
  product_id: string | null;
  products?: any;
}

interface ReplayChaptersProps {
  liveStreamId: string;
  onSeek?: (seconds: number) => void;
}

export function ReplayChapters({ liveStreamId, onSeek }: ReplayChaptersProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    loadChapters();
  }, [liveStreamId]);

  async function loadChapters() {
    const { data, error } = await supabase
      .from('live_timestamps')
      .select(`
        id,
        timestamp,
        title,
        thumbnail_url,
        product_id,
        products (
          name,
          image_url
        )
      `)
      .eq('live_stream_id', liveStreamId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error loading chapters:', error);
      return;
    }

    setChapters(data || []);
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function handleSeek(timestamp: number) {
    onSeek?.(timestamp);

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = timestamp;
    }

    const iframeElement = document.querySelector('iframe');
    if (iframeElement && iframeElement.src.includes('youtube')) {
      const newSrc = iframeElement.src.split('?')[0] + `?start=${timestamp}&autoplay=1`;
      iframeElement.src = newSrc;
    }
  }

  if (chapters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun chapitre disponible pour ce replay</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        📑 Chapitres du Replay ({chapters.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() => handleSeek(chapter.timestamp)}
            className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 text-left"
          >
            <div className="relative aspect-video bg-gray-100">
              {chapter.thumbnail_url ? (
                <img
                  src={chapter.thumbnail_url}
                  alt={chapter.title}
                  className="w-full h-full object-cover"
                />
              ) : chapter.products?.image_url ? (
                <img
                  src={chapter.products.image_url}
                  alt={chapter.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Pas d'image
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
              </div>

              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatTime(chapter.timestamp)}
              </div>
            </div>

            <div className="p-3">
              <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                {chapter.title}
              </h4>
              {chapter.products && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                  {chapter.products.name}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
