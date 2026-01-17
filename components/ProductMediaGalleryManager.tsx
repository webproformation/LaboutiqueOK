'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, Trash2, MoveUp, MoveDown, Plus } from 'lucide-react';
import MediaLibrary from '@/components/MediaLibrary';

interface ProductMediaGalleryManagerProps {
  mainImage: string | null;
  galleryImages: string[];
  onMainImageChange: (url: string) => void;
  onGalleryImagesChange: (urls: string[]) => void;
}

export default function ProductMediaGalleryManager({
  mainImage,
  galleryImages,
  onMainImageChange,
  onGalleryImagesChange,
}: ProductMediaGalleryManagerProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'main' | 'gallery'>('main');

  const handleSelectImage = (url: string) => {
    if (selectingFor === 'main') {
      onMainImageChange(url);
    } else {
      const newGallery = [...galleryImages, url];
      onGalleryImagesChange(newGallery);
    }
    setShowMediaLibrary(false);
  };

  const handleRemoveGalleryImage = (index: number) => {
    const newGallery = galleryImages.filter((_, i) => i !== index);
    onGalleryImagesChange(newGallery);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newGallery = [...galleryImages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newGallery.length) {
      [newGallery[index], newGallery[targetIndex]] = [newGallery[targetIndex], newGallery[index]];
      onGalleryImagesChange(newGallery);
    }
  };

  const openMediaLibrary = (type: 'main' | 'gallery') => {
    setSelectingFor(type);
    setShowMediaLibrary(true);
  };

  return (
    <>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Images du Produit</CardTitle>
          <CardDescription>
            Image principale et galerie du produit. La première image sera affichée en priorité.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Image Principale *</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openMediaLibrary('main')}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Choisir depuis la médiathèque
              </Button>
            </div>

            {mainImage ? (
              <div className="relative group">
                <img
                  src={mainImage}
                  alt="Image principale"
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onMainImageChange('')}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => openMediaLibrary('main')}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#d4af37] hover:bg-gray-50 transition-colors"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Cliquez pour ajouter une image</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Galerie d'images (Optionnel)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openMediaLibrary('gallery')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter des images
              </Button>
            </div>

            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Galerie ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMoveImage(index, 'up')}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                      )}
                      {index < galleryImages.length - 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMoveImage(index, 'down')}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveGalleryImage(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => openMediaLibrary('gallery')}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#d4af37] hover:bg-gray-50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Cliquez pour ajouter des images à la galerie</p>
              </div>
            )}

            {galleryImages.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                💡 Les images sont affichées dans l'ordre. Utilisez les flèches pour réorganiser.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectingFor === 'main' ? 'Sélectionner l\'image principale' : 'Ajouter des images à la galerie'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <MediaLibrary
              bucket="media"
              selectedUrl={selectingFor === 'main' ? mainImage || undefined : undefined}
              onSelect={handleSelectImage}
              onClose={() => setShowMediaLibrary(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
