'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X, GripVertical, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import Image from 'next/image';

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  images: Array<{ src: string }>;
  stock_status: string;
}

interface Product extends WooProduct {}

interface RelatedProduct {
  id: string;
  product_id: string;
  related_product_id: string;
  display_order: number;
  product?: Product;
}

interface RelatedProductsManagerProps {
  productId: string;
}

export default function RelatedProductsManager({ productId }: RelatedProductsManagerProps) {
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadRelatedProducts();
  }, [productId]);

  const loadRelatedProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('related_products')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const relatedWithDetails = await Promise.all(
        (data || []).map(async (rel) => {
          try {
            const response = await fetch(`/api/woocommerce/products?id=${rel.related_product_id}`);
            const products = await response.json();
            return {
              ...rel,
              product: products[0] || null,
            };
          } catch (err) {
            return { ...rel, product: null };
          }
        })
      );

      setRelatedProducts(relatedWithDetails.filter(r => r.product));
    } catch (error) {
      console.error('Error loading related products:', error);
      toast.error('Erreur lors du chargement des produits complémentaires');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/woocommerce/products?search=${encodeURIComponent(searchQuery)}&per_page=20`);
      const products = await response.json();

      const filtered = products.filter((p: Product) =>
        p.id.toString() !== productId &&
        !relatedProducts.find(rp => rp.related_product_id === p.id.toString())
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProducts();
    }
  };

  const addRelatedProduct = async (product: Product) => {
    try {
      const maxOrder = relatedProducts.length > 0
        ? Math.max(...relatedProducts.map(rp => rp.display_order))
        : -1;

      const { error } = await supabase
        .from('related_products')
        .insert([{
          product_id: productId,
          related_product_id: product.id.toString(),
          display_order: maxOrder + 1,
        }]);

      if (error) throw error;

      toast.success(`${product.name} ajouté aux produits complémentaires`);
      setSearchQuery('');
      setSearchResults([]);
      await loadRelatedProducts();
    } catch (error: any) {
      console.error('Error adding related product:', error);
      toast.error('Erreur lors de l\'ajout du produit');
    }
  };

  const removeRelatedProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('related_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Produit complémentaire supprimé');
      await loadRelatedProducts();
    } catch (error) {
      console.error('Error removing related product:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const moveProduct = async (index: number, direction: 'up' | 'down') => {
    const newOrder = [...relatedProducts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    try {
      await Promise.all(
        newOrder.map((rp, idx) =>
          supabase
            .from('related_products')
            .update({ display_order: idx })
            .eq('id', rp.id)
        )
      );

      setRelatedProducts(newOrder);
      toast.success('Ordre mis à jour');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Produits Complémentaires
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Rechercher un produit</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nom, référence ou UGS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <Button
              onClick={searchProducts}
              disabled={searching || !searchQuery.trim()}
            >
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
            <p className="text-sm font-semibold text-gray-700">Résultats de recherche</p>
            <div className="grid grid-cols-1 gap-2">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {product.images[0]?.src ? (
                      <Image
                        src={product.images[0].src}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>UGS: {product.sku || 'N/A'}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#b8933d]">{product.price} €</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addRelatedProduct(product)}
                    className="bg-[#b8933d] hover:bg-[#a07c2f]"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Produits complémentaires sélectionnés ({relatedProducts.length})</Label>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : relatedProducts.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Aucun produit complémentaire</p>
              <p className="text-xs text-gray-400 mt-1">
                Utilisez la recherche ci-dessus pour ajouter des produits
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {relatedProducts.map((relatedProduct, index) => (
                <div
                  key={relatedProduct.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveProduct(index, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <GripVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {relatedProduct.product?.images[0]?.src ? (
                      <Image
                        src={relatedProduct.product.images[0].src}
                        alt={relatedProduct.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {relatedProduct.product?.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>UGS: {relatedProduct.product?.sku || 'N/A'}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#b8933d]">
                        {relatedProduct.product?.price} €
                      </span>
                      {relatedProduct.product?.stock_status === 'instock' ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          En stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Rupture
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRelatedProduct(relatedProduct.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
