'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, ProductCategory } from '@/lib/supabase';
import { decodeHtmlEntities } from '@/lib/utils';

interface MegaMenuProps {
  isOpen: boolean;
  categorySlug: string;
  onClose: () => void;
}

interface CategoryWithChildren extends ProductCategory {
  children?: CategoryWithChildren[];
}

export function MegaMenu({ isOpen, categorySlug, onClose }: MegaMenuProps) {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, categorySlug]);

  async function hasProductsInStock(categoryId: string): Promise<boolean> {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .gt('stock_quantity', 0);

    return (count || 0) > 0;
  }

  async function loadCategories() {
    try {
      const { data: parentCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (parentCategory) {
        const parent = parentCategory as { id: string };

        const { data: level1Categories } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', parent.id)
          .eq('is_visible', true)
          .order('display_order', { ascending: true });

        if (level1Categories) {
          const categoriesWithChildren: CategoryWithChildren[] = await Promise.all(
            level1Categories.map(async (cat) => {
              const { data: level2Children } = await supabase
                .from('categories')
                .select('*')
                .eq('parent_id', cat.id)
                .eq('is_visible', true)
                .order('display_order', { ascending: true });

              const level2WithChildren = level2Children ? await Promise.all(
                level2Children.map(async (child) => {
                  const { data: level3Children } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('parent_id', child.id)
                    .eq('is_visible', true)
                    .order('display_order', { ascending: true });

                  const level3Filtered = level3Children ? await Promise.all(
                    level3Children.map(async (grandchild) => {
                      const hasProducts = await hasProductsInStock(grandchild.id);
                      return hasProducts ? grandchild : null;
                    })
                  ).then(items => items.filter(Boolean) as ProductCategory[]) : [];

                  const hasLevel2Products = await hasProductsInStock(child.id);
                  const hasAnyProducts = hasLevel2Products || level3Filtered.length > 0;

                  return hasAnyProducts ? {
                    ...child,
                    children: level3Filtered
                  } : null;
                })
              ).then(items => items.filter(Boolean) as CategoryWithChildren[]) : [];

              return {
                ...cat,
                children: level2WithChildren
              };
            })
          );

          const filteredCategories = categoriesWithChildren.filter(cat =>
            cat.children && cat.children.length > 0
          );

          setCategories(filteredCategories);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 right-0 top-full bg-[#F2F2E8] border-t border-gray-200 shadow-xl z-50"
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : categories.length > 0 ? (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((category) => (
              <div key={category.id} className="space-y-3">
                <Link
                  href={`/category/${category.slug}`}
                  className="block group"
                  onClick={onClose}
                >
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-[#D4AF37] transition-colors mb-3 border-b border-gray-300 pb-2">
                    {decodeHtmlEntities(category.name)}
                  </h3>
                </Link>
                {category.children && category.children.length > 0 && (
                  <ul className="space-y-2 pl-0">
                    {category.children.map((child) => (
                      <li key={child.id} className="space-y-1">
                        <Link
                          href={`/category/${child.slug}`}
                          className="block text-sm font-medium text-gray-700 hover:text-[#D4AF37] hover:translate-x-1 transition-all duration-200"
                          onClick={onClose}
                        >
                          {decodeHtmlEntities(child.name)}
                        </Link>
                        {child.children && child.children.length > 0 && (
                          <ul className="space-y-1 pl-3 mt-1">
                            {child.children.map((grandchild) => (
                              <li key={grandchild.id}>
                                <Link
                                  href={`/category/${grandchild.slug}`}
                                  className="block text-xs text-gray-600 hover:text-[#D4AF37] hover:translate-x-1 transition-all duration-200"
                                  onClick={onClose}
                                >
                                  {decodeHtmlEntities(grandchild.name)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-600">
            Aucune sous-catégorie disponible
          </div>
        )}
      </div>
    </div>
  );
}
