'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageType {
  id: string;
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: ImageType[];
  productName: string;
  selectedImageUrl?: string; // L'URL de l'image sélectionnée (venant de la page parente)
  onImageClick: (image: { id: string; src: string }) => void; // Fonction pour remonter le clic
}

// Notez bien : export function (pas default) pour correspondre à votre import { ProductGallery }
export function ProductGallery({
  images,
  productName,
  selectedImageUrl,
  onImageClick
}: ProductGalleryProps) {
  
  // Si aucune image sélectionnée n'est fournie, on prend la première par défaut
  const activeImageSrc = selectedImageUrl || (images.length > 0 ? images[0].src : '/placeholder.png');
  
  // On retrouve l'objet image complet correspondant à l'URL active (pour avoir le bon Alt)
  const activeImage = images.find(img => img.src === activeImageSrc) || images[0];

  return (
    <div className="flex flex-col gap-4">
      {/* --- IMAGE PRINCIPALE (GRANDE) --- */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 border border-gray-100 shadow-sm group">
        {activeImageSrc ? (
          <Image
            src={activeImageSrc}
            alt={activeImage?.alt || productName}
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Aucune image disponible
          </div>
        )}
      </div>

      {/* --- GRILLE DE MINIATURES --- */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {images.map((image) => {
            const isSelected = image.src === activeImageSrc;
            return (
              <button
                key={image.id}
                onClick={() => onImageClick(image)} // On remonte l'info au parent (page.tsx)
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 cursor-pointer",
                  isSelected 
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20 opacity-100 scale-95" 
                    : "border-transparent hover:border-gray-300 opacity-70 hover:opacity-100"
                )}
                title={image.alt || productName}
              >
                <Image
                  src={image.src}
                  alt={image.alt || productName}
                  fill
                  className="object-cover object-center"
                  sizes="100px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}