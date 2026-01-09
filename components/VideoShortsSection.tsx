'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Play } from 'lucide-react';
import Link from 'next/link';

interface VideoShort {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
}

export function VideoShortsSection() {
  const [videos, setVideos] = useState<VideoShort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('id, title, thumbnail_url, replay_url, scheduled_start')
        .eq('status', 'ended')
        .not('replay_url', 'is', null)
        .order('scheduled_start', { ascending: false })
        .limit(6);

      if (error) throw error;

      const formatted = data?.map(v => ({
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url || '/lbdm-logoboutique.png',
        video_url: v.replay_url || '',
        duration: 0
      })) || [];

      setVideos(formatted);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || videos.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ color: '#C6A15B' }}>
            Plonge dans l'univers de Morgane
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Inspiration, conseils et coulisses en vidéo
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/live?replay=${video.id}`}
              className="group relative aspect-[9/16] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>

                <h3 className="text-white font-semibold text-sm line-clamp-2">
                  {video.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/live"
            className="inline-block px-8 py-3 bg-[#D4AF37] text-white font-semibold rounded-full hover:bg-[#C5A028] transition-colors"
          >
            Voir tous les replays
          </Link>
        </div>
      </div>
    </section>
  );
}
