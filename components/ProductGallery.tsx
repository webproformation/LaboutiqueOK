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
  onImageClick?: (imageUrl: string) => void;
}

export function ProductGallery({ images, productName, selectedImageUrl, onImageClick }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Filtre plus permissif - accepter toutes les images avec une URL valide
  // Temporairement, on autorise même les images WordPress pour éviter de vider la galerie
  const cleanImages = images.filter((img) => {
    const isValid = img.src && img.src.length > 0;

    // Log des images rejetées pour debug
    if (!isValid) {
      console.warn('❌ Image rejetée (URL invalide):', img);
    }

    return isValid;
  });

  console.log('🖼️ ProductGallery - Images reçues:', images.length, '| Images valides:', cleanImages.length);

  const validImages = cleanImages.length > 0 ? cleanImages : [{ id: "placeholder", src: "/placeholder.png", alt: productName }];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === 0 ? validImages.length - 1 : prevIndex - 1;
      if (onImageClick && validImages[newIndex]) {
        onImageClick(validImages[newIndex].src);
      }
      return newIndex;
    });
  }, [validImages, onImageClick]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === validImages.length - 1 ? 0 : prevIndex + 1;
      if (onImageClick && validImages[newIndex]) {
        onImageClick(validImages[newIndex].src);
      }
      return newIndex;
    });
  }, [validImages, onImageClick]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      goToNext();
    }
    if (touchStart - touchEnd < -50) {
      goToPrevious();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
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
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={validImages[currentIndex].src}
          alt={validImages[currentIndex].alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
        />

        {validImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full shadow-md"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full shadow-md"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {validImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    if (onImageClick) {
                      onImageClick(image.src);
                    }
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"
                  }`}
                  aria-label={`Aller à l'image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {validImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setCurrentIndex(index);
                if (onImageClick) {
                  onImageClick(image.src);
                }
              }}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg transition-all ${
                index === currentIndex
                  ? "ring-2 ring-[#b8933d] ring-offset-2 opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
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
