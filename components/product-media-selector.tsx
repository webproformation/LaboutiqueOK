'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Image as ImageIcon, Search, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface ProductMediaSelectorProps {
  currentImageUrl?: string;
  onSelect: (imageUrl: string) => void;
  label?: string;
}

export function ProductMediaSelector({ currentImageUrl, onSelect, label = "Image" }: ProductMediaSelectorProps) {
  const [open, setOpen] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadProductImages();
    }
  }, [open]);

  const loadProductImages = async () => {
    setLoading(true);
    try {
      const allUrls: string[] = [];

      const { data: productFiles } = await supabase.storage
        .from('product-images')
        .list('products', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (productFiles) {
        for (const file of productFiles) {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            const { data } = supabase.storage
              .from('product-images')
              .getPublicUrl(`products/${file.name}`);

            if (data?.publicUrl) {
              allUrls.push(data.publicUrl);
            }
          }
        }
      }

      const { data: categoryFiles } = await supabase.storage
        .from('category-images')
        .list('categories', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (categoryFiles) {
        for (const file of categoryFiles) {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            const { data } = supabase.storage
              .from('category-images')
              .getPublicUrl(`categories/${file.name}`);

            if (data?.publicUrl) {
              allUrls.push(data.publicUrl);
            }
          }
        }
      }

      const [productsResult, mediaResult] = await Promise.all([
        supabase
          .from('products')
          .select('image_url')
          .not('image_url', 'is', null),
        supabase
          .from('media')
          .select('url')
          .order('created_at', { ascending: false })
      ]);

      const productUrls = productsResult.data?.map(p => p.image_url).filter(Boolean) || [];
      const mediaUrls = mediaResult.data?.map(m => m.url).filter(Boolean) || [];

      allUrls.push(...mediaUrls, ...productUrls);
      const uniqueUrls = Array.from(new Set(allUrls));

      setProductImages(uniqueUrls as string[]);
    } catch (error) {
      console.error('Error loading product images:', error);
      toast.error('Erreur lors du chargement des images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        setSelectedImage(data.publicUrl);
        onSelect(data.publicUrl);
        setOpen(false);
        toast.success('Image uploadée avec succès');
        loadProductImages();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Erreur lors de l'upload : ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const filteredProductImages = productImages.filter(url =>
    url.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Images des produits</DialogTitle>
              <DialogDescription>
                Uploadez une nouvelle image ou sélectionnez-en une existante
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-[#C6A15B] hover:bg-[#b8933d]"
                  size="lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {uploading ? 'Upload en cours...' : 'Uploader une nouvelle image'}
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher dans les images existantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                ) : filteredProductImages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune image trouvée</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
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
            </div>

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
