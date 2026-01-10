'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Plus, Calendar, Eye, Clock, Trash2, Edit, MessageSquare, ShoppingBag, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduled_start: string;
  actual_start: string | null;
  actual_end: string | null;
  thumbnail_url: string | null;
  current_viewers: number;
  total_views: number;
  max_viewers: number;
  likes_count: number;
  chat_enabled: boolean;
  products_enabled: boolean;
  is_recorded: boolean;
  created_at: string;
}

export default function AdminLivesPage() {
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');

  useEffect(() => {
    loadLives();
  }, [filter]);

  async function loadLives() {
    try {
      let query = supabase
        .from('live_streams')
        .select('*')
        .order('scheduled_start', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLives(data || []);
    } catch (error) {
      console.error('Error loading lives:', error);
      toast.error('Erreur lors du chargement des lives');
    } finally {
      setLoading(false);
    }
  }

  async function deleteLive(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce live ?')) return;

    try {
      const { error } = await supabase
        .from('live_streams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Live supprimé avec succès');
      loadLives();
    } catch (error) {
      console.error('Error deleting live:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function toggleLiveStatus(live: LiveStream) {
    const newStatus = live.status === 'live' ? 'completed' : 'live';
    const updates: any = { status: newStatus };

    if (newStatus === 'live') {
      updates.actual_start = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updates.actual_end = new Date().toISOString();
    }

    try {
      const { error } = await supabase
        .from('live_streams')
        .update(updates)
        .eq('id', live.id);

      if (error) throw error;
      toast.success(`Live ${newStatus === 'live' ? 'démarré' : 'terminé'} avec succès`);
      loadLives();
    } catch (error) {
      console.error('Error updating live status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { color: string; label: string }> = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Programmé' },
      live: { color: 'bg-red-100 text-red-800 animate-pulse', label: '🔴 EN DIRECT' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Terminé' }
    };

    const variant = variants[status] || variants.scheduled;

    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    );
  }

  function formatDate(dateString: string) {
    try {
      return format(new Date(dateString), 'd MMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Lives</h1>
          <p className="text-gray-600">
            Créez, programmez et gérez vos live streams
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/lives/obs-settings">
            <Button variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Paramètres OBS
            </Button>
          </Link>
          <Link href="/admin/lives/new">
            <Button className="bg-[#D4AF37] hover:bg-[#C6A15B]">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Live
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Tous
        </Button>
        <Button
          variant={filter === 'scheduled' ? 'default' : 'outline'}
          onClick={() => setFilter('scheduled')}
        >
          Programmés
        </Button>
        <Button
          variant={filter === 'live' ? 'default' : 'outline'}
          onClick={() => setFilter('live')}
          className={filter === 'live' ? 'animate-pulse' : ''}
        >
          En direct
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Terminés
        </Button>
      </div>

      {lives.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              Aucun live trouvé
            </p>
            <Link href="/admin/lives/new">
              <Button className="bg-[#D4AF37] hover:bg-[#C6A15B]">
                Créer votre premier live
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lives.map((live) => (
            <Card key={live.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-[#D4AF37]" />
                      {live.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {live.description || 'Pas de description'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(live.status)}
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-xs text-gray-500">Programmé pour</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(live.scheduled_start)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Eye className="h-4 w-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-xs text-gray-500">Vues / Max</p>
                        <p className="font-medium text-gray-900">
                          {live.total_views} / {live.max_viewers}
                        </p>
                      </div>
                    </div>
                  </div>

                  {live.status === 'live' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm font-semibold text-red-800">
                            {live.current_viewers} spectateurs en direct
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {live.chat_enabled && (
                      <Badge variant="outline" className="gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Chat
                      </Badge>
                    )}
                    {live.products_enabled && (
                      <Badge variant="outline" className="gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        Produits
                      </Badge>
                    )}
                    {live.is_recorded && (
                      <Badge variant="outline" className="gap-1">
                        <Video className="h-3 w-3" />
                        Enregistré
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Link href={`/admin/lives/${live.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Gérer
                      </Button>
                    </Link>

                    {live.status === 'scheduled' && (
                      <Button
                        onClick={() => toggleLiveStatus(live)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Démarrer
                      </Button>
                    )}

                    {live.status === 'live' && (
                      <Button
                        onClick={() => toggleLiveStatus(live)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700"
                        size="sm"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Terminer
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteLive(live.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
