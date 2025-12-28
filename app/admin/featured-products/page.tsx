"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';

interface FeaturedProduct {
  id: string;
  product_id: number;
  product_name: string;
  product_image: string;
  display_order: number;
  created_at: string;
}

export default function FeaturedProductsPage() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('featured_products')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    if (!productId) {
      toast.error('Veuillez entrer un ID de produit');
      return;
    }

    setAdding(true);
    try {
      // Fetch product details from WooCommerce
      const response = await fetch(`/api/woocommerce/products?action=get&id=${productId}`);
      if (!response.ok) {
        throw new Error('Produit non trouvé');
      }

      const product = await response.json();

      const maxOrder = products.length > 0
        ? Math.max(...products.map(p => p.display_order))
        : 0;

      const { error } = await supabase
        .from('featured_products')
        .insert({
          product_id: parseInt(productId),
          product_name: product.name,
          product_image: product.images?.[0]?.src || '',
          display_order: maxOrder + 1,
        });

      if (error) throw error;

      toast.success('Produit ajouté avec succès');
      setProductId('');
      fetchProducts();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout du produit');
    } finally {
      setAdding(false);
    }
  };

  const removeProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('featured_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Produit retiré avec succès');
      fetchProducts();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('featured_products')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Produits mis en vedette</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un produit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="productId">ID du produit WooCommerce</Label>
              <Input
                id="productId"
                type="number"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Entrez l'ID du produit"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addProduct} disabled={adding}>
                {adding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Aucun produit mis en vedette
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
                  {product.product_image && (
                    <Image
                      src={product.product_image}
                      alt={product.product_name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <h3 className="font-medium mb-2 line-clamp-2">
                  {product.product_name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <Label className="text-sm">Ordre:</Label>
                  <Input
                    type="number"
                    value={product.display_order}
                    onChange={(e) => updateOrder(product.id, parseInt(e.target.value))}
                    className="w-20"
                  />
                </div>
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
          ))}
        </div>
      )}
    </div>
  );
}
