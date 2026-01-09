'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MediaLibrary from '@/components/MediaLibrary';
import { Plus, X } from 'lucide-react';

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

  const handleAddImage = (url: string) => {
    onChange([...images, { url, id: Date.now() }]);
    setOpen(false);
  };

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={`Galerie ${index + 1}`}
                className="w-full h-32 object-cover rounded border"
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
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="w-full border-dashed gap-2">
            <Plus className="w-4 h-4" />
            Ajouter une image à la galerie
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-0 shrink-0">
            <DialogTitle>Choisir une image pour la galerie</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4 overflow-y-auto flex-1">
            <MediaLibrary
              bucket="media"
              onSelect={(url) => handleAddImage(url)}
              onClose={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
