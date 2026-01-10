'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Video, Copy, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface OBSSettings {
  id: string;
  stream_key: string;
  stream_server: string;
  video_bitrate: number;
  audio_bitrate: number;
  resolution: string;
  fps: number;
}

export default function OBSSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<OBSSettings>({
    id: '',
    stream_key: '',
    stream_server: 'rtmp://live.laboutiquedemorgane.com/live',
    video_bitrate: 2500,
    audio_bitrate: 128,
    resolution: '1920x1080',
    fps: 30,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  async function loadSettings() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('obs_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      } else {
        const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSettings(prev => ({ ...prev, stream_key: streamKey }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const settingsData = {
        user_id: user.id,
        stream_key: settings.stream_key,
        stream_server: settings.stream_server,
        video_bitrate: settings.video_bitrate,
        audio_bitrate: settings.audio_bitrate,
        resolution: settings.resolution,
        fps: settings.fps,
      };

      const { data, error } = await supabase
        .from('obs_settings')
        .upsert(settingsData, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving settings:', error);
        throw error;
      }

      if (data) {
        setSettings(data);
      }

      toast.success('Paramètres sauvegardés');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  }

  function downloadOBSProfile() {
    const profile = {
      'stream-server': settings.stream_server,
      'stream-key': settings.stream_key,
      'video-bitrate': settings.video_bitrate,
      'audio-bitrate': settings.audio_bitrate,
      'resolution': settings.resolution,
      'fps': settings.fps,
    };

    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'obs-profile-lbdm.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Profil OBS téléchargé');
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
      <div className="flex items-center gap-4">
        <Link href="/admin/lives">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres OBS Studio</h1>
          <p className="text-gray-600 mt-1">
            Configuration pour diffuser vos lives avec OBS
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Guide rapide OBS</CardTitle>
            <CardDescription className="text-blue-700">
              Comment configurer OBS pour vos lives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <p>Téléchargez et installez OBS Studio depuis <a href="https://obsproject.com" target="_blank" rel="noopener noreferrer" className="underline">obsproject.com</a></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <p>Dans OBS, allez dans Paramètres → Stream</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <p>Sélectionnez "Service: Custom" et copiez les informations ci-dessous</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <p>Configurez votre scène avec votre caméra et vos sources</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <p>Cliquez sur "Démarrer le streaming" quand votre live est programmé</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={saveSettings}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-[#D4AF37]" />
                Informations de connexion
              </CardTitle>
              <CardDescription>
                Utilisez ces paramètres dans OBS Studio
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stream_server">Serveur Stream (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="stream_server"
                    value={settings.stream_server}
                    onChange={(e) => setSettings({ ...settings, stream_server: e.target.value })}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(settings.stream_server, 'URL du serveur')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Collez cette URL dans "Server" dans OBS
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream_key">Clé de Stream</Label>
                <div className="flex gap-2">
                  <Input
                    id="stream_key"
                    value={settings.stream_key}
                    readOnly
                    className="font-mono bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(settings.stream_key, 'Clé de stream')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Collez cette clé dans "Stream Key" dans OBS
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Paramètres vidéo</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Résolution</Label>
                    <Select
                      value={settings.resolution}
                      onValueChange={(value) => setSettings({ ...settings, resolution: value })}
                    >
                      <SelectTrigger id="resolution">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                        <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                        <SelectItem value="854x480">854x480 (SD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fps">FPS (Images par seconde)</Label>
                    <Select
                      value={settings.fps.toString()}
                      onValueChange={(value) => setSettings({ ...settings, fps: parseInt(value) })}
                    >
                      <SelectTrigger id="fps">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60 FPS</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="25">25 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_bitrate">Bitrate Vidéo (kbps)</Label>
                    <Input
                      id="video_bitrate"
                      type="number"
                      min="500"
                      max="8000"
                      value={settings.video_bitrate}
                      onChange={(e) => setSettings({ ...settings, video_bitrate: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-500">
                      Recommandé : 2500-4000 kbps pour Full HD
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audio_bitrate">Bitrate Audio (kbps)</Label>
                    <Select
                      value={settings.audio_bitrate.toString()}
                      onValueChange={(value) => setSettings({ ...settings, audio_bitrate: parseInt(value) })}
                    >
                      <SelectTrigger id="audio_bitrate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="320">320 kbps (Meilleure qualité)</SelectItem>
                        <SelectItem value="192">192 kbps (Haute qualité)</SelectItem>
                        <SelectItem value="128">128 kbps (Qualité standard)</SelectItem>
                        <SelectItem value="96">96 kbps (Économie de bande passante)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadOBSProfile}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le profil OBS
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#C6A15B]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Ressources utiles</CardTitle>
            <CardDescription>
              Guides et tutoriels pour améliorer vos lives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="https://obsproject.com/wiki/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Documentation OBS officielle</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
            <a
              href="https://obsproject.com/forum/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Forum de support OBS</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
