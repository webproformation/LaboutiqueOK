'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  category_id?: string | null;
  category_slug: string;
  category_name: string;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  description?: string | null;
  category?: {
    id: string;
    woocommerce_id: number;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    count?: number;
  } | null;
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

      // Charger les catégories sélectionnées via l'API route (bypass PostgREST cache)
      const homeCategoriesResponse = await fetch('/api/home-categories-get');

      if (!homeCategoriesResponse.ok) {
        console.error('Failed to fetch home categories');
      } else {
        const homeCategories = await homeCategoriesResponse.json();
        setSelectedCategories(homeCategories || []);
      }

      // Charger toutes les catégories depuis le cache Supabase
      const response = await fetch('/api/categories-cache?parent_only=true');

      if (response.ok) {
        const data = await response.json();
        console.log('[Home Categories] Réponse API:', data);
        console.log('[Home Categories] data.categories:', data.categories);
        const cachedCategories = Array.isArray(data.categories) ? data.categories : [];
        console.log('[Home Categories] Catégories reçues par le composant:', cachedCategories);
        console.log('[Home Categories] Nombre de catégories:', cachedCategories.length);
        setAllWooCategories(cachedCategories);

        if (cachedCategories.length === 0) {
          toast.info('Aucune catégorie dans le cache. Cliquez sur "Rafraîchir depuis WordPress" pour synchroniser.');
        } else {
          console.log(`[Home Categories] ✅ ${cachedCategories.length} catégories chargées avec succès`);
        }
      } else {
        console.error('Failed to fetch cached categories');
        setAllWooCategories([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setAllWooCategories([]);
      setSelectedCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshWooCategories = async () => {
    try {
      setRefreshing(true);
      toast.info('Synchronisation avec WordPress en cours...');

      // Fetch fresh data from WooCommerce
      const wooResponse = await fetch('/api/woocommerce/categories?action=list&refresh=true');

      if (!wooResponse.ok) {
        throw new Error('Erreur lors du chargement depuis WooCommerce');
      }

      const wooData = await wooResponse.json();

      // Sync to Supabase cache
      const syncResponse = await fetch('/api/categories-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          categories: wooData
        })
      });

      if (!syncResponse.ok) {
        throw new Error('Erreur lors de la synchronisation du cache');
      }

      const syncResult = await syncResponse.json();
      console.log('[Home Categories] Résultat de la synchro:', syncResult);

      // Reload from cache avec logs détaillés
      console.log('[Home Categories] 🔄 Rechargement automatique après synchro...');
      const cacheResponse = await fetch('/api/categories-cache?parent_only=true');
      if (cacheResponse.ok) {
        const data = await cacheResponse.json();
        console.log('[Home Categories] Données après synchro:', data);
        const cachedCategories = Array.isArray(data.categories) ? data.categories : [];
        console.log('[Home Categories] Catégories après synchro:', cachedCategories);
        console.log('[Home Categories] Nombre après synchro:', cachedCategories.length);
        setAllWooCategories(cachedCategories);

        if (cachedCategories.length > 0) {
          console.log(`[Home Categories] ✅ ${cachedCategories.length} catégories disponibles après synchro`);
          toast.success(`${syncResult.count || cachedCategories.length} catégories synchronisées et chargées`);
        } else {
          console.warn('[Home Categories] ⚠️ Synchro réussie mais aucune catégorie trouvée après');
          toast.warning('Synchronisation réussie mais aucune catégorie disponible');
        }
      } else {
        console.error('[Home Categories] Erreur lors du rechargement après synchro');
        toast.warning('Synchronisation réussie mais erreur de rechargement');
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

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const supabase = await import('@supabase/supabase-js').then(mod =>
        mod.createClient(supabaseUrl, supabaseAnonKey)
      );

      let categoryId: string | null = null;

      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('woocommerce_id', wooCat.id)
        .maybeSingle();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            woocommerce_id: wooCat.id,
            name: decodeHtmlEntities(wooCat.name),
            slug: wooCat.slug,
            description: '',
            woocommerce_parent_id: wooCat.parent && wooCat.parent !== 0 ? wooCat.parent : null,
            image_url: wooCat.image?.src || null,
            count: wooCat.count || 0,
            is_active: true
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating category:', createError);
          throw new Error('Impossible de créer la catégorie localement');
        }

        categoryId = newCategory.id;
      }

      const maxOrder = selectedCategories.length > 0
        ? Math.max(...selectedCategories.map(c => c.display_order))
        : -1;

      const response = await fetch('/api/home-categories-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          categoryData: {
            category_id: categoryId,
            category_slug: wooCat.slug,
            category_name: decodeHtmlEntities(wooCat.name),
            display_order: maxOrder + 1,
            is_active: true,
            image_url: wooCat.image?.src || null,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout');
      }

      const data = await response.json();
      setSelectedCategories([...selectedCategories, data]);
      toast.success(`${decodeHtmlEntities(wooCat.name)} ajoutée`);
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (id: string) => {
    try {
      setSaving(true);

      const response = await fetch('/api/home-categories-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          categoryId: id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      setSelectedCategories(selectedCategories.filter(cat => cat.id !== id));
      toast.success('Catégorie retirée');
    } catch (error: any) {
      console.error('Error removing category:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch('/api/home-categories-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          categoryId: id,
          categoryData: { is_active: !currentValue }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      setSelectedCategories(
        selectedCategories.map(cat =>
          cat.id === id ? { ...cat, is_active: !currentValue } : cat
        )
      );
      toast.success(currentValue ? 'Catégorie désactivée' : 'Catégorie activée');
    } catch (error: any) {
      console.error('Error toggling category:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
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
        fetch('/api/home-categories-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            categoryId: cat.id,
            categoryData: { display_order: cat.display_order }
          })
        })
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

  const availableCategories = Array.isArray(allWooCategories)
    ? allWooCategories.filter(woo => !selectedCategories.some(home => home.category_slug === woo.slug))
    : [];

  console.log('[Home Categories] Avant le render - allWooCategories:', allWooCategories);
  console.log('[Home Categories] Avant le render - availableCategories:', availableCategories);
  console.log('[Home Categories] Avant le render - selectedCategories:', selectedCategories);

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
