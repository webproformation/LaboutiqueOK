'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';

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

  useEffect(() => {
    loadProducts();
  }, []);

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
      <div className="mb-12 text-center md:text-left">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C6A15B]/10 rounded-full mb-6">
          <Sparkles className="h-10 w-10 text-[#C6A15B]" />
        </div>
        <h1 className="page-title mb-4">Les Looks de Morgane</h1>
        <p className="text-xl text-gray-600 max-w-2xl md:mx-0 mx-auto">
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
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
