'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Settings,
  Video,
  Play,
  Square,
  Trash2,
  Edit,
  Plus,
  Users,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  Package,
  MessageSquare,
  Copy
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LiveStreamSettings {
  id: string;
  streaming_provider: string;
  mux_api_key?: string;
  mux_secret_key?: string;
  aws_ivs_channel_arn?: string;
  aws_ivs_playback_url?: string;
  restream_stream_key?: string;
  nginx_rtmp_url?: string;
  nginx_rtmp_app_name?: string;
  custom_stream_url?: string;
  custom_playback_url?: string;
  enable_chat: boolean;
  enable_product_overlay: boolean;
}

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  status: string;
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  stream_key?: string;
  playback_url?: string;
  current_viewers: number;
  peak_viewers: number;
  total_views: number;
  featured_product_id?: string;
  created_at: string;
}

export default function LiveStreamsAdminPage() {
  const [settings, setSettings] = useState<LiveStreamSettings | null>(null);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStream, setNewStream] = useState({
    title: '',
    description: '',
    scheduled_start: '',
  });
  const [showMuxApiKey, setShowMuxApiKey] = useState(false);
  const [showMuxSecretKey, setShowMuxSecretKey] = useState(false);
  const [showRestreamKey, setShowRestreamKey] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
    loadStreams();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/live/settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
    }
  };

  const loadStreams = async () => {
    try {
      const response = await fetch('/api/live/streams');
      const data = await response.json();
      setStreams(data.streams || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des lives');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedSettings: Partial<LiveStreamSettings>) => {
    try {
      const response = await fetch('/api/live/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      if (response.ok) {
        toast.success('Paramètres mis à jour');
        loadSettings();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const createStream = async () => {
    if (!newStream.title) {
      toast.error('Le titre est requis');
      return;
    }

    try {
      const response = await fetch('/api/live/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStream),
      });

      if (response.ok) {
        toast.success('Live créé');
        setIsCreateDialogOpen(false);
        setNewStream({ title: '', description: '', scheduled_start: '' });
        loadStreams();
      } else {
        toast.error('Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const startStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/live/streams/${streamId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Live démarré');
        loadStreams();
      } else {
        toast.error('Erreur lors du démarrage');
      }
    } catch (error) {
      toast.error('Erreur lors du démarrage');
    }
  };

  const endStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/live/streams/${streamId}/end`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Live terminé');
        loadStreams();
      } else {
        toast.error('Erreur lors de la fin du live');
      }
    } catch (error) {
      toast.error('Erreur lors de la fin du live');
    }
  };

  const deleteStream = async (streamId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce live ?')) return;

    try {
      const response = await fetch(`/api/live/streams/${streamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Live supprimé');
        loadStreams();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      scheduled: 'secondary',
      live: 'default',
      ended: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Lives</h1>
          <p className="text-gray-500">Configuration et gestion de vos streams en direct</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Live
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau live</DialogTitle>
              <DialogDescription>
                Configurez les détails de votre prochain live stream
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={newStream.title}
                  onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
                  placeholder="Mon Super Live"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newStream.description}
                  onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                  placeholder="Description du live..."
                />
              </div>
              <div>
                <Label htmlFor="scheduled_start">Date et heure prévue</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={newStream.scheduled_start}
                  onChange={(e) => setNewStream({ ...newStream, scheduled_start: e.target.value })}
                />
              </div>
              <Button onClick={createStream} className="w-full">
                Créer le Live
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="streams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="streams">
            <Video className="mr-2 h-4 w-4" />
            Lives
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {streams.map((stream) => (
              <Card key={stream.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{stream.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {stream.description || 'Pas de description'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(stream.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Eye className="mr-2 h-4 w-4" />
                        Spectateurs actuels
                      </span>
                      <span className="font-bold">{stream.current_viewers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Pic de spectateurs
                      </span>
                      <span className="font-bold">{stream.peak_viewers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Vues totales
                      </span>
                      <span className="font-bold">{stream.total_views}</span>
                    </div>
                    {stream.scheduled_start && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Prévu
                        </span>
                        <span className="text-xs">
                          {new Date(stream.scheduled_start).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {stream.stream_key && (
                    <div className="p-3 bg-gray-100 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Clé de stream</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(stream.stream_key || '')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <code className="text-xs break-all block">
                        {stream.stream_key.substring(0, 20)}...
                      </code>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {stream.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => startStream(stream.id)}
                        className="flex-1"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Démarrer
                      </Button>
                    )}
                    {stream.status === 'live' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => endStream(stream.id)}
                        className="flex-1"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Terminer
                      </Button>
                    )}
                    {stream.status === 'ended' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteStream(stream.id)}
                        className="flex-1"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {streams.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun live pour le moment</h3>
                <p className="text-gray-500 mb-4">Créez votre premier live pour commencer</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un Live
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du streaming</CardTitle>
              <CardDescription>
                Choisissez votre plateforme de streaming et configurez les paramètres
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="provider">Plateforme de streaming</Label>
                <Select
                  value={settings?.streaming_provider || 'mux'}
                  onValueChange={(value) =>
                    updateSettings({ ...settings, streaming_provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mux">Mux (Recommandé)</SelectItem>
                    <SelectItem value="aws-ivs">AWS IVS</SelectItem>
                    <SelectItem value="restream">Restream</SelectItem>
                    <SelectItem value="nginx-rtmp">nginx-rtmp (Auto-hébergé)</SelectItem>
                    <SelectItem value="custom">Custom RTMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings?.streaming_provider === 'mux' && (
                <>
                  <div>
                    <Label htmlFor="mux_api_key">Mux API Key</Label>
                    <div className="relative">
                      <Input
                        id="mux_api_key"
                        type={showMuxApiKey ? "text" : "password"}
                        value={settings?.mux_api_key || ''}
                        onChange={(e) => setSettings({ ...settings, mux_api_key: e.target.value })}
                        placeholder="Entrez votre clé API Mux"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMuxApiKey(!showMuxApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showMuxApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mux_secret_key">Mux Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="mux_secret_key"
                        type={showMuxSecretKey ? "text" : "password"}
                        value={settings?.mux_secret_key || ''}
                        onChange={(e) => setSettings({ ...settings, mux_secret_key: e.target.value })}
                        placeholder="Entrez votre clé secrète Mux"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMuxSecretKey(!showMuxSecretKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showMuxSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {settings?.streaming_provider === 'restream' && (
                <div>
                  <Label htmlFor="restream_stream_key">Restream Key</Label>
                  <div className="relative">
                    <Input
                      id="restream_stream_key"
                      type={showRestreamKey ? "text" : "password"}
                      value={settings?.restream_stream_key || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, restream_stream_key: e.target.value })
                      }
                      placeholder="Entrez votre clé Restream"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRestreamKey(!showRestreamKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showRestreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {settings?.streaming_provider === 'nginx-rtmp' && (
                <>
                  <div>
                    <Label htmlFor="nginx_rtmp_url">URL du serveur RTMP</Label>
                    <Input
                      id="nginx_rtmp_url"
                      value={settings?.nginx_rtmp_url || ''}
                      onChange={(e) => setSettings({ ...settings, nginx_rtmp_url: e.target.value })}
                      placeholder="rtmp://your-server.com/live"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nginx_rtmp_app_name">Nom de l'application</Label>
                    <Input
                      id="nginx_rtmp_app_name"
                      value={settings?.nginx_rtmp_app_name || 'live'}
                      onChange={(e) =>
                        setSettings({ ...settings, nginx_rtmp_app_name: e.target.value })
                      }
                      placeholder="live"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_chat">Activer le chat</Label>
                  <p className="text-sm text-gray-500">
                    Permet aux spectateurs de discuter pendant le live
                  </p>
                </div>
                <Switch
                  id="enable_chat"
                  checked={settings?.enable_chat || false}
                  onCheckedChange={(checked) =>
                    updateSettings({ ...settings, enable_chat: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_product_overlay">Overlay produits</Label>
                  <p className="text-sm text-gray-500">
                    Affiche les produits pendant le live
                  </p>
                </div>
                <Switch
                  id="enable_product_overlay"
                  checked={settings?.enable_product_overlay || false}
                  onCheckedChange={(checked) =>
                    updateSettings({ ...settings, enable_product_overlay: checked })
                  }
                />
              </div>

              <Button onClick={() => updateSettings(settings || {})} className="w-full">
                Enregistrer les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
