'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Product, ProductCategory } from '@/lib/supabase';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

type ProductWithCategories = Product & {
  categories?: ProductCategory[];
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryAndProducts();
  }, [slug]);

  async function loadCategoryAndProducts() {
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (categoryError) throw categoryError;

      if (!categoryData) {
        router.push('/');
        return;
      }

      setCategory(categoryData);

      const { data: mappingData, error: mappingError } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', categoryData.id);

      if (mappingError) throw mappingError;

      const productIds = mappingData?.map(m => m.product_id) || [];

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('is_active', true);

        if (productsError) throw productsError;
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Chargement...</div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <ShoppingBag className="w-8 h-8 text-slate-800" />
              <h1 className="text-3xl font-bold text-slate-900">La Boutique de Morgane</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Link>

        <div className="mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{category.name}</h2>
          <p className="text-lg text-slate-600">{category.description}</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-slate-400 mb-4">
              <ShoppingBag className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-xl text-slate-600">Aucun produit disponible dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const displayPrice = product.sale_price || product.regular_price;
              const hasDiscount = product.sale_price && product.sale_price < product.regular_price;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="aspect-square relative overflow-hidden bg-slate-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                    {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                      <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Stock limité
                      </div>
                    )}
                    {product.stock_status === 'outofstock' && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Épuisé
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Promo
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {product.short_description || product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {hasDiscount && (
                          <span className="text-sm text-slate-400 line-through">
                            {product.regular_price.toFixed(2)} €
                          </span>
                        )}
                        <span className="text-2xl font-bold text-slate-900">
                          {displayPrice.toFixed(2)} €
                        </span>
                      </div>
                      {product.stock_status === 'instock' && (
                        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
                          Ajouter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-slate-600">
            © 2026 La Boutique de Morgane. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
