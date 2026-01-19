'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote, User } from 'lucide-react';
import { Heart } from 'lucide-react'; // Assurez-vous d'importer Heart
import { SectionTitle } from '@/components/ui/SectionTitle'; // Import du composant
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

export function HomeReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        let query = supabase
          .from('customer_reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            is_featured,
            user_profiles (
              first_name,
              last_name
            )
          `)
          .eq('is_approved', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        const { data, error } = await query;

        if (error) throw error;
        setReviews(data as any[] || []);
      } catch (err) {
        console.error('Erreur chargement avis:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  if (loading) return null;
  if (reviews.length === 0) return null;

  const formatName = (profile: any) => {
    if (!profile) return 'Client';
    const first = profile.first_name || '';
    const last = profile.last_name ? `${profile.last_name.charAt(0)}.` : '';
    return `${first} ${last}`.trim() || 'Client fidèle';
  };

return (
    <section className="py-16 bg-[#F2F2E8]/30 overflow-hidden">
      <div className="container mx-auto px-4">
        
        {/* NOUVEAU TITRE HARMONISÉ */}
        <SectionTitle 
          title="Elles ont adoré Morgane" 
          subtitle="Vos mots doux sont notre plus belle récompense"
          icon={Heart}
        />

        <div className="w-full relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {reviews.map((review) => (
                <CarouselItem key={review.id} className="pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <div className="p-1 h-full">
                    <Card className="h-full border-none shadow-md bg-white hover:shadow-lg transition-all duration-300">
                      <CardContent className="flex flex-col p-6 h-full">
                        <div className="mb-4">
                          <Quote className="w-8 h-8 text-[#D4AF37]/20 rotate-180" />
                        </div>
                        
                        <p className="text-gray-600 text-sm italic mb-6 flex-grow line-clamp-4">
                          "{review.comment}"
                        </p>

                        <div className="flex items-center gap-3 mt-auto border-t border-gray-100 pt-4">
                          <div className="w-10 h-10 rounded-full bg-[#F2F2E8] flex items-center justify-center text-[#D4AF37]">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              {formatName(review.user_profiles)}
                            </p>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating
                                      ? "fill-[#D4AF37] text-[#D4AF37]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white z-10" />
            <CarouselNext className="hidden md:flex -right-4 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white z-10" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}