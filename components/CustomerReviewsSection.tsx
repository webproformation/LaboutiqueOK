'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  photo_url: string | null;
  created_at: string;
}

export function CustomerReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        const { data, error } = await supabase
          .from('customer_reviews')
          .select('*')
          .eq('status', 'approved')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (isMounted) {
          setReviews(data || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading reviews:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  function nextReview() {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  }

  function prevReview() {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  }

  if (loading || reviews.length === 0) return null;

  const currentReview = reviews[currentIndex];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ color: '#C6A15B' }}>
            Elles ont adoré Morgane
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez ce que nos clientes pensent de leurs achats
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {currentReview.photo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={currentReview.photo_url}
                    alt={`Photo de ${currentReview.customer_name}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#D4AF37]"
                  />
                </div>
              )}

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < currentReview.rating
                          ? 'fill-[#D4AF37] text-[#D4AF37]'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <blockquote className="text-lg text-gray-700 mb-4 italic">
                  "{currentReview.comment}"
                </blockquote>

                <div>
                  <p className="font-semibold text-gray-900">
                    {currentReview.customer_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(currentReview.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {reviews.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevReview}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex gap-2">
                  {reviews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'bg-[#D4AF37] w-8'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextReview}
                  className="rounded-full"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
