"use client";

import { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
  images: Array<{ id: string; src: string; alt: string }>;
  productName: string;
  selectedImageUrl?: string;
  onImageClick?: (image: { id: string; src: string }) => void;
}

export function ProductGallery({
  images,
  productName,
  selectedImageUrl,
  onImageClick,
}: ProductGalleryProps) {
  // Configuration du carrousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Synchronisation lors du swipe
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    // Notifier le parent si besoin
    if (onImageClick && images[index]) {
      onImageClick(images[index]);
    }
  }, [emblaApi, images, onImageClick]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    // Initialiser l'état
    onSelect();
  }, [emblaApi, onSelect]);

  // Synchronisation depuis les props (ex: changement de couleur depuis le parent)
  useEffect(() => {
    if (selectedImageUrl && emblaApi) {
      const index = images.findIndex((img) => img.src === selectedImageUrl);
      if (index >= 0) {
        emblaApi.scrollTo(index);
      }
    }
  }, [selectedImageUrl, images, emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400">Aucune image disponible</p>
      </div>
    );
  }

  // Image actuellement visible pour le Zoom
  const currentImage = images[selectedIndex] || images[0];
  const isCurrentVideo =
    currentImage.src.toLowerCase().endsWith(".mp4") ||
    currentImage.src.toLowerCase().endsWith(".webm");

  return (
    <div className="space-y-4">
      {/* --- CARROUSEL PRINCIPAL --- */}
      <div className="relative group rounded-2xl overflow-hidden bg-gray-50">
        {/* Viewport Embla */}
        <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {images.map((image, index) => {
              const isVideo =
                image.src.toLowerCase().endsWith(".mp4") ||
                image.src.toLowerCase().endsWith(".webm");

              return (
                <div className="flex-[0_0_100%] min-w-0 relative aspect-[3/4]" key={image.id}>
                  <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
                    <DialogTrigger asChild>
                      <div className="w-full h-full relative">
                        {isVideo ? (
                          <div className="w-full h-full bg-black flex items-center justify-center">
                            <video
                              src={image.src}
                              className="w-full h-full object-contain pointer-events-none" // pointer-events-none pour permettre le drag du carrousel
                              muted
                              playsInline
                              autoPlay
                              loop
                            />
                            {/* Overlay transparent pour capter le clic zoom sur la vidéo */}
                            <div className="absolute inset-0 bg-transparent" />
                          </div>
                        ) : (
                          <NextImage
                            src={image.src}
                            alt={image.alt || productName}
                            fill
                            className="object-cover"
                            priority={index === 0}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        )}
                        
                        {/* Loupe icône */}
                        {!isVideo && (
                          <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-full shadow-sm opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none">
                            <Search className="w-5 h-5 text-gray-700" />
                          </div>
                        )}
                      </div>
                    </DialogTrigger>
                    
                    {/* Contenu du Zoom (Modal) */}
                    <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center relative focus:outline-none">
                      <div className="relative w-full h-full flex items-center justify-center p-4 focus:outline-none">
                        {isCurrentVideo ? (
                          <video
                            src={currentImage.src}
                            className="max-w-full max-h-full object-contain"
                            controls
                            autoPlay
                            loop
                            playsInline
                          />
                        ) : (
                          <NextImage
                            src={currentImage.src}
                            alt={currentImage.alt || productName}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                          />
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsZoomOpen(false);
                        }}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-50 outline-none focus:outline-none"
                        aria-label="Fermer le zoom"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flèches de navigation (Desktop) */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                scrollPrev();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                scrollNext();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* --- MINIATURES --- */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {images.map((image, index) => {
            const isThumbVideo =
              image.src.toLowerCase().endsWith(".mp4") ||
              image.src.toLowerCase().endsWith(".webm");
            const isSelected = index === selectedIndex;

            return (
              <button
                key={image.id}
                onClick={() => scrollTo(index)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden transition-all outline-none focus:outline-none",
                  isSelected
                    ? "opacity-100 scale-95 ring-2 ring-[#D4AF37] ring-offset-1"
                    : "opacity-60 hover:opacity-100 hover:scale-100"
                )}
              >
                {isThumbVideo ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                    <video
                      src={image.src}
                      className="w-full h-full object-cover pointer-events-none"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayCircle className="w-8 h-8 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <NextImage
                    src={image.src}
                    alt={image.alt || productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 10vw"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}