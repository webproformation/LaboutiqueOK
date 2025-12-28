"use client";

import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useEffect, useState } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  button_text: string;
  button_url: string;
  order_position: number;
  is_active: boolean;
}

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setMounted(true);
    setLoading(true);

    const fetchSlides = async () => {
      const cacheKey = 'home_slides_active';
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          if (cachedData.timestamp && Date.now() - cachedData.timestamp < 300000) {
            setSlides(cachedData.data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Cache error:', e);
        }
      }

      const { data, error } = await supabase
        .from('home_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (!error && data) {
        setSlides(data);
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      }
      setLoading(false);
    };

    fetchSlides();

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (loading) {
    return (
      <div className="w-full h-[400px] md:h-[600px] bg-gray-100 animate-pulse">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-in-out forwards;
        }

        .animate-slide-in-right {
          animation: slideInRight 1s ease-out forwards;
        }
      `}</style>
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden bg-gray-200">
                {slide.image_url && (
                  <Image
                    src={slide.image_url}
                    alt={slide.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={index === 0}
                    quality={85}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30">
                  <div className="container mx-auto px-4 h-full flex items-center">
                    <div className="max-w-2xl text-white ml-[10%]">
                      <h2
                        key={`title-${slide.id}-${current}`}
                        className={`text-2xl md:text-4xl font-bold mb-3 drop-shadow-lg ${
                          index === current ? 'animate-fade-in' : 'opacity-0'
                        }`}
                      >
                        {slide.title}
                      </h2>
                      {slide.subtitle && (
                        <p
                          key={`desc-${slide.id}-${current}`}
                          className={`text-sm md:text-base drop-shadow-lg mb-4 ${
                            index === current ? 'animate-slide-in-right' : 'opacity-0'
                          }`}
                        >
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.button_text && (
                        <a
                          key={`button-${slide.id}-${current}`}
                          href={slide.button_url || '#'}
                          className={`inline-block px-6 py-3 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8933d] transition-all duration-300 drop-shadow-lg ${
                            index === current ? 'animate-fade-in' : 'opacity-0'
                          }`}
                          style={{ animationDelay: '0.3s' }}
                        >
                          {slide.button_text}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>
    </div>
  );
}
