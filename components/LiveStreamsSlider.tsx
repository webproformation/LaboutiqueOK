'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Play, Eye, CalendarDays } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  replay_url: string;
  scheduled_start: string;
  actual_start: string;
  actual_end: string;
  total_views: number;
}

export default function LiveStreamsSlider() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoading(true);

    const fetchStreams = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .eq('status', 'ended')
          .not('replay_url', 'is', null)
          .order('actual_end', { ascending: false })
          .limit(6);

        if (error) {
          setStreams([]);
          return;
        }

        setStreams(data || []);
      } catch (error) {
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();

    return () => {
      setMounted(false);
    };
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#C6A15B' }}>
              Plonge dans l'univers de Morgane
            </h2>
            <p className="text-gray-600 text-lg">
              Inspiration, conseils et coulisses en vidéo
            </p>
          </div>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (streams.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#C6A15B' }}>
            Plonge dans l'univers de Morgane
          </h2>
          <p className="text-gray-600 text-lg">
            Inspiration, conseils et coulisses en vidéo
          </p>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {streams.map((stream) => (
              <CarouselItem key={stream.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Link
                  href={`/live?replay=${stream.id}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative aspect-video bg-gray-200">
                      {stream.thumbnail_url ? (
                        <img
                          src={stream.thumbnail_url}
                          alt={stream.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <Play className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <div className="bg-white rounded-full p-4 shadow-xl">
                            <Play className="w-8 h-8" style={{ color: '#C6A15B' }} fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          REPLAY
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-[#C6A15B] transition-colors">
                        {stream.title}
                      </h3>
                      {stream.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {stream.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{stream.total_views || 0} vues</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          <span>
                            {new Date(stream.actual_end).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>

        <div className="text-center mt-8">
          <Link
            href="/live"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            <Play className="w-5 h-5" />
            Voir tous les lives
          </Link>
        </div>
      </div>
    </section>
  );
}
