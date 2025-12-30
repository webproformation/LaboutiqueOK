'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader as Loader2, ChevronUp, ChevronDown, Trash2, RefreshCw, Plus, Image as ImageIcon, CircleAlert as AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/use-admin';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WooCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image?: {
    src: string;
  } | null;
}

interface HomeCategory {
  id: string;
  category_slug: string;
  category_name: string;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
}

export default function HomeCategoriesPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [allWooCategories, setAllWooCategories] = useState<WooCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les catégories sélectionnées depuis Supabase
      const { data: homeCategories, error: supabaseError } = await supabase
        .from('home_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (supabaseError) throw supabaseError;
      setSelectedCategories(homeCategories || []);

      // Charger toutes les catégories WordPress
      const response = await fetch('/api/woocommerce/categories?action=list');

      if (response.ok) {
        const wooData = await response.json();
        // Filtrer seulement les catégories parentes (parent = 0)
        const parentCategories = wooData.filter((cat: WooCategory) => cat.parent === 0);
        setAllWooCategories(parentCategories);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch WooCommerce categories:', errorData);
        toast.error('Erreur lors du chargement des catégories WordPress');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const refreshWooCategories = async () => {
    try {
      setRefreshing(true);
      toast.info('Synchronisation avec WordPress en cours...');

      const response = await fetch('/api/woocommerce/categories?action=list&refresh=true');

      if (response.ok) {
        const wooData = await response.json();
        const parentCategories = wooData.filter((cat: WooCategory) => cat.parent === 0);
        setAllWooCategories(parentCategories);
        toast.success('Catégories WordPress synchronisées');
      } else {
        throw new Error('Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Error refreshing categories:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setRefreshing(false);
    }
  };

  const addCategory = async (wooCat: WooCategory) => {
    try {
      setSaving(true);
      const maxOrder = selectedCategories.length > 0
        ? Math.max(...selectedCategories.map(c => c.display_order))
        : -1;

      const { data, error } = await supabase
        .from('home_categories')
        .insert({
          category_slug: wooCat.slug,
          category_name: decodeHtmlEntities(wooCat.name),
          display_order: maxOrder + 1,
          is_active: true,
          image_url: wooCat.image?.src || null,
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedCategories([...selectedCategories, data]);
      toast.success(`${decodeHtmlEntities(wooCat.name)} ajoutée`);
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Erreur lors de l\'ajout de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('home_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSelectedCategories(selectedCategories.filter(cat => cat.id !== id));
      toast.success('Catégorie retirée');
    } catch (error) {
      console.error('Error removing category:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('home_categories')
        .update({ is_active: !currentValue })
        .eq('id', id);

      if (error) throw error;

      setSelectedCategories(
        selectedCategories.map(cat =>
          cat.id === id ? { ...cat, is_active: !currentValue } : cat
        )
      );
      toast.success(currentValue ? 'Catégorie désactivée' : 'Catégorie activée');
    } catch (error) {
      console.error('Error toggling category:', error);
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

    [newCategories[index], newCategories[targetIndex]] =
      [newCategories[targetIndex], newCategories[index]];

    newCategories.forEach((cat, idx) => {
      cat.display_order = idx;
    });

    setSelectedCategories(newCategories);

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
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
      loadData();
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

  const availableCategories = allWooCategories.filter(
    woo => !selectedCategories.some(home => home.category_slug === woo.slug)
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Catégories de la page d'accueil</h1>
            <p className="text-gray-600">
              Sélectionnez les catégories à afficher sur la page d'accueil et organisez leur ordre d'affichage
            </p>
          </div>
          <Button
            onClick={refreshWooCategories}
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
                Rafraîchir depuis WordPress
              </>
            )}
          </Button>
        </div>

        {allWooCategories.length === 0 && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune catégorie trouvée dans WordPress. Créez d'abord des catégories de produits dans WooCommerce.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Catégories disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>Catégories disponibles</CardTitle>
            <CardDescription>
              {availableCategories.length} catégorie(s) WordPress disponible(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableCategories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Toutes les catégories sont déjà ajoutées
              </p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {availableCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
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

                    <div className="flex-1">
                      <p className="font-medium">{decodeHtmlEntities(cat.name)}</p>
                      <p className="text-sm text-gray-500">
                        {cat.slug} • {cat.count} produit(s)
                      </p>
                    </div>

                    <Button
                      onClick={() => addCategory(cat)}
                      disabled={saving}
                      size="sm"
                      className="bg-[#C6A15B] hover:bg-[#B7933F]"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catégories sélectionnées */}
        <Card>
          <CardHeader>
            <CardTitle>Catégories sélectionnées</CardTitle>
            <CardDescription>
              {selectedCategories.length} catégorie(s) configurée(s) pour la page d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCategories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucune catégorie sélectionnée
              </p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {selectedCategories.map((category, index) => (
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

                    <div className="flex items-center gap-2">
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aperçu */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Aperçu de l'affichage</CardTitle>
          <CardDescription>
            Voici comment les catégories actives seront affichées sur la page d'accueil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCategories
              .filter(cat => cat.is_active)
              .map((category, index, activeCategories) => {
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
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
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
          {selectedCategories.filter(cat => cat.is_active).length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Aucune catégorie active à afficher
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
