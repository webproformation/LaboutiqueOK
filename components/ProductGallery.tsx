"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, PlayCircle } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    if (selectedImageUrl) {
      const imageToSelect = images.find((img) => img.src === selectedImageUrl);
      if (imageToSelect) {
        setSelectedImage(imageToSelect);
      }
    } else if (images.length > 0 && !selectedImage) {
        setSelectedImage(images[0]);
    }
  }, [selectedImageUrl, images, selectedImage]);

  useEffect(() => {
     if (images.length > 0 && !images.find(img => img.id === selectedImage?.id)) {
         setSelectedImage(images[0]);
     }
  }, [images]);


  const handleThumbnailClick = (image: typeof selectedImage) => {
    setSelectedImage(image);
    if (onImageClick) {
      onImageClick(image);
    }
  };

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400">Aucune image disponible</p>
      </div>
    );
  }

  const isVideo = selectedImage.src.toLowerCase().endsWith(".mp4") || selectedImage.src.toLowerCase().endsWith(".webm");

  return (
    <div className="space-y-4">
      {/* Main image - Suppression du bg-white, border et shadow pour enlever le cadre */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogTrigger asChild>
            <div className="w-full h-full cursor-zoom-in">
              {isVideo ? (
                 <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={selectedImage.src}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                 </div>
              ) : (
              <NextImage
                src={selectedImage.src}
                alt={selectedImage.alt || productName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              )}
              {!isVideo && (
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              )}
               {!isVideo && (
              <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-full shadow-sm opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <Search className="w-5 h-5 text-gray-700" />
              </div>
               )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center relative focus:outline-none">
             <div className="relative w-full h-full flex items-center justify-center p-4 focus:outline-none">
                 {isVideo ? (
                      <video
                        src={selectedImage.src}
                        className="max-w-full max-h-full object-contain"
                        controls
                        autoPlay
                        loop
                        playsInline
                      />
                 ) : (
                 <NextImage
                  src={selectedImage.src}
                  alt={selectedImage.alt || productName}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
                 )}
            </div>
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-50 outline-none focus:outline-none"
              aria-label="Fermer le zoom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Thumbnails - Suppression des bordures, utilisation de l'opacité pour la sélection */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {images.map((image) => {
             const isThumbVideo = image.src.toLowerCase().endsWith(".mp4") || image.src.toLowerCase().endsWith(".webm");
             return (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(image)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden transition-all outline-none focus:outline-none",
                // Si sélectionné : opacité 100%. Sinon : opacité 60% et 100% au survol. Pas de bordure.
                selectedImage.id === image.id
                  ? "opacity-100 scale-95"
                  : "opacity-60 hover:opacity-100 hover:scale-100"
              )}
            >
               {isThumbVideo ? (
                 <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                     <video src={image.src} className="w-full h-full object-cover pointer-events-none" muted playsInline />
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
          )})}
        </div>
      )}
    </div>
  );
}