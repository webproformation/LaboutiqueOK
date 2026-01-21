'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// CORRECTION : Gem n'est importé qu'une seule fois ici
import { Sparkles, ChevronLeft, ChevronRight, Gem } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import useEmblaCarousel from 'embla-carousel-react';
import { SectionTitle } from '@/components/ui/SectionTitle';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price?: number;
  image?: {
    sourceUrl: string;
  };
  attributes?: {
    nodes: Array<{
      name: string;
      options: string[];
    }>;
  };
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .eq('status', 'publish')
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-[#F2F2E8]/30">
        <div className="container mx-auto px-4">
          <SectionTitle 
            title="Les pépites du moment" 
            subtitle="Chargement des pépites..." 
            icon={Gem} 
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-[#F2F2E8]/30">
      <div className="container mx-auto px-4">
        
        {/* TITRE HARMONISÉ */}
        <SectionTitle 
          title="Les pépites du moment" 
          subtitle="Ces pièces que vous adorez... et que nous aussi !"
          icon={Gem}
        />

        <div className="relative group">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {products.map((product) => (
                <div key={product.id} className="flex-[0_0_85%] min-w-0 pl-4 sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white border-[#D4AF37] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden md:flex"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white border-[#D4AF37] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden md:flex"
            onClick={scrollNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <div className="mt-12 text-center">
          <Button 
            variant="outline" 
            className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-colors px-8 py-6 text-lg rounded-full"
          >
            Voir toute la collection
          </Button>
        </div>
      </div>
    </section>
  );
}