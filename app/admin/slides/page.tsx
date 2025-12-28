"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import WordPressMediaSelector from '@/components/WordPressMediaSelector';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  button_text: string;
  button_url: string;
  order_position: number;
  is_active: boolean;
}

export default function AdminSlides() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptySlide: Slide = {
    id: '',
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    button_text: '',
    button_url: '',
    order_position: 0,
    is_active: true,
  };

  const fetchSlides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('home_slides')
      .select('*')
      .order('order_position');

    if (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } else {
      setSlides(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleSave = async (slide: Slide) => {
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

      if (error) {
        toast.error('Erreur lors de la mise à jour');
      } else {
        toast.success('Slide mis à jour');
        setEditingSlide(null);
        fetchSlides();
      }
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

      if (error) {
        toast.error('Erreur lors de la création');
      } else {
        toast.success('Slide créé');
        setIsCreating(false);
        setEditingSlide(null);
        fetchSlides();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce slide ?')) return;

    const { error } = await supabase
      .from('home_slides')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Slide supprimé');
      fetchSlides();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Slides d&apos;accueil</h1>
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
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label>Titre</Label>
                <Input
                  value={editingSlide?.title || ''}
                  onChange={(e) =>
                    setEditingSlide(prev => ({ ...prev!, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <Input
                  value={editingSlide?.subtitle || ''}
                  onChange={(e) =>
                    setEditingSlide(prev => ({ ...prev!, subtitle: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Image du slide</Label>
                <WordPressMediaSelector
                  selectedImage={editingSlide?.image_url || ''}
                  onSelect={(imageUrl) =>
                    setEditingSlide(prev => ({ ...prev!, image_url: imageUrl }))
                  }
                />
              </div>
              <div>
                <Label>Lien (optionnel)</Label>
                <Input
                  value={editingSlide?.link_url || ''}
                  onChange={(e) =>
                    setEditingSlide(prev => ({ ...prev!, link_url: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Texte du bouton (optionnel)</Label>
                <Input
                  value={editingSlide?.button_text || ''}
                  onChange={(e) =>
                    setEditingSlide(prev => ({ ...prev!, button_text: e.target.value }))
                  }
                  placeholder="Ex: Découvrir"
                />
              </div>
              <div>
                <Label>URL du bouton (optionnel)</Label>
                <Input
                  value={editingSlide?.button_url || ''}
                  onChange={(e) =>
                    setEditingSlide(prev => ({ ...prev!, button_url: e.target.value }))
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
                    setEditingSlide(prev => ({ ...prev!, order_position: parseInt(e.target.value) }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSlide?.is_active}
                  onCheckedChange={(checked) =>
                    setEditingSlide(prev => ({ ...prev!, is_active: checked }))
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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
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
                      <span className="text-xs text-gray-500">
                        Position: {slide.order_position}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        slide.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {slide.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSlide(slide)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slide.id)}
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
      )}
    </div>
  );
}
