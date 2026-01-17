"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  selectedImageUrl?: string;
  onImageClick?: (image: { id: string; src: string }) => void;
}

export function ProductGallery({ images, productName, selectedImageUrl, onImageClick }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Filtrage des images vides
  const cleanImages = images.filter((img) => img.src && img.src.length > 0);
  const validImages = cleanImages.length > 0 ? cleanImages : [{ id: "placeholder", src: "/placeholder.png", alt: productName }];

  // Fonction stable pour gérer le clic
  const handleImageClick = useCallback((image: ProductImage) => {
    if (onImageClick) {
      onImageClick({ id: image.id, src: image.src });
    }
  }, [onImageClick]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === 0 ? validImages.length - 1 : prevIndex - 1;
      handleImageClick(validImages[newIndex]);
      return newIndex;
    });
  }, [validImages, handleImageClick]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === validImages.length - 1 ? 0 : prevIndex + 1;
      handleImageClick(validImages[newIndex]);
      return newIndex;
    });
  }, [validImages, handleImageClick]);

  // Gestion du Swipe tactile
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > 50;

    if (isSwipe) {
      if (distance > 0) goToNext();
      else goToPrevious();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  useEffect(() => {
    if (selectedImageUrl) {
      const imageIndex = validImages.findIndex(img => img.src === selectedImageUrl);
      if (imageIndex !== -1) {
        setCurrentIndex(imageIndex);
      }
    }
  }, [selectedImageUrl, validImages]);

  return (
    <div className="space-y-4">
      {/* --- IMAGE PRINCIPALE --- */}
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-100 group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={validImages[currentIndex].src}
          alt={validImages[currentIndex].alt || productName}
          fill
          className="object-cover transition-transform duration-500 ease-out"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
        />

        {validImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/95 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/95 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Image suivante"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {validImages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                    index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* --- MINIATURES --- */}
      {validImages.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {validImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setCurrentIndex(index);
                handleImageClick(image);
              }}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg transition-all duration-300 ${
                index === currentIndex
                  ? "ring-2 ring-[#b8933d] ring-offset-2 opacity-100 scale-[0.98]"
                  : "opacity-70 hover:opacity-100 hover:scale-[1.02]"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt || `Miniature ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 16vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}