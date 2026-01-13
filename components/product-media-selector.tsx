'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import MediaLibrary from './MediaLibrary';

interface ProductMediaSelectorProps {
  currentImageUrl?: string;
  onSelect: (imageUrl: string) => void;
  label?: string;
  bucket?: 'media' | 'category-images';
}

export function ProductMediaSelector({
  currentImageUrl,
  onSelect,
  label = "Image",
  bucket = 'media'
}: ProductMediaSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelectImage = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="flex-1">
              <ImageIcon className="w-4 h-4 mr-2" />
              Choisir une image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="p-6 pb-0 shrink-0">
              <DialogTitle>Médiathèque</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4 overflow-y-auto flex-1">
              <MediaLibrary
                bucket={bucket}
                selectedUrl={currentImageUrl}
                onSelect={handleSelectImage}
                onClose={() => setOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {currentImageUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onSelect('')}
            title="Supprimer l'image"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {currentImageUrl && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Image actuelle :</p>
          <img
            src={currentImageUrl}
            alt="Current"
            className="max-w-xs rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <p className="text-xs text-gray-500 mt-2 break-all">{currentImageUrl}</p>
        </div>
      )}
    </div>
  );
}
