"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { X, Plus } from 'lucide-react';
import MediaGrid from './MediaGrid';

export interface GalleryImage {
  url: string;
  id: number;
}

interface ProductGalleryManagerProps {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}

export default function ProductGalleryManager({ images, onChange }: ProductGalleryManagerProps) {
  const [open, setOpen] = useState(false);

  const handleAddImage = (url: string, id: number) => {
    onChange([...images, { url, id }]);
    setOpen(false);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={`Galerie ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une image à la galerie
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Choisir une image pour la galerie</DialogTitle>
            <DialogDescription>
              Sélectionnez une image de la médiathèque WordPress ou uploadez-en une nouvelle
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            <MediaGrid onSelect={handleAddImage} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
