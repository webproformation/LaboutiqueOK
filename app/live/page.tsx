"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Radio, Calendar, PlayCircle, Clock, Eye } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-client';
import LivePlayer from '@/components/LivePlayer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended';
  scheduled_start: string;
  actual_start: string | null;
  actual_end: string | null;
  thumbnail_url: string | null;
  playback_url: string | null;
  replay_url: string | null;
  current_viewers: number;
  total_views: number;
  created_at: string;
}

export default function LivePage() {
  const [loading, setLoading] = useState(true);
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [scheduledStreams, setScheduledStreams] = useState<LiveStream[]>([]);
  const [pastStreams, setPastStreams] = useState<LiveStream[]>([]);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const { data: streams, error } = await supabase
          .from('live_streams')
          .select('*')
          .order('scheduled_start', { ascending: false });

        if (error) throw error;

        if (streams) {
          const live = streams.find(s => s.status === 'live') || null;
          const scheduled = streams.filter(s => s.status === 'scheduled');
          const past = streams.filter(s => s.status === 'ended');

          setLiveStream(live);
          setScheduledStreams(scheduled);
          setPastStreams(past);
        }
      } catch (error) {
        console.error('Error fetching streams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();

    const channel = supabase
      .channel('live-streams-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_streams'
      }, () => {
        fetchStreams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Radio className="h-8 w-8 text-red-600 animate-pulse" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="aspect-video w-full rounded-lg mb-8" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Radio className="h-8 w-8 text-red-600" />
          <h1 className="text-4xl font-bold text-gray-900">Live & Replay</h1>
        </div>

        {liveStream && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Radio className="h-6 w-6 text-red-600 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-900">Live en cours</h2>
              <Badge variant="destructive" className="animate-pulse">
                EN DIRECT
              </Badge>
            </div>
            <LivePlayer
              streamId={liveStream.id}
              autoplay={true}
              showChat={true}
              showProducts={true}
            />
          </div>
        )}

        {!liveStream && (
          <Card className="mb-12 border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Radio className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Aucun live en cours
              </h2>
              <p className="text-gray-500 text-center">
                Consultez le planning ci-dessous pour nos prochains lives
              </p>
            </CardContent>
          </Card>
        )}

        {scheduledStreams.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Planning des prochains lives</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scheduledStreams.map((stream) => (
                <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-blue-50">
                    {stream.thumbnail_url ? (
                      <Image
                        src={stream.thumbnail_url}
                        alt={stream.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Calendar className="h-16 w-16 text-blue-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-blue-600">
                        <Clock className="h-3 w-3 mr-1" />
                        À venir
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{stream.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {stream.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(stream.scheduled_start), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pastStreams.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <PlayCircle className="h-6 w-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">Replays</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastStreams.map((stream) => (
                <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-50">
                    {stream.thumbnail_url ? (
                      <Image
                        src={stream.thumbnail_url}
                        alt={stream.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <PlayCircle className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <PlayCircle className="h-16 w-16 text-white" />
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary">
                        Replay
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{stream.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {stream.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(stream.actual_start || stream.scheduled_start), "d MMMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      {stream.total_views > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Eye className="h-4 w-4" />
                          <span>{stream.total_views} vues</span>
                        </div>
                      )}
                      {stream.replay_url && (
                        <Button
                          asChild
                          className="w-full mt-4"
                          variant="outline"
                        >
                          <a href={stream.replay_url} target="_blank" rel="noopener noreferrer">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Voir le replay
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!liveStream && scheduledStreams.length === 0 && pastStreams.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Radio className="h-20 w-20 text-gray-300 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-600 mb-3">
                Aucun live disponible
              </h2>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Nous n'avons pas encore de lives programmés. Revenez bientôt pour découvrir nos sessions shopping en direct et profiter d'offres exclusives.
              </p>
              <Button asChild>
                <Link href="/">
                  Retour à l'accueil
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
