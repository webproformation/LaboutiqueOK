'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
  button_url: string | null;
  order_position: number;
  is_active: boolean;
}

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      const cacheKey = 'home_slides_active';
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp < 300000) {
          setSlides(cachedData.data);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('home_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (!error && data && data.length > 0) {
        setSlides(data);
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
      setLoading(false);
    };

    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <div className="relative w-full h-[500px] overflow-hidden bg-gray-200 animate-pulse">
        <div className="absolute inset-0 flex items-end">
          <div className="p-12 w-full">
            <div className="h-12 bg-gray-300 rounded w-96 mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image_url}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl text-white ml-[10%]">
                <h2
                  key={`title-${slide.id}-${currentSlide}`}
                  className={`text-2xl md:text-4xl font-bold mb-3 drop-shadow-lg ${
                    index === currentSlide ? 'animate-fade-in' : 'opacity-0'
                  }`}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p
                    key={`desc-${slide.id}-${currentSlide}`}
                    className={`text-sm md:text-base drop-shadow-lg mb-4 ${
                      index === currentSlide ? 'animate-slide-in-right' : 'opacity-0'
                    }`}
                  >
                    {slide.subtitle}
                  </p>
                )}
                {slide.button_text && slide.button_url && (
                  <a
                    key={`button-${slide.id}-${currentSlide}`}
                    href={slide.button_url}
                    className={`inline-block px-6 py-3 bg-[#D4AF37] text-white font-semibold rounded-md hover:bg-[#b8933d] transition-all duration-300 drop-shadow-lg ${
                      index === currentSlide ? 'animate-fade-in' : 'opacity-0'
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
      ))}

      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-12 w-12"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-12 w-12"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
    </div>
  );
}
