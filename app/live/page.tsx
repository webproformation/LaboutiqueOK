'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Bell, Eye, Clock } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_start: string;
  actual_start: string | null;
  thumbnail_url: string | null;
  playback_url: string | null;
  replay_url: string | null;
  current_viewers: number | null;
  total_views: number | null;
}

export default function LivePage() {
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLives();
  }, []);

  async function loadLives() {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .in('status', ['scheduled', 'live', 'ended'])
        .order('scheduled_start', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLives(data || []);
    } catch (error) {
      console.error('Error loading lives:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-600 text-white">🔴 EN DIRECT</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">📅 Programmé</Badge>;
      case 'ended':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">📼 Replay</Badge>;
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          icon={Video}
          title="Live Shopping & Replay"
          description="Rejoignez Morgane en direct pour découvrir nos nouveautés et profiter d'offres exclusives"
        />

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des lives...</p>
          </div>
        ) : lives.length > 0 ? (
          <div className="space-y-6 mb-12">
            {lives.map((live) => (
              <Card key={live.id} className="overflow-hidden">
                <div className="md:flex">
                  {live.thumbnail_url && (
                    <div className="md:w-1/3 relative">
                      <img
                        src={live.thumbnail_url}
                        alt={live.title}
                        className="w-full h-full object-cover"
                      />
                      {live.status === 'live' && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-red-600 text-white animate-pulse">
                            🔴 EN DIRECT
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="md:flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{live.title}</h3>
                        {getStatusBadge(live.status)}
                      </div>
                    </div>

                    {live.description && (
                      <p className="text-gray-600 mb-4">{live.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(live.scheduled_start).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {(live.current_viewers || live.total_views) && (
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {live.status === 'live'
                            ? `${live.current_viewers || 0} spectateurs`
                            : `${live.total_views || 0} vues`
                          }
                        </div>
                      )}
                    </div>

                    {live.status === 'live' && live.playback_url && (
                      <Button asChild className="bg-red-600 hover:bg-red-700">
                        <a href={live.playback_url} target="_blank" rel="noopener noreferrer">
                          Rejoindre le live
                        </a>
                      </Button>
                    )}

                    {live.status === 'ended' && live.replay_url && (
                      <Button asChild variant="outline">
                        <a href={live.replay_url} target="_blank" rel="noopener noreferrer">
                          Voir le replay
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 mb-12">
            <CardContent>
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun live programmé pour le moment
              </h3>
              <p className="text-gray-600 mb-6">
                Les prochains lives seront annoncés sur nos réseaux sociaux
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>Horaires des lives</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">Facebook Live</p>
                <p className="text-gray-600">Plusieurs fois par semaine</p>
              </div>
              <div>
                <p className="font-semibold">TikTok Live</p>
                <p className="text-gray-600">Sessions spéciales</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Les horaires sont annoncés sur nos réseaux sociaux. Suivez-nous pour ne rien manquer !
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
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
          <CardHeader>
            <CardTitle>Pourquoi participer à nos lives ?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Découvrez nos nouveautés en avant-première</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Profitez d'offres exclusives réservées aux participants</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Posez vos questions à Morgane en direct</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Bénéficiez de conseils personnalisés</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#C6A15B] rounded-full mt-2"></div>
                <p>Profitez d'une ambiance conviviale et chaleureuse</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link href="/contact">Nous contacter</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
