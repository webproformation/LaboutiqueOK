'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Skeleton } from '@/components/ui/skeleton';

interface HomeCategory {
  id: string;
  category_slug: string;
  category_name: string;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  product_count?: number;
}

export default function HomeCategories() {
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const decodeHtmlEntities = (text: string): string => {
    if (typeof window !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    }
    return text;
  };

  useEffect(() => {
    setMounted(true);
    setLoading(true);
    loadCategories();

    return () => {
      setMounted(false);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('home_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Fetch product counts from WooCommerce
      try {
        const response = await fetch('/api/woocommerce/categories-with-count');
        if (response.ok) {
          const wooCats = await response.json();
          const categoriesWithCount = (data || []).map(cat => {
            const wooCat = wooCats.find((wc: any) => wc.slug === cat.category_slug);
            return {
              ...cat,
              product_count: wooCat?.count || 0,
            };
          });
          setCategories(categoriesWithCount);
        } else {
          setCategories(data || []);
        }
      } catch (err) {
        console.error('Error fetching product counts:', err);
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error loading home categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-8" style={{ color: '#C6A15B' }}>Nos Catégories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category, index) => {
            const isLast = index === categories.length - 1;
            const isOdd = categories.length % 2 === 1;
            const shouldBeFullWidth = isLast && isOdd;

            return (
              <Link
                key={category.id}
                href={`/category/${category.category_slug}`}
                className={`relative h-64 md:h-80 rounded-lg overflow-hidden group transition-all hover:scale-[1.02] animate-in fade-in duration-500 ${
                  shouldBeFullWidth ? 'md:col-span-2' : ''
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.category_name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#C6A15B] to-[#B7933F]" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <div className="text-center px-4">
                    <h3 className="text-white text-2xl font-bold mb-2">
                      {decodeHtmlEntities(category.category_name)}
                    </h3>
                    {category.product_count !== undefined && (
                      <p className="text-white/90 text-base">
                        {category.product_count} produit{category.product_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
