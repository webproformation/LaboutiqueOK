'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Check, AlertCircle, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export default function SyncCategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    withCategories: 0,
    withoutCategories: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, mappingRes] = await Promise.all([
        supabase.from('products').select('id, name, slug').order('name'),
        supabase.from('categories').select('id, name, slug, parent_id').order('name'),
        supabase.from('product_category_mapping').select('product_id'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const productsWithCategories = new Set(
        mappingRes.data?.map((m) => m.product_id) || []
      );

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setStats({
        total: productsRes.data?.length || 0,
        withCategories: productsWithCategories.size,
        withoutCategories: (productsRes.data?.length || 0) - productsWithCategories.size,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryPath = (categoryId: string): Category[] => {
    const path: Category[] = [];
    let current = categories.find((c) => c.id === categoryId);

    while (current) {
      path.unshift(current);
      current = current.parent_id
        ? categories.find((c) => c.id === current?.parent_id)
        : undefined;
    }

    return path;
  };

  const assignCategoryToAllProducts = async () => {
    if (!selectedCategory) {
      toast.error('Veuillez sélectionner une catégorie');
      return;
    }

    if (
      !confirm(
        `Voulez-vous vraiment associer ${stats.withoutCategories} produits à cette catégorie ?`
      )
    ) {
      return;
    }

    setSyncing(true);
    setProgress(0);

    try {
      const productsWithoutCategories = await supabase
        .from('products')
        .select('id')
        .not(
          'id',
          'in',
          `(${
            (
              await supabase
                .from('product_category_mapping')
                .select('product_id')
            ).data
              ?.map((m) => m.product_id)
              .join(',') || ''
          })`
        );

      if (!productsWithoutCategories.data?.length) {
        toast.info('Aucun produit sans catégorie');
        setSyncing(false);
        return;
      }

      const totalProducts = productsWithoutCategories.data.length;
      const batchSize = 50;

      for (let i = 0; i < totalProducts; i += batchSize) {
        const batch = productsWithoutCategories.data
          .slice(i, i + batchSize)
          .map((p) => ({
            product_id: p.id,
            category_id: selectedCategory,
          }));

        const { error } = await supabase
          .from('product_category_mapping')
          .insert(batch);

        if (error) throw error;

        setProgress(Math.round(((i + batch.length) / totalProducts) * 100));
      }

      toast.success('Catégories synchronisées avec succès');
      await loadData();
    } catch (error) {
      console.error('Error syncing categories:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  };

  const getCategoryFullName = (categoryId: string): string => {
    const path = getCategoryPath(categoryId);
    return path.map((c) => c.name).join(' > ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Synchronisation des catégories
        </h1>
        <p className="text-gray-600 mt-2">
          Associez rapidement vos produits à des catégories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Produits
            </CardTitle>
            <Package className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total}
            </div>
            <p className="text-xs text-gray-500 mt-2">Produits en catalogue</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avec Catégories
            </CardTitle>
            <Check className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.withCategories}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.total > 0
                ? Math.round((stats.withCategories / stats.total) * 100)
                : 0}
              % du catalogue
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sans Catégories
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.withoutCategories}
            </div>
            <p className="text-xs text-gray-500 mt-2">À catégoriser</p>
          </CardContent>
        </Card>
      </div>

      {stats.withoutCategories > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Association rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez une catégorie par défaut
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {getCategoryFullName(category.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {syncing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-gray-600 text-center">
                  Synchronisation en cours... {progress}%
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button
                onClick={assignCategoryToAllProducts}
                disabled={!selectedCategory || syncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Associer tous les produits sans catégorie
              </Button>

              <Badge variant="secondary">
                {stats.withoutCategories} produit(s) seront associés
              </Badge>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Cette action associera tous les produits
                sans catégorie à la catégorie sélectionnée. Vous pourrez ensuite
                modifier individuellement chaque produit depuis la page de gestion
                des produits.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.withoutCategories === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Check className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tous les produits sont catégorisés
              </h3>
              <p className="text-gray-600">
                Tous vos produits sont associés à au moins une catégorie.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
