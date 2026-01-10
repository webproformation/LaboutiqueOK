'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Heart, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  images: string[];
  created_at: string;
}

export function HomeReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const { data, error } = await supabase
        .from('livre_dor')
        .select('*')
        .eq('status', 'approved')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formatted = (data || []).map(review => ({
        id: review.id,
        user_name: review.author_name || 'Cliente',
        rating: review.rating || 5,
        comment: review.message || '',
        images: review.photos || [],
        created_at: review.created_at,
      }));

      setReviews(formatted);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-40 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Elles ont adoré Morgane
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Découvrez les témoignages de nos clientes
            </p>
          </div>

          <Card className="max-w-2xl mx-auto p-12 text-center border-2 border-dashed border-gray-300">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Les premiers avis arrivent bientôt !
            </h3>
            <p className="text-gray-500">
              Nos clientes adorent partager leurs coups de cœur. Revenez vite pour découvrir leurs témoignages.
            </p>
          </Card>

          <div className="text-center mt-8">
            <Link
              href="/livre-dor"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#D4AF37] text-white font-semibold rounded-full hover:bg-[#C5A028] transition-colors"
            >
              Découvrir le Livre d'Or
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Elles ont adoré Morgane
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Découvrez les témoignages de nos clientes ravies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-[#D4AF37]/30 flex flex-col"
            >
              {review.images.length > 0 && (
                <div className="mb-4 rounded-lg overflow-hidden h-48 relative">
                  <img
                    src={review.images[0]}
                    alt={review.user_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'text-[#D4AF37] fill-[#D4AF37]'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-4 flex-grow">
                {review.comment}
              </p>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <span className="text-[#D4AF37] font-semibold text-sm">
                    {review.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {review.user_name}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/livre-dor"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#D4AF37] text-white font-semibold rounded-full hover:bg-[#C5A028] transition-colors"
          >
            Voir tous les avis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
