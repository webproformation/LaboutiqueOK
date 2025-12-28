"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Play, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface VideoStream {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  replay_url: string | null;
  created_at: string;
}

export default function VideoShowcase() {
  const [videos, setVideos] = useState<VideoStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoading(true);

    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('id, title, description, thumbnail_url, replay_url, created_at')
          .eq('status', 'completed')
          .not('replay_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(4);

        if (!error && data) {
          setVideos(data);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();

    return () => {
      setMounted(false);
    };
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-[#F2F2E8] to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Plonge dans l'univers de Morgane
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Inspiration, conseils et coulisses en vidéo
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-300"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F2F2E8] border-2 border-dashed border-[#D4AF37]">
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-6">
                  <Play className="h-10 w-10 text-[#D4AF37]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Bientôt disponible !
                </h3>
                <p className="text-gray-600 mb-6">
                  Les premières vidéos arrivent très prochainement. En attendant, rejoignez nos lives en direct pour ne rien manquer !
                </p>
                <Link
                  href="/live"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#b8933d] text-white font-semibold rounded-lg transition-all duration-300"
                >
                  <Play className="h-5 w-5" />
                  <span>Live & Replay</span>
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {videos.map((video) => (
                <Card
                  key={video.id}
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <Link href={`/live?replay=${video.id}`} className="block">
                    <div className="relative aspect-video overflow-hidden bg-gray-200">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#b8933d]">
                          <Play className="h-16 w-16 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                          <Play className="h-8 w-8 text-[#D4AF37] ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2 text-sm text-[#D4AF37] font-medium">
                        <span>Voir la vidéo</span>
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/live"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#D4AF37] hover:bg-[#b8933d] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Play className="h-5 w-5" />
                <span>Découvrir toutes les vidéos</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
