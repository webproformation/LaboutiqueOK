'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/use-admin';
import SeoMetadataEditor from '@/components/SeoMetadataEditor';
import WordPressMediaSelector from '@/components/WordPressMediaSelector';
import RichTextEditor from '@/components/RichTextEditor';

interface HomeCategory {
  id: string;
  category_slug: string;
  category_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
}

export default function EditHomeCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const isNew = categoryId === 'new';

  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<HomeCategory>>({
    category_name: '',
    category_slug: '',
    description: '',
    image_url: null,
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      if (isNew) {
        loadNextOrder();
        setLoading(false);
      } else {
        loadCategory();
      }
    }
  }, [isAdmin, categoryId]);

  const loadNextOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('home_categories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        display_order: data ? data.display_order + 1 : 0,
      }));
    } catch (error) {
      console.error('Error loading next order:', error);
    }
  };

  const loadCategory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;

      setFormData({
        id: data.id,
        category_name: data.category_name,
        category_slug: data.category_slug,
        description: data.description || '',
        image_url: data.image_url,
        is_active: data.is_active,
        display_order: data.display_order,
      });
    } catch (error) {
      console.error('Error loading category:', error);
      toast.error('Erreur lors du chargement de la catégorie');
      router.push('/admin/home-categories');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      category_name: name,
      category_slug: isNew ? generateSlug(name) : prev.category_slug,
    }));
  };

  const handleSave = async () => {
    if (!formData.category_name || !formData.category_slug) {
      toast.error('Le nom et le slug sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const { error } = await supabase
          .from('home_categories')
          .insert({
            category_name: formData.category_name,
            category_slug: formData.category_slug,
            description: formData.description || null,
            image_url: formData.image_url || null,
            is_active: formData.is_active ?? true,
            display_order: formData.display_order ?? 0,
          });

        if (error) throw error;

        toast.success('Catégorie créée avec succès');
      } else {
        const { error } = await supabase
          .from('home_categories')
          .update({
            category_name: formData.category_name,
            category_slug: formData.category_slug,
            description: formData.description || null,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
          })
          .eq('id', categoryId);

        if (error) throw error;

        toast.success('Catégorie mise à jour avec succès');
      }

      router.push('/admin/home-categories');
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleMediaSelect = (imageUrl: string, imageId: number) => {
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl || null,
    }));
    if (imageUrl) {
      toast.success('Image sélectionnée');
    } else {
      toast.success('Image supprimée');
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/home-categories')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux catégories
        </Button>
        <h1 className="text-3xl font-bold">
          {isNew ? 'Créer une catégorie' : 'Modifier la catégorie'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isNew
            ? 'Créez une nouvelle catégorie pour la page d\'accueil'
            : 'Modifiez les informations de la catégorie'}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Configurez le nom, le slug et l'image de la catégorie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category_name">Nom de la catégorie *</Label>
              <Input
                id="category_name"
                value={formData.category_name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Nouveautés"
              />
            </div>

            <div>
              <Label htmlFor="category_slug">Slug *</Label>
              <Input
                id="category_slug"
                value={formData.category_slug}
                onChange={(e) => setFormData(prev => ({ ...prev, category_slug: e.target.value }))}
                placeholder="Ex: nouveautes"
              />
              <p className="text-xs text-gray-500 mt-1">
                Le slug est utilisé dans l'URL de la catégorie
              </p>
            </div>

            <div>
              <Label>Image de la catégorie</Label>
              <div className="mt-2">
                <WordPressMediaSelector
                  onSelect={handleMediaSelect}
                  selectedImage={formData.image_url || undefined}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>
              Ajoutez une description pour la catégorie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={formData.description || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Entrez une description pour cette catégorie..."
            />
          </CardContent>
        </Card>

        {!isNew && (
          <SeoMetadataEditor
            entityType="category"
            entityIdentifier={formData.category_slug || ''}
            autoSave
          />
        )}

        <div className="flex items-center gap-4 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving || !formData.category_name || !formData.category_slug}
            className="bg-[#C6A15B] hover:bg-[#B7933F]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNew ? 'Créer la catégorie' : 'Enregistrer les modifications'}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/home-categories')}
            disabled={saving}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
