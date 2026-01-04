'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ProductCategory } from '@/types';

interface CategoryCardProps {
  category: ProductCategory;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const imageUrl = category.image?.sourceUrl || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <Link
      href={`/category/${category.slug}`}
      className="relative group block h-[500px] lg:h-[600px] overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
    >
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={imageUrl}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          quality={80}
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300 z-10" />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center p-8 text-center z-20">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          {category.name}
        </h2>

        {category.description && (
          <p className="text-lg text-white/90 max-w-md mb-6 drop-shadow-md">
            {category.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-white/80 text-sm">
          <span>{category.count} produit{category.count > 1 ? 's' : ''}</span>
        </div>

        <div className="mt-6 px-8 py-3 bg-white text-gray-900 font-semibold rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          Découvrir
        </div>
      </div>
    </Link>
  );
}
