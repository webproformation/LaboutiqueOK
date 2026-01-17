'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProductMediaSelector } from '@/components/product-media-selector';
import { Plus, Save, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Slide {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  button_text: string;
  button_url: string;
  order_position: number;
  is_active: boolean;
}

const emptySlide: Slide = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  button_text: '',
  button_url: '',
  order_position: 0,
  is_active: true
};

export default function SlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('home_slides')
        .select('*')
        .order('order_position');

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des slides');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (slide: Slide) => {
    try {
      if (slide.id) {
        const { error } = await supabase
          .from('home_slides')
          .update({
            title: slide.title,
            subtitle: slide.subtitle,
            image_url: slide.image_url,
            link_url: slide.link_url,
            button_text: slide.button_text,
            button_url: slide.button_url,
            order_position: slide.order_position,
            is_active: slide.is_active,
          })
          .eq('id', slide.id);

        if (error) throw error;
        toast.success('Slide mis à jour');
      } else {
        const { error } = await supabase
          .from('home_slides')
          .insert({
            title: slide.title,
            subtitle: slide.subtitle,
            image_url: slide.image_url,
            link_url: slide.link_url,
            button_text: slide.button_text,
            button_url: slide.button_url,
            order_position: slide.order_position,
            is_active: slide.is_active,
          });

        if (error) throw error;
        toast.success('Slide créé');
      }

      setEditingSlide(null);
      setIsCreating(false);
      fetchSlides();
      sessionStorage.removeItem('home_slides_active');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce slide ?')) return;

    try {
      const { error } = await supabase
        .from('home_slides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Slide supprimé');
      fetchSlides();
      sessionStorage.removeItem('home_slides_active');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Slides d'accueil</h1>
          <p className="text-gray-600 mt-2">Gérez le carrousel de la page d'accueil</p>
        </div>
        <Button
          onClick={() => {
            setEditingSlide(emptySlide);
            setIsCreating(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un slide
        </Button>
      </div>

      {(editingSlide || isCreating) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label>Titre</Label>
                <Input
                  value={editingSlide?.title || ''}
                  onChange={(e) =>
                    setEditingSlide((prev) => ({ ...prev!, title: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Sous-titre</Label>
                <Input
                  value={editingSlide?.subtitle || ''}
                  onChange={(e) =>
                    setEditingSlide((prev) => ({ ...prev!, subtitle: e.target.value }))
                  }
                />
              </div>

              <div>
                <ProductMediaSelector
                  label="Image du slide"
                  currentImageUrl={editingSlide?.image_url}
                  onSelect={(url) =>
                    setEditingSlide((prev) => ({ ...prev!, image_url: url }))
                  }
                  bucket="media"
                />
              </div>

              <div>
                <Label>Texte du bouton (optionnel)</Label>
                <Input
                  value={editingSlide?.button_text || ''}
                  onChange={(e) =>
                    setEditingSlide((prev) => ({ ...prev!, button_text: e.target.value }))
                  }
                  placeholder="Ex: Découvrir"
                />
              </div>

              <div>
                <Label>URL du bouton (optionnel)</Label>
                <Input
                  value={editingSlide?.button_url || ''}
                  onChange={(e) =>
                    setEditingSlide((prev) => ({ ...prev!, button_url: e.target.value }))
                  }
                  placeholder="Ex: /category/nouveautes"
                />
              </div>

              <div>
                <Label>Position</Label>
                <Input
                  type="number"
                  value={editingSlide?.order_position || 0}
                  onChange={(e) =>
                    setEditingSlide((prev) => ({
                      ...prev!,
                      order_position: parseInt(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSlide?.is_active}
                  onCheckedChange={(checked) =>
                    setEditingSlide((prev) => ({ ...prev!, is_active: checked }))
                  }
                />
                <Label>Actif</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => editingSlide && handleSave(editingSlide)}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingSlide(null);
                    setIsCreating(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {slides.map((slide) => (
          <Card key={slide.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{slide.title}</h3>
                  <p className="text-gray-600 text-sm">{slide.subtitle}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-gray-500">Position: {slide.order_position}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        slide.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {slide.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingSlide(slide)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(slide.id!)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
