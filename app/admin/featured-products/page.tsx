'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Trash2, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  regular_price: number;
  sale_price: number | null;
  image_url: string | null;
  status: string;
}

interface FeaturedProduct {
  product_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function FeaturedProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadFeaturedProducts(), loadAllFeaturedProductsDetails()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_products')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error loading featured products:', error);
    }
  };

  const loadAllFeaturedProductsDetails = async () => {
    try {
      const { data: featuredData } = await supabase
        .from('featured_products')
        .select('product_id')
        .eq('is_active', true);

      if (!featuredData || featuredData.length === 0) {
        setProducts([]);
        return;
      }

      const productIds = featuredData.map(fp => fp.product_id);

      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) throw error;

      // Sort by featured_products order
      const sortedProducts = productsData.sort((a, b) => {
        const aOrder = featuredData.findIndex(fp => fp.product_id === a.id);
        const bOrder = featuredData.findIndex(fp => fp.product_id === b.id);
        return aOrder - bOrder;
      });

      setProducts(sortedProducts || []);
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  };

  const searchProducts = async () => {
    if (!searchTerm.trim()) {
      toast.error('Veuillez entrer un terme de recherche');
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('status', 'publish')
        .limit(20);

      if (error) throw error;

      // Filter out already featured products
      const featuredIds = featuredProducts.map(fp => fp.product_id);
      const filtered = (data || []).filter(p => !featuredIds.includes(p.id));

      setSearchResults(filtered);

      if (filtered.length === 0) {
        toast.info('Aucun produit trouvé ou tous sont déjà en vedette');
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      setAdding(true);

      // Check if already exists
      const exists = featuredProducts.find(fp => fp.product_id === product.id);
      if (exists) {
        toast.error('Ce produit est déjà en vedette');
        return;
      }

      // Get max order
      const maxOrder = featuredProducts.length > 0
        ? Math.max(...featuredProducts.map(fp => fp.display_order))
        : -1;

      // Insert
      const { error } = await supabase
        .from('featured_products')
        .insert({
          product_id: product.id,
          display_order: maxOrder + 1,
          is_active: true
        });

      if (error) throw error;

      toast.success(`${product.name} ajouté aux produits vedettes`);

      // Reload data
      await loadData();

      // Clear search
      setSearchTerm('');
      setSearchResults([]);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const removeProduct = async (productId: string) => {
    if (!confirm('Retirer ce produit des produits vedettes ?')) return;

    try {
      const { error } = await supabase
        .from('featured_products')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;

      toast.success('Produit retiré des produits vedettes');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const updateOrder = async (productId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('featured_products')
        .update({ display_order: newOrder })
        .eq('product_id', productId);

      if (error) throw error;

      // Update local state
      setFeaturedProducts(
        featuredProducts.map(fp =>
          fp.product_id === productId ? { ...fp, display_order: newOrder } : fp
        )
      );

      toast.success('Ordre mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-[#D4AF37]" />
            <h1 className="text-3xl font-bold text-gray-900">Produits vedettes</h1>
          </div>
          <p className="text-gray-600">
            Gérez les produits mis en avant sur la page d'accueil ({products.length} produit(s))
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un produit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search">Rechercher un produit</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                    placeholder="Nom du produit..."
                    className="flex-1"
                  />
                  {searchTerm && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button onClick={searchProducts} disabled={searching}>
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Résultats de recherche ({searchResults.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">Pas d'image</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {product.sale_price && product.sale_price < product.regular_price ? (
                            <>
                              <span className="text-[#D4AF37] font-bold">
                                {product.sale_price.toFixed(2)}€
                              </span>
                              <span className="text-gray-400 line-through text-sm">
                                {product.regular_price?.toFixed(2)}€
                              </span>
                            </>
                          ) : (
                            <span className="font-bold">
                              {product.regular_price?.toFixed(2)}€
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => addProduct(product)}
                        disabled={adding}
                        size="sm"
                        className="bg-[#C6A15B] hover:bg-[#B7933F]"
                      >
                        {adding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Featured Products Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Produits actuellement en vedette</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun produit en vedette</p>
              <p className="text-sm mt-2">Utilisez la recherche ci-dessus pour ajouter des produits</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => {
                const featuredInfo = featuredProducts.find(fp => fp.product_id === product.id);

                return (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="relative aspect-square bg-gray-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Pas d'image
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-[#D4AF37]">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Vedette
                      </Badge>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2">
                        {product.sale_price && product.sale_price < product.regular_price ? (
                          <>
                            <span className="text-[#D4AF37] font-bold">
                              {product.sale_price.toFixed(2)}€
                            </span>
                            <span className="text-gray-400 line-through text-sm">
                              {product.regular_price?.toFixed(2)}€
                            </span>
                          </>
                        ) : (
                          <span className="font-bold">
                            {product.regular_price?.toFixed(2)}€
                          </span>
                        )}
                      </div>

                      {featuredInfo && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Ordre:</Label>
                            <Input
                              type="number"
                              value={featuredInfo.display_order}
                              onChange={(e) => updateOrder(product.id, parseInt(e.target.value))}
                              className="w-20 h-8 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProduct(product.id)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Retirer
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
