'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, ProductCategory } from '@/lib/supabase';

interface MegaMenuProps {
  isOpen: boolean;
  type: 'mode' | 'morgane' | 'maison' | 'beaute';
  onClose: () => void;
}

const morganeCategories = [
  { name: "Les coups de cœur de Morgane", slug: "les-coups-de-coeur-de-morgane" },
  { name: "L'ambiance de la semaine", slug: "l-ambiance-de-la-semaine" },
  { name: "Le look de la semaine by Morgane", slug: "le-look-de-la-semaine-by-morgane" }
];

export function MegaMenu({ isOpen, type, onClose }: MegaMenuProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
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
        beaute: 'beaute-senteurs'
      };

      const { data: parentCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', parentSlugs[type])
        .maybeSingle();

      if (parentCategory) {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', parentCategory.id)
          .order('display_order', { ascending: true });

        setCategories(data || []);
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="block p-4 rounded-lg hover:bg-white/50 transition-colors"
                onClick={onClose}
              >
                <h3 className="font-semibold text-gray-900 hover:text-[#D4AF37] transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </Link>
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
