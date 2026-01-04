'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  regular_price: number | null;
  sale_price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
}

export default function LooksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFound, setCategoryFound] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        const items = JSON.parse(saved);
        setWishlist(items.map((item: any) => item.product_id));
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const toggleWishlist = (product: Product) => {
    try {
      const saved = localStorage.getItem('wishlist');
      const items = saved ? JSON.parse(saved) : [];
      const exists = items.find((item: any) => item.product_id === product.id);

      if (exists) {
        const updated = items.filter((item: any) => item.product_id !== product.id);
        localStorage.setItem('wishlist', JSON.stringify(updated));
        setWishlist(updated.map((item: any) => item.product_id));
        toast.success('Retiré des favoris');
      } else {
        const newItem = {
          id: product.id,
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.regular_price || 0,
          sale_price: product.sale_price,
          image_url: product.image_url,
        };
        items.push(newItem);
        localStorage.setItem('wishlist', JSON.stringify(items));
        setWishlist(items.map((item: any) => item.product_id));
        toast.success('Ajouté aux favoris');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const addToCart = (product: Product) => {
    try {
      const saved = localStorage.getItem('cart');
      const cart = saved ? JSON.parse(saved) : [];
      const existing = cart.find((item: any) => item.product_id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.sale_price || product.regular_price || 0,
          image_url: product.image_url,
          quantity: 1,
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      toast.success('Ajouté au panier');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'les-looks-de-morgane')
        .maybeSingle();

      if (categoryError) throw categoryError;

      if (!categoryData) {
        setCategoryFound(false);
        setProducts([]);
        setLoading(false);
        return;
      }

      const category = categoryData as { id: string };

      const { data: productIds, error: mappingError } = await supabase
        .from('product_category_mapping')
        .select('product_id')
        .eq('category_id', category.id);

      if (mappingError) throw mappingError;

      if (productIds && productIds.length > 0) {
        const ids = (productIds as Array<{ product_id: string }>).map((p) => p.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', ids)
          .eq('status', 'publish');

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setCategoryFound(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C6A15B]/10 rounded-full mb-6">
          <Sparkles className="h-10 w-10 text-[#C6A15B]" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Les Looks de Morgane</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Découvrez les coups de cœur et suggestions de style sélectionnés personnellement par Morgane
        </p>
      </div>

      {!categoryFound && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-center">
            La catégorie n'existe pas encore en base de données. Créez-la depuis l'admin avec le slug "les-looks-de-morgane"
          </p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">
            {categoryFound
              ? 'Aucun produit dans cette sélection pour le moment. Revenez bientôt !'
              : 'Cette section sera bientôt disponible avec les looks sélectionnés par Morgane.'}
          </p>
          <Button asChild className="bg-[#C6A15B] hover:bg-[#B8934D] text-white">
            <Link href="/">Découvrir tous nos produits</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden relative border-gray-200 hover:border-[#C6A15B] transition-colors">
              <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-all"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    wishlist.includes(product.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                />
              </button>

              <Link href={`/product/${product.slug}`}>
                <div className="aspect-square overflow-hidden bg-gray-100 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Pas d'image
                    </div>
                  )}
                  {product.sale_price && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      PROMO
                    </div>
                  )}
                </div>
              </Link>

              <CardContent className="p-4">
                <Link href={`/product/${product.slug}`}>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-[#C6A15B] transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                  {product.sale_price ? (
                    <>
                      <span className="text-lg font-bold text-[#C6A15B]">
                        {product.sale_price.toFixed(2)} €
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {product.regular_price?.toFixed(2)} €
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">
                      {product.regular_price?.toFixed(2)} €
                    </span>
                  )}
                </div>

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product);
                  }}
                  className="w-full bg-[#C6A15B] hover:bg-[#B8934D] text-white"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ajouter au panier
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
