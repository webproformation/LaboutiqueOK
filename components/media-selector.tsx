'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, Link as LinkIcon, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface MediaSelectorProps {
  currentImageUrl?: string;
  onSelect: (imageUrl: string) => void;
  label?: string;
}

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  width?: number;
  height?: number;
  file_size?: number;
}

export function MediaSelector({ currentImageUrl, onSelect, label = "Image" }: MediaSelectorProps) {
  const [open, setOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImageUrl || null);

  useEffect(() => {
    if (open) {
      loadMedia();
      loadProductImages();
    }
  }, [open]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaItems(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductImages = async () => {
    try {
      console.log('[MediaSelector] Loading product images...');
      const allUrls: string[] = [];

      const { data: productFiles, error: productStorageError } = await supabase.storage
        .from('media')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (productStorageError) {
        console.error('[MediaSelector] Media storage error:', productStorageError);
      }

      if (productFiles) {
        for (const file of productFiles) {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            const { data } = supabase.storage
              .from('media')
              .getPublicUrl(file.name);

            if (data?.publicUrl) {
              allUrls.push(data.publicUrl);
            }
          }
        }
      }

      console.log('[MediaSelector] Media storage files:', allUrls.length);

      const [productsResult, mediaResult] = await Promise.all([
        supabase
          .from('products')
          .select('image_url, gallery_images'),
        supabase
          .from('media')
          .select('url')
          .order('created_at', { ascending: false })
      ]);

      if (productsResult.error) {
        console.error('[MediaSelector] Products error:', productsResult.error);
      }

      if (mediaResult.error) {
        console.error('[MediaSelector] Media error:', mediaResult.error);
      }

      const productUrls: string[] = [];
      productsResult.data?.forEach(p => {
        if (p.image_url) productUrls.push(p.image_url);
        if (p.gallery_images && Array.isArray(p.gallery_images)) {
          p.gallery_images.forEach((img: string) => {
            if (img) productUrls.push(img);
          });
        }
      });

      const mediaUrls = mediaResult.data?.map(m => m.url).filter(Boolean) || [];

      console.log('[MediaSelector] Product URLs:', productUrls.length);
      console.log('[MediaSelector] Media URLs:', mediaUrls.length);

      allUrls.push(...mediaUrls, ...productUrls);
      const uniqueUrls = Array.from(new Set(allUrls));

      console.log('[MediaSelector] Total unique URLs:', uniqueUrls.length);

      setProductImages(uniqueUrls as string[]);
    } catch (error) {
      console.error('[MediaSelector] Error loading product images:', error);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      setOpen(false);
      toast.success('Image sélectionnée');
    }
  };

  const handleDirectUrlSubmit = () => {
    if (directUrl) {
      onSelect(directUrl);
      setOpen(false);
      setDirectUrl('');
      toast.success('URL ajoutée');
    }
  };

  const filteredProductImages = productImages.filter(url =>
    url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              <ImageIcon className="w-4 h-4 mr-2" />
              Choisir une image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Sélectionner une image</DialogTitle>
              <DialogDescription>
                Choisissez une image depuis la médiathèque ou les images existantes
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="products" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products">Images des produits</TabsTrigger>
                <TabsTrigger value="media">Médiathèque</TabsTrigger>
                <TabsTrigger value="url">URL directe</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {filteredProductImages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucune image trouvée</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                      {filteredProductImages.map((url, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectImage(url)}
                          className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:border-blue-500 ${
                            selectedImage === url ? 'border-blue-600 ring-2 ring-blue-600' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="media" className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                ) : mediaItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucun média dans la médiathèque</p>
                    <p className="text-sm mt-2">Utilisez la page Admin {'>'} Média pour ajouter des fichiers</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {mediaItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectImage(item.url)}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:border-blue-500 ${
                          selectedImage === item.url ? 'border-blue-600 ring-2 ring-blue-600' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                          {item.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="flex-1">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="direct-url">URL de l'image</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="direct-url"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={directUrl}
                        onChange={(e) => setDirectUrl(e.target.value)}
                      />
                      <Button type="button" onClick={handleDirectUrlSubmit}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Utiliser
                      </Button>
                    </div>
                  </div>

                  {directUrl && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                      <img
                        src={directUrl}
                        alt="Preview"
                        className="max-w-full rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={!selectedImage}>
                Confirmer la sélection
              </Button>
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
