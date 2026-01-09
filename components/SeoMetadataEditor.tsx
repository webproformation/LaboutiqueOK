'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MediaLibrary from '@/components/MediaLibrary';
import { Save, Loader2, Image as ImageIcon, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface SeoMetadataEditorProps {
  entityType: 'product' | 'category' | 'page';
  entityIdentifier: string;
  entityName?: string;
  entityDescription?: string;
  entityImageUrl?: string;
  onGenerateAuto?: () => void;
}

export default function SeoMetadataEditor({
  entityType,
  entityIdentifier,
  entityName,
  entityDescription,
  entityImageUrl,
  onGenerateAuto,
}: SeoMetadataEditorProps) {
  const [formData, setFormData] = useState({
    seo_title: '',
    meta_description: '',
    og_image: '',
    og_title: '',
    og_description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ogImageDialogOpen, setOgImageDialogOpen] = useState(false);

  useEffect(() => {
    loadSeoData();
  }, [entityType, entityIdentifier]);

  const loadSeoData = async () => {
    try {
      const { data } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_identifier', entityIdentifier)
        .maybeSingle();

      if (data) {
        setFormData({
          seo_title: data.seo_title || '',
          meta_description: data.meta_description || '',
          og_image: data.og_image || '',
          og_title: data.og_title || '',
          og_description: data.og_description || '',
        });
      }
    } catch (error) {
      console.error('Error loading SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('seo_metadata')
        .upsert({
          entity_type: entityType,
          entity_identifier: entityIdentifier,
          seo_title: formData.seo_title || null,
          meta_description: formData.meta_description || null,
          og_image: formData.og_image || null,
          og_title: formData.og_title || null,
          og_description: formData.og_description || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'entity_type,entity_identifier',
        });

      if (error) throw error;

      toast.success('Métadonnées SEO enregistrées');
    } catch (error) {
      console.error('Error saving SEO:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAuto = () => {
    const truncate = (str: string, length: number) => {
      return str.length > length ? str.substring(0, length - 3) + '...' : str;
    };

    if (entityName && !formData.seo_title) {
      setFormData(prev => ({
        ...prev,
        seo_title: truncate(entityName, 60),
      }));
    }

    if (entityDescription && !formData.meta_description) {
      const cleanDescription = entityDescription.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      setFormData(prev => ({
        ...prev,
        meta_description: truncate(cleanDescription, 160),
      }));
    }

    if (entityImageUrl && !formData.og_image) {
      setFormData(prev => ({
        ...prev,
        og_image: entityImageUrl,
      }));
    }

    if (entityName && !formData.og_title) {
      setFormData(prev => ({
        ...prev,
        og_title: truncate(entityName, 70),
      }));
    }

    if (entityDescription && !formData.og_description) {
      const cleanDescription = entityDescription.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      setFormData(prev => ({
        ...prev,
        og_description: truncate(cleanDescription, 200),
      }));
    }

    toast.success('Métadonnées générées automatiquement');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#b8933d]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Optimisation SEO</CardTitle>
          {(entityName || entityDescription) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateAuto}
              className="gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Générer automatiquement
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seo_title">
            Meta Title <span className="text-gray-500">({formData.seo_title.length}/60)</span>
          </Label>
          <Input
            id="seo_title"
            value={formData.seo_title}
            onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
            maxLength={70}
            placeholder="Titre optimisé pour les moteurs de recherche"
          />
          <p className="text-xs text-gray-500">
            Recommandé: 50-60 caractères. Apparaît dans les résultats de recherche Google.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description">
            Meta Description <span className="text-gray-500">({formData.meta_description.length}/160)</span>
          </Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
            maxLength={200}
            rows={3}
            placeholder="Description courte et attrayante pour les résultats de recherche"
          />
          <p className="text-xs text-gray-500">
            Recommandé: 150-160 caractères. Apparaît sous le titre dans les résultats de recherche.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="og_image">Image Open Graph</Label>
          <div className="flex gap-2">
            <Input
              id="og_image"
              value={formData.og_image}
              onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
              placeholder="URL de l'image pour les réseaux sociaux"
            />
            <Dialog open={ogImageDialogOpen} onOpenChange={setOgImageDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="gap-2 shrink-0">
                  <ImageIcon className="w-4 h-4" />
                  Choisir
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-0 shrink-0">
                  <DialogTitle>Choisir une image Open Graph</DialogTitle>
                </DialogHeader>
                <div className="p-6 pt-4 overflow-y-auto flex-1">
                  <MediaLibrary
                    bucket="media"
                    selectedUrl={formData.og_image}
                    onSelect={(url) => {
                      setFormData({ ...formData, og_image: url });
                      setOgImageDialogOpen(false);
                    }}
                    onClose={() => setOgImageDialogOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {formData.og_image && (
            <img
              src={formData.og_image}
              alt="Preview OG Image"
              className="w-full max-w-md h-auto rounded border mt-2"
            />
          )}
          <p className="text-xs text-gray-500">
            Dimension recommandée: 1200x630px. Utilisée lors du partage sur les réseaux sociaux.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="og_title">
            Titre Open Graph <span className="text-gray-500">({formData.og_title.length}/70)</span>
          </Label>
          <Input
            id="og_title"
            value={formData.og_title}
            onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
            maxLength={90}
            placeholder="Titre pour les réseaux sociaux (optionnel)"
          />
          <p className="text-xs text-gray-500">
            Si vide, le Meta Title sera utilisé. Affiché lors du partage sur Facebook, LinkedIn, etc.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="og_description">
            Description Open Graph <span className="text-gray-500">({formData.og_description.length}/200)</span>
          </Label>
          <Textarea
            id="og_description"
            value={formData.og_description}
            onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
            maxLength={300}
            rows={3}
            placeholder="Description pour les réseaux sociaux (optionnel)"
          />
          <p className="text-xs text-gray-500">
            Si vide, la Meta Description sera utilisée. Affichée lors du partage sur les réseaux sociaux.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#b8933d] hover:bg-[#a07c2f] gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer les métadonnées SEO
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
