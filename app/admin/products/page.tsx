"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Loader2, Upload, Filter, Eye, EyeOff, GripVertical, Star, Gem, Trash2 } from 'lucide-react';
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

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  status: string;
  stock_status: string;
  stock_quantity: number | null;
  images?: Array<{
    src: string;
    name?: string;
  }>;
}

interface ProductFlags {
  product_id: number;
  is_active: boolean;
  is_hidden_diamond: boolean;
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'publish' | 'draft'>('all');
  const [productFlags, setProductFlags] = useState<Map<number, ProductFlags>>(new Map());
  const [productToDelete, setProductToDelete] = useState<WooProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const perPage = 10;

  useEffect(() => {
    loadProducts();
    loadProductFlags();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/woocommerce/products?action=all');
      if (!response.ok) {
        console.error('Failed to fetch products:', response.status, response.statusText);
        setProducts([]);
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Products data is not an array:', data);
        setProducts([]);
        toast.error('Format de données invalide');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]); // Always set to empty array on error
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
      data?.forEach((flag) => {
        flagsMap.set(flag.product_id, {
          product_id: flag.product_id,
          is_active: flag.is_active,
          is_hidden_diamond: flag.is_hidden_diamond,
        });
      });
      setProductFlags(flagsMap);
    } catch (error) {
      console.error('Error loading product flags:', error);
    }
  };

  const toggleFeatured = async (productId: number) => {
    try {
      const currentFlags = productFlags.get(productId);
      const newIsActive = !currentFlags?.is_active;

      if (currentFlags) {
        const { error } = await supabase
          .from('featured_products')
          .update({ is_active: newIsActive })
          .eq('product_id', productId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('featured_products')
          .insert({
            product_id: productId,
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

  const toggleHiddenDiamond = async (productId: number) => {
    try {
      const currentFlags = productFlags.get(productId);
      const newIsHiddenDiamond = !currentFlags?.is_hidden_diamond;

      if (currentFlags) {
        const { error } = await supabase
          .from('featured_products')
          .update({ is_hidden_diamond: newIsHiddenDiamond })
          .eq('product_id', productId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('featured_products')
          .insert({
            product_id: productId,
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

  const filteredProducts = useMemo(() => {
    // Ensure products is always an array
    if (!Array.isArray(products)) {
      console.warn('Products is not an array:', products);
      return [];
    }

    let filtered = products;

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p: WooProduct) =>
        p.name?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p: WooProduct) => p.status === statusFilter);
    }

    return filtered;
  }, [products, search, statusFilter]);

  const paginatedProducts = useMemo(() => {
    // Defensive check
    if (!Array.isArray(filteredProducts)) {
      return [];
    }
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page, perPage]);

  const totalPages = Math.ceil((Array.isArray(filteredProducts) ? filteredProducts.length : 0) / perPage);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleStatusChange = async (productId: number, action: 'draft' | 'publish') => {
    setStatusUpdating(productId);
    try {
      const response = await fetch('/api/woocommerce/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          productId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur lors de la mise à jour du statut`);
      }

      await loadProducts();
      toast.success(action === 'draft' ? 'Produit mis en brouillon' : 'Produit publié');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
      console.error(error);
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/woocommerce/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          productId: productToDelete.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du produit');
      }

      toast.success('Produit supprimé avec succès');
      await loadProducts();
      await loadProductFlags();
      setProductToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Produits</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-sm text-gray-500 whitespace-nowrap">
              {filteredProducts.length} produits
            </div>
            <Link href="/admin/products/create" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un produit
              </Button>
            </Link>
          </div>
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
                  <SelectItem value="publish">Actifs</SelectItem>
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
      ) : paginatedProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              {search ? 'Aucun produit trouvé pour cette recherche' : 'Aucun produit disponible'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
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
                    <TableHead className="w-32">Statut Produit</TableHead>
                    <TableHead className="w-24 text-center">Vedette</TableHead>
                    <TableHead className="w-24 text-center">Diamant</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => {
                    const isDraft = product.status === 'draft';
                    const flags = productFlags.get(product.id);
                    const isFeatured = flags?.is_active || false;
                    const isHiddenDiamond = flags?.is_hidden_diamond || false;

                    return (
                      <TableRow key={product.id} className={isDraft ? 'opacity-50' : ''}>
                        <TableCell>
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </TableCell>
                        <TableCell>
                          {product.images && product.images.length > 0 && product.images[0]?.src ? (
                            <img
                              src={product.images[0].src}
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
                          <div className={`font-medium ${isDraft ? 'text-gray-400' : ''}`}>
                            {decodeHtmlEntities(product.name)}
                          </div>
                          <div className="text-sm text-gray-500">{product.slug}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.price}€</div>
                          {product.regular_price && product.price !== product.regular_price && (
                            <div className="text-sm text-gray-400 line-through">
                              {product.regular_price}€
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
                          {isDraft ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                Brouillon
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(product.id, 'publish')}
                                disabled={statusUpdating === product.id}
                                title="Publier ce produit"
                              >
                                {statusUpdating === product.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                Publié
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(product.id, 'draft')}
                                disabled={statusUpdating === product.id}
                                title="Mettre en brouillon"
                              >
                                {statusUpdating === product.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatured(product.id)}
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
                            onClick={() => toggleHiddenDiamond(product.id)}
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedProducts.map((product) => {
              const isDraft = product.status === 'draft';
              const flags = productFlags.get(product.id);
              const isFeatured = flags?.is_active || false;
              const isHiddenDiamond = flags?.is_hidden_diamond || false;

              return (
                <Card key={product.id} className={isDraft ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {product.images && product.images.length > 0 && product.images[0]?.src ? (
                          <img
                            src={product.images[0].src}
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
                        <h3 className={`font-medium text-sm mb-1 line-clamp-2 ${isDraft ? 'text-gray-400' : ''}`}>
                          {decodeHtmlEntities(product.name)}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="font-bold text-lg">{product.price}€</div>
                          {product.regular_price && product.price !== product.regular_price && (
                            <div className="text-sm text-gray-400 line-through">
                              {product.regular_price}€
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

                          {isDraft ? (
                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              Brouillon
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                              Publié
                            </span>
                          )}
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
                            onClick={() => toggleFeatured(product.id)}
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

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleHiddenDiamond(product.id)}
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

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(product.id, isDraft ? 'publish' : 'draft')}
                            disabled={statusUpdating === product.id}
                            title={isDraft ? 'Publier ce produit' : 'Mettre en brouillon'}
                          >
                            {statusUpdating === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isDraft ? (
                              <Upload className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>

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
              Cette action est irréversible et supprimera le produit de WooCommerce ainsi que toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
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
