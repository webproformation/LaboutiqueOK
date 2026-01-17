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
  // MODIFICATION CRITIQUE : On attend l'objet {id, src}, pas juste une string
  onImageClick?: (image: { id: string; src: string }) => void;
}

export function ProductGallery({ images, productName, selectedImageUrl, onImageClick }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const cleanImages = images.filter((img) => img.src && img.src.length > 0);
  const validImages = cleanImages.length > 0 ? cleanImages : [{ id: "placeholder", src: "/placeholder.png", alt: productName }];

  const handleImageClick = (image: ProductImage) => {
    if (onImageClick) {
      // ON ENVOIE L'ID ET LA SRC (C'est ça que Bolt avait effacé)
      onImageClick({ id: image.id, src: image.src });
    }
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === 0 ? validImages.length - 1 : prevIndex - 1;
      handleImageClick(validImages[newIndex]);
      return newIndex;
    });
  }, [validImages, handleImageClick]); // Ajout dépendance

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === validImages.length - 1 ? 0 : prevIndex + 1;
      handleImageClick(validImages[newIndex]);
      return newIndex;
    });
  }, [validImages, handleImageClick]); // Ajout dépendance

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) goToNext();
    if (touchStart - touchEnd < -50) goToPrevious();
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
                handleImageClick(image);
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