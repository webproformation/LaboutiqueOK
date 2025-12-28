"use client";

import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_CATEGORIES } from '@/lib/queries';
import { GetProductCategoriesResponse } from '@/types';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface MegaMenuProps {
  activeMenuItem: string;
}

export default function MegaMenu({ activeMenuItem }: MegaMenuProps) {
  const { loading, data: productData } = useQuery<GetProductCategoriesResponse>(
    GET_PRODUCT_CATEGORIES
  );

  const categories = productData?.productCategories?.nodes || [];

  const getCategoryByName = (name: string) => {
    return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  };

  const getSubCategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  const getSubSubCategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  let parentCategory = null;
  let categorySlug = '';

  switch (activeMenuItem) {
    case 'Mode':
      parentCategory = getCategoryByName('Mode');
      categorySlug = 'mode';
      break;
    case 'Maison':
      parentCategory = getCategoryByName('Maison');
      categorySlug = 'maison';
      break;
    case 'Beauté et Senteurs':
      parentCategory = getCategoryByName('Beauté & Senteurs');
      categorySlug = 'beaute-senteurs';
      break;
    case 'Les looks de Morgane':
      parentCategory = categories.find(cat =>
        cat.slug === 'les-looks-de-morgane' ||
        cat.name.toLowerCase().includes('looks') && cat.name.toLowerCase().includes('morgane')
      );
      categorySlug = 'les-looks-de-morgane';
      break;
    default:
      return null;
  }

  if (loading || !parentCategory) {
    return (
      <div className="absolute left-0 right-0 top-full mt-0 bg-[#F2F2E8] border-t border-gray-200 shadow-xl z-50">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <p className="text-xl font-bold text-[#D4AF37]">{activeMenuItem}</p>
          </div>
          <div className="animate-pulse">
            <div className="grid grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const level1Categories = getSubCategories(parentCategory.id);

  if (activeMenuItem === 'Les looks de Morgane') {
    const morganeCategories = [
      { name: "Les coups de cœur de Morgane", slug: "les-coups-de-coeur-de-morgane" },
      { name: "L'ambiance de la semaine", slug: "l-ambiance-de-la-semaine" },
      { name: "Le look de la semaine by Morgane", slug: "le-look-de-la-semaine-by-morgane" }
    ];

    return (
      <div className="absolute left-0 right-0 top-full mt-0 bg-[#F2F2E8] border-t border-gray-200 shadow-xl z-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 text-center">
            <p className="text-lg font-bold text-[#b8933d]">{activeMenuItem}</p>
          </div>

          <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${morganeCategories.length}, 1fr)` }}>
            {morganeCategories.map((cat, index) => (
              <div
                key={cat.slug}
                className={`px-6 ${index !== morganeCategories.length - 1 ? 'border-r border-gray-200' : ''}`}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className="block group mb-3"
                >
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#D4AF37] transition-colors uppercase">
                    {cat.name}
                  </h4>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href={`/category/${categorySlug}`}
              className="inline-flex items-center text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
            >
              Voir tout {activeMenuItem}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (level1Categories.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-0 bg-[#F2F2E8] border-t border-gray-200 shadow-xl z-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 text-center">
            <p className="text-lg font-bold text-[#b8933d]">{activeMenuItem}</p>
          </div>
          <div className="text-center py-6">
            <Link
              href={`/category/${categorySlug}`}
              className="inline-flex items-center text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
            >
              Voir tout {activeMenuItem}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full mt-0 bg-[#F2F2E8] border-t border-gray-200 shadow-xl z-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <p className="text-lg font-bold text-[#b8933d]">{activeMenuItem}</p>
        </div>

        <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${Math.min(level1Categories.length, 5)}, 1fr)` }}>
          {level1Categories.map((level1Cat, index) => {
            const level2Categories = getSubSubCategories(level1Cat.id);

            return (
              <div
                key={level1Cat.id}
                className={`px-6 ${index !== level1Categories.length - 1 ? 'border-r border-gray-200' : ''}`}
              >
                <Link
                  href={`/category/${level1Cat.slug}`}
                  className="block group mb-3"
                >
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#D4AF37] transition-colors uppercase">
                    {level1Cat.name}
                  </h4>
                </Link>

                {level2Categories.length > 0 && (
                  <ul className="space-y-1">
                    {level2Categories.slice(0, 10).map((level2Cat) => (
                      <li key={level2Cat.id}>
                        <Link
                          href={`/category/${level2Cat.slug}`}
                          className="text-xs text-gray-700 hover:text-[#D4AF37] transition-colors block"
                        >
                          {level2Cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/category/${categorySlug}`}
            className="inline-flex items-center text-sm font-medium text-[#D4AF37] hover:text-[#b8933d] transition-colors"
          >
            Voir tout {activeMenuItem}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
