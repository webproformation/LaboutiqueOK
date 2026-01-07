'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, ProductCategory } from '@/lib/supabase';
import { decodeHtmlEntities } from '@/lib/utils';

interface MegaMenuProps {
  isOpen: boolean;
  type: 'mode' | 'morgane' | 'maison' | 'beaute';
  onClose: () => void;
}

interface CategoryWithChildren extends ProductCategory {
  children?: CategoryWithChildren[];
}

const morganeCategories = [
  { name: "Les coups de cœur de Morgane", slug: "les-coups-de-coeur-de-morgane" },
  { name: "L'ambiance de la semaine", slug: "l-ambiance-de-la-semaine" },
  { name: "Le look de la semaine by Morgane", slug: "le-look-de-la-semaine-by-morgane" }
];

export function MegaMenu({ isOpen, type, onClose }: MegaMenuProps) {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && type !== 'morgane') {
      loadCategories();
    } else {
      setLoading(false);
    }
  }, [isOpen, type]);

  async function loadCategories() {
    try {
      const parentSlugs: Record<string, string> = {
        mode: 'mode',
        maison: 'maison',
        beaute: 'beaute-et-senteurs'
      };

      const { data: parentCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', parentSlugs[type])
        .maybeSingle();

      if (parentCategory) {
        const parent = parentCategory as { id: string };

        const { data: level1Categories } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', parent.id)
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

  if (type === 'morgane') {
    return (
      <div
        className="absolute left-0 right-0 top-full bg-[#F2F2E8] border-t border-gray-200 shadow-xl z-50"
        onMouseLeave={onClose}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-8">
            {morganeCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="block p-4 rounded-lg hover:bg-white/50 transition-colors"
                onClick={onClose}
              >
                <h3 className="font-semibold text-gray-900 hover:text-[#D4AF37] transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute left-0 right-0 top-full bg-[#F2F2E8] border-t border-gray-200 shadow-xl z-50"
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : categories.length > 0 ? (
          <div className={`grid gap-8 ${
            type === 'mode' ? 'grid-cols-2 md:grid-cols-5' :
            type === 'maison' ? 'grid-cols-2 md:grid-cols-4' :
            'grid-cols-2 md:grid-cols-4'
          }`}>
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
