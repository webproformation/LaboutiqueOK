'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, ProductCategory, HomeCategory } from '@/lib/supabase';
import { ShoppingBag } from 'lucide-react';

type HomeCategoryWithDetails = HomeCategory & {
  category: ProductCategory;
};

export default function Home() {
  const [categories, setCategories] = useState<HomeCategoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const { data: homeCategories, error: homeCatError } = await supabase
        .from('home_categories')
        .select('*')
        .order('display_order');

      if (homeCatError) throw homeCatError;

      const categoriesWithDetails = await Promise.all(
        (homeCategories || []).map(async (hc) => {
          const { data: category } = await supabase
            .from('product_categories')
            .select('*')
            .eq('id', hc.category_id)
            .maybeSingle();

          return {
            ...hc,
            category: category!
          };
        })
      );

      setCategories(categoriesWithDetails);
    } catch (error) {
      console.error('Error loading categories:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-8 h-8 text-slate-800" />
              <h1 className="text-3xl font-bold text-slate-900">La Boutique de Morgane</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Bienvenue dans notre boutique
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Découvrez notre sélection de produits tendance et de qualité
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((homeCategory) => {
            const category = homeCategory.category;
            return (
              <Link
                key={homeCategory.id}
                href={`/categorie/${category.slug}`}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-[4/3] relative">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  {homeCategory.is_featured && (
                    <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Nouveau
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform duration-300">
                    {category.name}
                  </h3>
                  <p className="text-white/90 text-sm line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
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
