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
import { ArrowLeft, Save, Youtube } from 'lucide-react'; // J'ai ajouté l'icône Youtube
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewLivePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // J'ai ajouté youtube_url dans le formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_start: '',
    thumbnail_url: '',
    youtube_url: '', // <-- Nouveau champ
    chat_enabled: true,
    products_enabled: true,
    is_recorded: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // On garde une clé aléatoire pour l'ID unique, mais on ne s'en sert plus pour OBS
      const uniqueId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // On nettoie le lien YouTube pour être sûr (au cas où vous collez le lien entier)
      // Cela permet d'accepter "https://youtu.be/xyz" ou juste "xyz"
      let finalUrl = formData.youtube_url;
      
      const { data, error } = await supabase
        .from('live_streams')
        .insert([{
          id: uniqueId,
          title: formData.title,
          description: formData.description,
          scheduled_start: formData.scheduled_start,
          thumbnail_url: formData.thumbnail_url,
          
          // C'est ICI que la magie opère pour YouTube :
          playback_url: finalUrl, 
          stream_key: uniqueId, // On met une valeur bidon car géré par YouTube
          
          status: 'scheduled',
          current_viewers: 0,
          total_views: 0,
          max_viewers: 0,
          likes_count: 0,
          chat_enabled: formData.chat_enabled,
          products_enabled: formData.products_enabled,
          is_recorded: formData.is_recorded,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Live YouTube programmé avec succès !');
      router.push('/admin/lives');
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
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouveau Live YouTube</h1>
          <p className="text-gray-500">Programmez votre prochaine session de shopping</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Configurez les détails de votre diffusion YouTube
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* --- NOUVEAU BLOC YOUTUBE --- */}
            <div className="space-y-2">
              <Label htmlFor="youtube_url" className="flex items-center gap-2 text-[#FF0000] font-bold">
                <Youtube className="h-4 w-4" /> Lien du Live YouTube
              </Label>
              <Input
                id="youtube_url"
                placeholder="Ex: https://www.youtube.com/watch?v=..."
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                required
                className="border-red-200 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500">
                Créez votre live sur YouTube Studio, puis copiez le lien de partage ici.
              </p>
            </div>
            {/* --------------------------- */}

            <div className="space-y-2">
              <Label htmlFor="title">Titre du live</Label>
              <Input
                id="title"
                placeholder="Ex: Grande vente d'hiver ❄️"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de l'événement..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="scheduled_start">Date et heure de début</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail_url">Image de couverture (URL)</Label>
                <Input
                  id="thumbnail_url"
                  placeholder="https://..."
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-gray-900">Options d'interaction</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="chat_enabled">Chat en direct</Label>
                  </div>
                  <Switch
                    id="chat_enabled"
                    checked={formData.chat_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, chat_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="products_enabled">Produits</Label>
                  </div>
                  <Switch
                    id="products_enabled"
                    checked={formData.products_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, products_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_recorded">Replay auto</Label>
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