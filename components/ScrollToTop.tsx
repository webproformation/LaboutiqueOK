"use client";

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="hidden md:flex fixed bottom-4 right-20 z-40 h-12 w-12 rounded-full shadow-lg text-white transition-all duration-300"
          style={{ backgroundColor: '#C6A15B' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b8933d'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C6A15B'}
          aria-label="Retour en haut"
        >
          <ArrowUp className="w-6 h-6" />
        </Button>
      )}
    </>
  );
}
