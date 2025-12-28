'use client';

import Link from 'next/link';
import { Post } from '@/types';
import { Calendar } from 'lucide-react';

interface NewsCardProps {
  post: Post;
}

export default function NewsCard({ post }: NewsCardProps) {
  const imageUrl = post.featuredImage?.node.sourceUrl || 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
  };

  return (
    <Link
      href={`/actualites/${post.slug}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `url(${imageUrl})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {post.categories.nodes.length > 0 && (
          <div className="absolute top-3 left-3">
            <span className="inline-block px-3 py-1 bg-[#b8933d] text-white text-xs font-semibold rounded-full">
              {post.categories.nodes[0].name}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(post.date)}</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#b8933d] transition-colors">
          {post.title}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-3">
          {stripHtml(post.excerpt)}
        </p>

        <div className="mt-4 inline-flex items-center text-sm font-medium text-[#b8933d] group-hover:text-[#a07c2f] transition-colors">
          Lire la suite
          <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
