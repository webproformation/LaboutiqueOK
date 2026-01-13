'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Video } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewLivePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_start: '',
    thumbnail_url: '',
    chat_enabled: true,
    products_enabled: true,
    is_recorded: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const streamKey = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('live_streams')
        .insert([{
          ...formData,
          id: streamKey,
          stream_key: streamKey,
          status: 'scheduled',
          current_viewers: 0,
          total_views: 0,
          max_viewers: 0,
          likes_count: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Live créé avec succès');
      router.push(`/admin/lives/${data.id}`);
    } catch (error) {
      console.error('Error creating live:', error);
      toast.error('Erreur lors de la création du live');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Live</h1>
          <p className="text-gray-600 mt-1">
            Créez et programmez un nouveau live stream
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-[#D4AF37]" />
              Informations du live
            </CardTitle>
            <CardDescription>
              Remplissez les informations de votre live stream
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du live *</Label>
              <Input
                id="title"
                placeholder="Ex: Live shopping spécial nouveautés"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez ce que vous allez présenter pendant ce live..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_start">Date et heure de début *</Label>
              <Input
                id="scheduled_start"
                type="datetime-local"
                value={formData.scheduled_start}
                onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                required
              />
              <p className="text-sm text-gray-500">
                Choisissez quand vous souhaitez démarrer ce live
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">URL de la miniature</Label>
              <Input
                id="thumbnail_url"
                type="url"
                placeholder="https://..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
              <p className="text-sm text-gray-500">
                Image qui sera affichée avant le début du live
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Options du live</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="chat_enabled">Activer le chat</Label>
                    <p className="text-sm text-gray-500">
                      Permettre aux spectateurs de discuter pendant le live
                    </p>
                  </div>
                  <Switch
                    id="chat_enabled"
                    checked={formData.chat_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, chat_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="products_enabled">Partage de produits</Label>
                    <p className="text-sm text-gray-500">
                      Afficher et partager des produits pendant le live
                    </p>
                  </div>
                  <Switch
                    id="products_enabled"
                    checked={formData.products_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, products_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_recorded">Enregistrer le live</Label>
                    <p className="text-sm text-gray-500">
                      Sauvegarder automatiquement le live pour le replay
                    </p>
                  </div>
                  <Switch
                    id="is_recorded"
                    checked={formData.is_recorded}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recorded: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Link href="/admin/lives" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C6A15B]"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Création...' : 'Créer le live'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
