'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SeoMetadata {
  seo_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical_url: string;
  robots_meta: string;
  is_active: boolean;
}

interface SeoMetadataEditorProps {
  entityType: 'page' | 'category' | 'post' | 'product_cat';
  entityIdentifier: string;
  onSave?: (metadata: SeoMetadata) => void;
  autoSave?: boolean;
}

export default function SeoMetadataEditor({
  entityType,
  entityIdentifier,
  onSave,
  autoSave = false,
}: SeoMetadataEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<SeoMetadata>({
    seo_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    robots_meta: 'index, follow',
    is_active: true,
  });
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    if (entityIdentifier) {
      loadMetadata();
    }
  }, [entityType, entityIdentifier]);

  const loadMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_identifier', entityIdentifier)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setMetadata({
          seo_title: data.seo_title || '',
          meta_description: data.meta_description || '',
          meta_keywords: data.meta_keywords || '',
          og_title: data.og_title || '',
          og_description: data.og_description || '',
          og_image: data.og_image || '',
          canonical_url: data.canonical_url || '',
          robots_meta: data.robots_meta || 'index, follow',
          is_active: data.is_active ?? true,
        });
        setHasExistingData(true);
      } else {
        setHasExistingData(false);
      }
    } catch (error) {
      console.error('Error loading SEO metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!entityIdentifier) {
      toast.error('Identifiant de l\'entité manquant');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        entity_type: entityType,
        entity_identifier: entityIdentifier,
        ...metadata,
      };

      if (hasExistingData) {
        const { error } = await supabase
          .from('seo_metadata')
          .update(dataToSave)
          .eq('entity_type', entityType)
          .eq('entity_identifier', entityIdentifier);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_metadata')
          .insert([dataToSave]);

        if (error) throw error;
        setHasExistingData(true);
      }

      toast.success('Métadonnées SEO enregistrées');
      if (onSave) {
        onSave(metadata);
      }
    } catch (error: any) {
      console.error('Error saving SEO metadata:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SeoMetadata, value: string | boolean) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Optimisation SEO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#b8933d]" />
              Optimisation SEO
            </CardTitle>
            <CardDescription>
              Optimisez le référencement de cette {entityType === 'page' ? 'page' : entityType === 'category' ? 'catégorie' : 'actualité'}
            </CardDescription>
          </div>
          {!autoSave && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#b8933d] hover:bg-[#a07c2f]"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer SEO'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasExistingData && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune métadonnée SEO définie pour cet élément. Remplissez les champs ci-dessous pour améliorer le référencement.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basique</TabsTrigger>
            <TabsTrigger value="opengraph">Open Graph</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="seo_title">Titre SEO</Label>
              <Input
                id="seo_title"
                value={metadata.seo_title}
                onChange={(e) => updateField('seo_title', e.target.value)}
                placeholder="Titre optimisé pour les moteurs de recherche (60-70 caractères)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {metadata.seo_title.length} / 70 caractères
                {metadata.seo_title.length > 70 && (
                  <span className="text-orange-600 ml-2">Titre trop long</span>
                )}
              </p>
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={metadata.meta_description}
                onChange={(e) => updateField('meta_description', e.target.value)}
                placeholder="Description pour les résultats de recherche (150-160 caractères)"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {metadata.meta_description.length} / 160 caractères
                {metadata.meta_description.length > 160 && (
                  <span className="text-orange-600 ml-2">Description trop longue</span>
                )}
              </p>
            </div>

            <div>
              <Label htmlFor="meta_keywords">Mots-clés</Label>
              <Input
                id="meta_keywords"
                value={metadata.meta_keywords}
                onChange={(e) => updateField('meta_keywords', e.target.value)}
                placeholder="mot-clé 1, mot-clé 2, mot-clé 3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Séparez les mots-clés par des virgules
              </p>
            </div>
          </TabsContent>

          <TabsContent value="opengraph" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="og_title">Titre Open Graph</Label>
              <Input
                id="og_title"
                value={metadata.og_title}
                onChange={(e) => updateField('og_title', e.target.value)}
                placeholder="Titre pour les partages sur réseaux sociaux"
              />
              <p className="text-xs text-gray-500 mt-1">
                Affiché lors des partages sur Facebook, Twitter, etc.
              </p>
            </div>

            <div>
              <Label htmlFor="og_description">Description Open Graph</Label>
              <Textarea
                id="og_description"
                value={metadata.og_description}
                onChange={(e) => updateField('og_description', e.target.value)}
                placeholder="Description pour les partages sur réseaux sociaux"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="og_image">Image Open Graph (URL)</Label>
              <Input
                id="og_image"
                value={metadata.og_image}
                onChange={(e) => updateField('og_image', e.target.value)}
                placeholder="https://exemple.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dimensions recommandées : 1200x630 pixels
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="canonical_url">URL Canonique</Label>
              <Input
                id="canonical_url"
                value={metadata.canonical_url}
                onChange={(e) => updateField('canonical_url', e.target.value)}
                placeholder="https://laboutiquemorgane.fr/page"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL principale pour éviter le contenu dupliqué
              </p>
            </div>

            <div>
              <Label htmlFor="robots_meta">Directives Robots</Label>
              <Select
                value={metadata.robots_meta}
                onValueChange={(value) => updateField('robots_meta', value)}
              >
                <SelectTrigger id="robots_meta">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index, follow">Index, Follow (Recommandé)</SelectItem>
                  <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                  <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                  <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Contrôle l'indexation par les moteurs de recherche
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={metadata.is_active}
                onCheckedChange={(checked) => updateField('is_active', checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Activer les métadonnées SEO
              </Label>
            </div>
          </TabsContent>
        </Tabs>

        {autoSave && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#b8933d] hover:bg-[#a07c2f] w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer les métadonnées SEO'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
