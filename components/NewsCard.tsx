'use client';

import Link from 'next/link';
import { Calendar, BookOpen } from 'lucide-react';

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface NewsCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featured_image_url: string | null;
    published_at: string;
    news_post_categories?: Array<{
      news_categories: NewsCategory;
    }>;
  };
}

export default function NewsCard({ post }: NewsCardProps) {
  const imageUrl = post.featured_image_url || 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const stripHtml = (html: string | null) => {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };

  const primaryCategory = post.news_post_categories?.[0]?.news_categories;

  return (
    <Link
      href={`/actualites/${post.slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
    >
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {primaryCategory && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-block px-3 py-1.5 text-white text-xs font-bold rounded-full shadow-lg"
              style={{ backgroundColor: primaryCategory.color }}
            >
              {primaryCategory.name}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(post.published_at)}</span>
        </div>

        <h3 className="flex items-center gap-2 text-lg font-bold text-[#D4AF37] mb-2 line-clamp-2 group-hover:text-[#C6A15B] transition-colors min-h-[3.5rem]">
          <BookOpen className="h-5 w-5 flex-shrink-0" />
          <span className="line-clamp-2">{post.title}</span>
        </h3>

        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {stripHtml(post.excerpt)}
        </p>

        <div className="inline-flex items-center text-sm font-semibold text-[#C6A15B] group-hover:text-[#b8933d] transition-colors">
          Lire la suite
          <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
