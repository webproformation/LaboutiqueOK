'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Bell, MessageCircle, ShoppingBag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { LiveVideoPlayer } from '@/components/LiveVideoPlayer';
import { LiveProgressBar } from '@/components/LiveProgressBar';
import { LiveTickerBanner } from '@/components/LiveTickerBanner';
import { LiveEmotionBar } from '@/components/LiveEmotionBar';
import { LiveChat } from '@/components/LiveChat';
import { LiveProducts } from '@/components/LiveProducts';
import { ChestDrawing } from '@/components/ChestDrawing';
import { ReplayChapters } from '@/components/ReplayChapters';

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_start: string;
  playback_url: string | null;
  replay_url: string | null;
  thumbnail_url: string | null;
  viewer_goal: number;
  ticker_text: string | null;
  chest_unlocked: boolean;
  current_viewers: number | null;
  total_views: number | null;
}

export default function LivePage() {
  const { profile } = useAuth();
  const [currentLive, setCurrentLive] = useState<LiveStream | null>(null);
  const [upcomingLives, setUpcomingLives] = useState<LiveStream[]>([]);
  const [replays, setReplays] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLives();

    const channel = supabase
      .channel('live_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams',
        },
        () => {
          loadLives();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (currentLive && profile) {
      joinAsViewer();

      return () => {
        leaveAsViewer();
      };
    }
  }, [currentLive, profile]);

  async function loadLives() {
    try {
      const { data: liveData } = await supabase
        .from('live_streams')
        .select('*')
        .eq('status', 'live')
        .maybeSingle();

      const { data: scheduledData } = await supabase
        .from('live_streams')
        .select('*')
        .eq('status', 'scheduled')
        .order('scheduled_start', { ascending: true })
        .limit(5);

      const { data: replayData } = await supabase
        .from('live_streams')
        .select('*')
        .eq('status', 'ended')
        .not('replay_url', 'is', null)
        .order('scheduled_start', { ascending: false })
        .limit(6);

      setCurrentLive(liveData);
      setUpcomingLives(scheduledData || []);
      setReplays(replayData || []);
    } catch (error) {
      console.error('Error loading lives:', error);
    } finally {
      setLoading(false);
    }
  }

  async function joinAsViewer() {
    if (!currentLive || !profile) return;

    await supabase
      .from('live_viewers')
      .insert({
        live_stream_id: currentLive.id,
        user_id: profile.id,
        is_active: true
      });
  }

  async function leaveAsViewer() {
    if (!currentLive || !profile) return;

    await supabase
      .from('live_viewers')
      .update({
        is_active: false,
        left_at: new Date().toISOString()
      })
      .eq('live_stream_id', currentLive.id)
      .eq('user_id', profile.id)
      .eq('is_active', true);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (currentLive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <LiveTickerBanner text={currentLive.ticker_text || 'Bienvenue dans le live de Morgane ! 💎'} />

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LiveVideoPlayer
                liveStreamId={currentLive.id}
                playbackUrl={currentLive.playback_url || ''}
                isLive={true}
              />

              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">
                  {currentLive.title}
                </h1>
                <LiveEmotionBar liveStreamId={currentLive.id} />
              </div>

              <LiveProgressBar
                liveStreamId={currentLive.id}
                viewerGoal={currentLive.viewer_goal}
              />

              <ChestDrawing
                liveStreamId={currentLive.id}
                isUnlocked={currentLive.chest_unlocked}
                isAdmin={profile?.is_admin || false}
              />

              {currentLive.description && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-6">
                    <p className="text-gray-300">{currentLive.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="bg-gray-800 border-gray-700 h-[700px] flex flex-col">
                <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                  <TabsList className="bg-gray-900 border-b border-gray-700">
                    <TabsTrigger value="chat" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex-1">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Produits
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
                    <LiveChat liveStreamId={currentLive.id} />
                  </TabsContent>

                  <TabsContent value="products" className="flex-1 overflow-auto m-0">
                    <LiveProducts liveStreamId={currentLive.id} />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            icon={Video}
            title="Live Shopping & Replay"
            description="Rejoignez Morgane en direct pour découvrir nos nouveautés et profiter d'offres exclusives"
          />

          {upcomingLives.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🔜 Prochains Lives
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {upcomingLives.map((live) => (
                  <Card key={live.id} className="overflow-hidden border-2 border-blue-200 bg-blue-50">
                    {live.thumbnail_url && (
                      <div className="relative aspect-video">
                        <img
                          src={live.thumbnail_url}
                          alt={live.title}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-4 left-4 bg-blue-600">
                          📅 Programmé
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{live.title}</h3>
                      <p className="text-gray-600 mb-4">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        {formatDate(live.scheduled_start)}
                      </p>
                      {live.description && (
                        <p className="text-gray-700 text-sm line-clamp-2">
                          {live.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {replays.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📼 Replays Disponibles
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {replays.map((live) => (
                  <Link
                    key={live.id}
                    href={`/live/${live.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
                      <div className="relative aspect-video bg-gray-100">
                        {live.thumbnail_url ? (
                          <img
                            src={live.thumbnail_url}
                            alt={live.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <Badge className="absolute bottom-2 right-2 bg-black/80">
                          {live.total_views || 0} vues
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                          {live.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(live.scheduled_start)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-[#C6A15B]" />
                  <h3 className="text-xl font-bold">Horaires des lives</h3>
                </div>
                <div>
                  <p className="font-semibold">Facebook Live</p>
                  <p className="text-gray-600">Plusieurs fois par semaine</p>
                </div>
                <div>
                  <p className="font-semibold">TikTok Live</p>
                  <p className="text-gray-600">Sessions spéciales</p>
                </div>
                <p className="text-sm text-gray-500">
                  Les horaires sont annoncés sur nos réseaux sociaux. Suivez-nous pour ne rien manquer !
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-[#C6A15B]" />
                  <h3 className="text-xl font-bold">Notifications</h3>
                </div>
                <p className="text-gray-600">
                  Activez les notifications sur nos réseaux sociaux pour être alerté au démarrage de chaque live.
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full" variant="outline">
                    <a
                      href="https://www.facebook.com/p/La-boutique-de-Morgane-100057420760713/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Suivre sur Facebook
                    </a>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <a
                      href="https://www.tiktok.com/@laboutiquedemorgane"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Suivre sur TikTok
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#C6A15B]/5 border-[#C6A15B]/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">Pourquoi participer à nos lives ?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <p>Découvrez nos nouveautés en avant-première</p>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <p>Profitez d'offres exclusives réservées aux participants</p>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <p>Posez vos questions à Morgane en direct</p>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <p>Participez à nos jeux et tirages au sort pour gagner des cadeaux</p>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#C6A15B] flex-shrink-0 mt-0.5" />
                  <p>Profitez d'une ambiance conviviale et chaleureuse</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
