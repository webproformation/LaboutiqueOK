"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Loader2, Filter, GripVertical, Star, Gem, Trash2, Download, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  woocommerce_id: number;
  name: string;
  slug: string;
  regular_price: number;
  sale_price: number | null;
  image_url: string | null;
  stock_status: string;
  stock_quantity: number | null;
  is_active: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
  };
}

interface ProductFlags {
  product_id: number;
  is_active: boolean;
  is_hidden_diamond: boolean;
}

interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
  productsProcessed: number;
  totalProducts?: number;
  productsCreated: number;
  productsUpdated: number;
  databaseCount?: number;
  errors?: Array<{
    productId: number;
    productName: string;
    error: string;
  }>;
  debugInfo?: {
    testMode?: boolean;
    maxProductsPerPage?: number;
    maxPages?: number;
    hasErrors?: boolean;
    errorDetails?: any[];
  };
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [productFlags, setProductFlags] = useState<Map<number, ProductFlags>>(new Map());
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const perPage = 10;

  useEffect(() => {
    loadProducts();
    loadProductFlags();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const safeProducts = Array.isArray(data) ? data : [];
      setProducts(safeProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const loadProductFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_products')
        .select('product_id, is_active, is_hidden_diamond');

      if (error) throw error;

      const flagsMap = new Map<number, ProductFlags>();
      if (Array.isArray(data)) {
        data.forEach((flag) => {
          flagsMap.set(flag.product_id, {
            product_id: flag.product_id,
            is_active: flag.is_active,
            is_hidden_diamond: flag.is_hidden_diamond,
          });
        });
      }
      setProductFlags(flagsMap);
    } catch (error) {
      console.error('Error loading product flags:', error);
      setProductFlags(new Map());
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/sync-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: SyncResult = await response.json();
      setSyncResult(result);

      if (result.success) {
        toast.success('Synchronisation réussie!');
        await loadProducts();
      } else {
        toast.error(result.error || 'Erreur lors de la synchronisation');
      }
    } catch (error: any) {
      console.error('Error syncing products:', error);
      setSyncResult({
        success: false,
        error: error.message || 'Erreur réseau',
        productsProcessed: 0,
        productsCreated: 0,
        productsUpdated: 0,
      });
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const toggleFeatured = async (woocommerceId: number) => {
    try {
      const currentFlags = productFlags.get(woocommerceId);
      const newIsActive = !currentFlags?.is_active;

      if (currentFlags) {
        const { error } = await supabase
          .from('featured_products')
          .update({ is_active: newIsActive })
          .eq('product_id', woocommerceId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('featured_products')
          .insert({
            product_id: woocommerceId,
            is_active: newIsActive,
            is_hidden_diamond: false,
          });

        if (error) throw error;
      }

      toast.success(newIsActive ? 'Produit ajouté aux vedettes' : 'Produit retiré des vedettes');
      await loadProductFlags();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const toggleHiddenDiamond = async (woocommerceId: number) => {
    try {
      const currentFlags = productFlags.get(woocommerceId);
      const newIsHiddenDiamond = !currentFlags?.is_hidden_diamond;

      if (currentFlags) {
        const { error } = await supabase
          .from('featured_products')
          .update({ is_hidden_diamond: newIsHiddenDiamond })
          .eq('product_id', woocommerceId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('featured_products')
          .insert({
            product_id: woocommerceId,
            is_active: false,
            is_hidden_diamond: newIsHiddenDiamond,
          });

        if (error) throw error;
      }

      toast.success(newIsHiddenDiamond ? 'Diamant caché activé' : 'Diamant caché désactivé');
      await loadProductFlags();
    } catch (error) {
      console.error('Error toggling hidden diamond:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      toast.success('Produit supprimé avec succès');
      await loadProducts();
      await loadProductFlags();
      setProductToDelete(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    let filtered = products;

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.is_active);
    } else if (statusFilter === 'draft') {
      filtered = filtered.filter((p) => !p.is_active);
    }

    return filtered;
  }, [products, search, statusFilter]);

  const paginatedProducts = useMemo(() => {
    if (!Array.isArray(filteredProducts)) return [];

    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page, perPage]);

  const totalPages = Array.isArray(filteredProducts)
    ? Math.ceil(filteredProducts.length / perPage)
    : 0;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Produits</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-sm text-gray-500 whitespace-nowrap">
                {Array.isArray(filteredProducts) ? filteredProducts.length : 0} produit{(Array.isArray(filteredProducts) && filteredProducts.length > 1) ? 's' : ''}
              </div>
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Synchronisation...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Sync WooCommerce
                  </>
                )}
              </Button>
              <Link href="/admin/products/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un produit
                </Button>
              </Link>
            </div>
          </div>

          {syncResult && (
            <Alert className={syncResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {syncResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={syncResult.success ? 'text-green-800' : 'text-red-800'}>
                {syncResult.success ? (
                  <div>
                    <strong>Synchronisation réussie!</strong>
                    <div className="mt-1 text-sm space-y-0.5">
                      {syncResult.totalProducts && <p>Total WooCommerce: {syncResult.totalProducts}</p>}
                      <p>Traités: {syncResult.productsProcessed} | Créés: {syncResult.productsCreated} | Mis à jour: {syncResult.productsUpdated}</p>
                      {syncResult.databaseCount !== undefined && (
                        <p className="font-bold text-green-600">✓ Produits en base: {syncResult.databaseCount}</p>
                      )}
                      {syncResult.debugInfo?.testMode && (
                        <p className="text-yellow-600">⚠️ MODE TEST: Limité à {syncResult.debugInfo.maxProductsPerPage} produits</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong>Erreur</strong>
                    <p className="mt-1 text-sm">{syncResult.error}</p>
                    {syncResult.debugInfo?.errorDetails && syncResult.debugInfo.errorDetails.length > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="font-semibold">Détails des erreurs:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {syncResult.debugInfo.errorDetails.slice(0, 5).map((err: any, idx: number) => (
                            <li key={idx}>
                              Produit {err.productId} ({err.productName}): {err.error}
                            </li>
                          ))}
                          {syncResult.debugInfo.errorDetails.length > 5 && (
                            <li>... et {syncResult.debugInfo.errorDetails.length - 5} autres erreurs</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (!Array.isArray(paginatedProducts) || paginatedProducts.length === 0) ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              {search ? 'Aucun produit trouvé pour cette recherche' : 'Aucun produit disponible'}
            </p>
            <Button onClick={handleSync} variant="outline" className="mt-4">
              <Download className="w-4 h-4 mr-2" />
              Synchroniser avec WooCommerce
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden lg:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16"></TableHead>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="w-32">Prix</TableHead>
                    <TableHead className="w-32">Stock</TableHead>
                    <TableHead className="w-32">Statut</TableHead>
                    <TableHead className="w-24 text-center">Vedette</TableHead>
                    <TableHead className="w-24 text-center">Diamant</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(paginatedProducts) && paginatedProducts.map((product) => {
                    const isDraft = !product.is_active;
                    const flags = productFlags.get(product.woocommerce_id);
                    const isFeatured = flags?.is_active || false;
                    const isHiddenDiamond = flags?.is_hidden_diamond || false;

                    return (
                      <TableRow key={product.id} className={isDraft ? 'opacity-50' : ''}>
                        <TableCell>
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </TableCell>
                        <TableCell>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className={`w-12 h-12 object-cover rounded ${isDraft ? 'grayscale' : ''}`}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-400">N/A</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className={`font-medium ${isDraft ? 'text-gray-400' : ''}`}>
                                {decodeHtmlEntities(product.name)}
                              </div>
                              <div className="text-sm text-gray-500">{product.slug}</div>
                              {product.categories?.name && (
                                <div className="text-xs text-blue-600 mt-0.5">
                                  {decodeHtmlEntities(product.categories.name)}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              WC
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.regular_price}€</div>
                          {product.sale_price && (
                            <div className="text-sm text-gray-400 line-through">
                              {product.sale_price}€
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            product.stock_status === 'instock'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {product.stock_status === 'instock' ? 'En stock' : 'Rupture'}
                            {product.stock_quantity && product.stock_quantity > 0 && ` (${product.stock_quantity})`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            isDraft
                              ? 'bg-orange-50 text-orange-600'
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {isDraft ? 'Brouillon' : 'Publié'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatured(product.woocommerce_id)}
                            className="hover:bg-yellow-50"
                            title={isFeatured ? 'Retirer des vedettes' : 'Ajouter aux vedettes'}
                          >
                            <Star
                              className={`w-5 h-5 ${
                                isFeatured
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleHiddenDiamond(product.woocommerce_id)}
                            className="hover:bg-blue-50"
                            title={isHiddenDiamond ? 'Désactiver le diamant caché' : 'Activer le diamant caché'}
                          >
                            <Gem
                              className={`w-5 h-5 ${
                                isHiddenDiamond
                                  ? 'text-blue-500 fill-blue-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/products/${product.id}`}>
                              <Button variant="ghost" size="sm" title="Modifier">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProductToDelete(product)}
                              className="hover:bg-red-50 hover:text-red-600"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="lg:hidden space-y-4">
            {Array.isArray(paginatedProducts) && paginatedProducts.map((product) => {
              const isDraft = !product.is_active;
              const flags = productFlags.get(product.woocommerce_id);
              const isFeatured = flags?.is_active || false;
              const isHiddenDiamond = flags?.is_hidden_diamond || false;

              return (
                <Card key={product.id} className={isDraft ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className={`w-20 h-20 object-cover rounded ${isDraft ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">N/A</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium text-sm line-clamp-2 ${isDraft ? 'text-gray-400' : ''}`}>
                            {decodeHtmlEntities(product.name)}
                          </h3>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                            WC
                          </Badge>
                        </div>

                        {product.categories?.name && (
                          <div className="text-xs text-blue-600 mb-1">
                            {decodeHtmlEntities(product.categories.name)}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="font-bold text-lg">{product.regular_price}€</div>
                          {product.sale_price && (
                            <div className="text-sm text-gray-400 line-through">
                              {product.sale_price}€
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            product.stock_status === 'instock'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {product.stock_status === 'instock' ? 'En stock' : 'Rupture'}
                          </span>

                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            isDraft
                              ? 'bg-orange-50 text-orange-600'
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {isDraft ? 'Brouillon' : 'Publié'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/admin/products/${product.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatured(product.woocommerce_id)}
                            className="hover:bg-yellow-50"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                isFeatured
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleHiddenDiamond(product.woocommerce_id)}
                            className="hover:bg-blue-50"
                          >
                            <Gem
                              className={`w-5 h-5 ${
                                isHiddenDiamond
                                  ? 'text-blue-500 fill-blue-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProductToDelete(product)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="px-4 py-2">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit <strong>{productToDelete?.name}</strong> ?
              <br /><br />
              Cette action supprimera le produit de Supabase uniquement. Pour le supprimer aussi de WooCommerce, utilisez l'interface WooCommerce.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
