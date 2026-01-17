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

                  return {
                    ...child,
                    children: level3Children || []
                  };
                })
              ) : [];

              return {
                ...cat,
                children: level2WithChildren
              };
            })
          );

          setCategories(categoriesWithChildren);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const getGridColsClass = (count: number): string => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  const gridColsClass = getGridColsClass(categories.length);
  const maxWidthClass = categories.length < 5 ? 'max-w-6xl' : '';

  return (
    <div
      className="absolute left-0 right-0 top-full bg-[#F2F2E8] border-t border-gray-200 shadow-xl z-50"
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : categories.length > 0 ? (
          <div className={`grid gap-8 ${gridColsClass} ${maxWidthClass} mx-auto justify-items-center`}>
            {categories.map((category) => (
              <div key={category.id} className="space-y-3 w-full">
                <Link
                  href={`/category/${category.slug}`}
                  className="block group w-full"
                  onClick={onClose}
                >
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-[#D4AF37] transition-colors mb-3 border-b border-gray-300 pb-2 text-center w-full">
                    {decodeHtmlEntities(category.name)}
                  </h3>
                </Link>
                {category.children && category.children.length > 0 && (
                  <ul className="space-y-2 pl-0">
                    {category.children.map((child) => (
                      <li key={child.id} className="space-y-1">
                        <Link
                          href={`/category/${child.slug}`}
                          className="block text-sm font-medium text-gray-700 hover:text-[#D4AF37] transition-all duration-200 text-center"
                          onClick={onClose}
                        >
                          {decodeHtmlEntities(child.name)}
                        </Link>
                        {child.children && child.children.length > 0 && (
                          <ul className="space-y-1 pl-0 mt-1">
                            {child.children.map((grandchild) => (
                              <li key={grandchild.id}>
                                <Link
                                  href={`/category/${grandchild.slug}`}
                                  className="block text-xs text-gray-600 hover:text-[#D4AF37] transition-all duration-200 text-center"
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
