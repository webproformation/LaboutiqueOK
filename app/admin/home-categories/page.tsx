'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Loader2,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
  count: number;
  image?: {
    src: string;
  };
}

interface HomeCategory {
  id: string;
  name: string;
  category_name: string;
  slug: string;
  category_slug: string;
  image_url: string | null;
  sort_order: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

const decodeHtmlEntities = (text: string): string => {
  if (typeof window !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  return text;
};

export default function HomeCategoriesPage() {
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCategories(), loadSelectedCategories()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categories) {
        const categoryOptions: CategoryOption[] = categories.map(cat => ({
          id: parseInt(cat.id) || 0,
          name: cat.name,
          slug: cat.slug,
          count: 0,
          image: cat.image_url ? { src: cat.image_url } : undefined
        }));
        setAvailableCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSelectedCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('home_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setSelectedCategories(data || []);
    } catch (error) {
      console.error('Error loading selected categories:', error);
    }
  };

  const refreshCategories = async () => {
    setRefreshing(true);
    await loadCategories();
    toast.success('Catégories actualisées');
    setRefreshing(false);
  };

  const addCategory = async (wooCat: CategoryOption) => {
    try {
      setSaving(true);

      // Check if already exists
      const exists = selectedCategories.find(c => c.category_slug === wooCat.slug);
      if (exists) {
        toast.error('Cette catégorie est déjà ajoutée');
        return;
      }

      // Get max order
      const maxOrder = selectedCategories.length > 0
        ? Math.max(...selectedCategories.map(c => c.display_order))
        : -1;

      // Insert new category
      const { data, error } = await supabase
        .from('home_categories')
        .insert({
          name: decodeHtmlEntities(wooCat.name),
          category_name: decodeHtmlEntities(wooCat.name),
          slug: wooCat.slug,
          category_slug: wooCat.slug,
          sort_order: maxOrder + 1,
          display_order: maxOrder + 1,
          is_active: true,
          image_url: wooCat.image?.src || null
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedCategories([...selectedCategories, data]);
      toast.success(`${decodeHtmlEntities(wooCat.name)} ajoutée`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (id: string) => {
    if (!confirm('Retirer cette catégorie de la page d\'accueil ?')) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('home_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSelectedCategories(selectedCategories.filter(c => c.id !== id));
      toast.success('Catégorie retirée');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('home_categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setSelectedCategories(
        selectedCategories.map(c =>
          c.id === id ? { ...c, is_active: !currentStatus } : c
        )
      );
      toast.success(`Catégorie ${!currentStatus ? 'activée' : 'désactivée'}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedCategories.length - 1)
    ) {
      return;
    }

    const newCategories = [...selectedCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap
    [newCategories[index], newCategories[targetIndex]] =
      [newCategories[targetIndex], newCategories[index]];

    // Recalculate display_order
    newCategories.forEach((cat, idx) => {
      cat.display_order = idx;
    });

    setSelectedCategories(newCategories);

    // Save to database
    try {
      const updates = newCategories.map(cat =>
        supabase
          .from('home_categories')
          .update({ display_order: cat.display_order })
          .eq('id', cat.id)
      );

      await Promise.all(updates);
      toast.success('Ordre mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      loadSelectedCategories();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
      </div>
    );
  }

  const activeCategories = selectedCategories.filter(cat => cat.is_active);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Catégories de la page d'accueil</h1>
            <p className="text-gray-600">
              Sélectionnez les catégories à afficher sur la page d'accueil et organisez leur ordre d'affichage
            </p>
          </div>
          <Button
            onClick={refreshCategories}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Rafraîchir depuis la base
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Available Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Catégories disponibles</CardTitle>
            <CardDescription>
              {availableCategories.length} catégorie(s) disponible(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {availableCategories.map((cat) => {
                const isAlreadySelected = selectedCategories.some(
                  sc => sc.category_slug === cat.slug
                );

                return (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                      isAlreadySelected
                        ? 'bg-gray-50 opacity-50'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {cat.image?.src ? (
                      <img
                        src={cat.image.src}
                        alt={cat.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{decodeHtmlEntities(cat.name)}</p>
                      <p className="text-sm text-gray-500">{cat.slug}</p>
                    </div>

                    <Button
                      onClick={() => addCategory(cat)}
                      disabled={saving || isAlreadySelected}
                      size="sm"
                      className="bg-[#C6A15B] hover:bg-[#B7933F] shrink-0"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Catégories sélectionnées</CardTitle>
            <CardDescription>
              {selectedCategories.length} catégorie(s) configurée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {selectedCategories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Aucune catégorie sélectionnée</p>
                  <p className="text-sm mt-2">Cliquez sur + pour ajouter des catégories</p>
                </div>
              ) : (
                selectedCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                  >
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.category_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{category.category_name}</p>
                      <p className="text-sm text-gray-500 truncate">{category.category_slug}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Actif' : 'Inactif'}
                      </Badge>

                      <Switch
                        checked={category.is_active}
                        onCheckedChange={() => toggleActive(category.id, category.is_active)}
                      />

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveCategory(index, 'up')}
                          disabled={index === 0 || saving}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveCategory(index, 'down')}
                          disabled={index === selectedCategories.length - 1 || saving}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeCategory(category.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {activeCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de l'affichage</CardTitle>
            <CardDescription>
              Voici comment les catégories actives seront affichées sur la page d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategories.map((category, index) => {
                const isLast = index === activeCategories.length - 1;
                const isOdd = activeCategories.length % 2 === 1;
                const shouldBeFullWidth = isLast && isOdd;

                return (
                  <div
                    key={category.id}
                    className={`relative h-48 rounded-lg overflow-hidden group ${
                      shouldBeFullWidth ? 'md:col-span-2' : ''
                    }`}
                  >
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.category_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#C6A15B] to-[#B7933F]" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <h3 className="text-white text-2xl font-bold">
                        {category.category_name}
                      </h3>
                    </div>
                    {shouldBeFullWidth && (
                      <Badge className="absolute top-2 right-2 bg-[#C6A15B]">
                        Pleine largeur
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
