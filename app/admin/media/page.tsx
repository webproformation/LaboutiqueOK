'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/image-uploader';
import {
  RefreshCw,
  Database,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageData {
  url: string;
  size?: number;
  name?: string;
}

export default function MediaAdminPage() {
  const [loading, setLoading] = useState(true);
  const [productImages, setProductImages] = useState<ImageData[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProductImages();
  }, []);

  const loadProductImages = async () => {
    setLoading(true);
    try {
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('product-images')
        .list('products', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (storageError) {
        console.error('[MEDIA] Storage error:', storageError);
      }

      const storageImagesData: ImageData[] = (storageFiles || [])
        .filter(file => file.name && file.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(`products/${file.name}`);
          return {
            url: data.publicUrl,
            size: file.metadata?.size || 0,
            name: file.name,
          };
        });

      const productsResult = await supabase
        .from('products')
        .select('image_url, gallery_images');

      if (productsResult.error) {
        console.error('[MEDIA] Products error:', productsResult.error);
      }

      const productImageUrls: ImageData[] = [];
      productsResult.data?.forEach(p => {
        if (p.image_url) {
          productImageUrls.push({ url: p.image_url });
        }
        if (p.gallery_images && Array.isArray(p.gallery_images)) {
          p.gallery_images.forEach((img: string) => {
            if (img) productImageUrls.push({ url: img });
          });
        }
      });

      const allImages = [...storageImagesData, ...productImageUrls];
      const uniqueImages = Array.from(
        new Map(allImages.map(img => [img.url, img])).values()
      );

      const calculatedSize = uniqueImages.reduce((acc, img) => acc + (img.size || 0), 0);

      setProductImages(uniqueImages);
      setTotalSize(calculatedSize);

      if (uniqueImages.length === 0) {
        console.warn('[MEDIA] No images loaded! Check console for errors.');
      }
    } catch (error) {
      console.error('[MEDIA] Error loading product images:', error);
      toast.error('Erreur lors du chargement des images');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiée dans le presse-papier');
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const urlPath = new URL(imageUrl).pathname;
      const fileName = urlPath.split('/').pop();

      if (!fileName) {
        toast.error('Impossible d\'identifier le fichier');
        return;
      }

      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([`products/${fileName}`]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      const { error: productsError } = await supabase
        .from('products')
        .update({ image_url: null })
        .eq('image_url', imageUrl);

      if (productsError) {
        console.error('Products update error:', productsError);
      }

      const { data: productsWithGallery } = await supabase
        .from('products')
        .select('id, gallery_images')
        .not('gallery_images', 'is', null);

      if (productsWithGallery) {
        for (const product of productsWithGallery) {
          if (Array.isArray(product.gallery_images) && product.gallery_images.includes(imageUrl)) {
            const newGallery = product.gallery_images.filter((img: string) => img !== imageUrl);
            await supabase
              .from('products')
              .update({ gallery_images: newGallery })
              .eq('id', product.id);
          }
        }
      }

      toast.success('Image supprimée avec succès');
      loadProductImages();
      setImageToDelete(null);
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRefresh = () => {
    loadProductImages();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#b8933d] to-[#d4af37] bg-clip-text text-transparent">
            Médiathèque
          </h1>
          <p className="text-gray-600 text-lg mt-2">Gérez vos images et médias</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2 border-[#d4af37] hover:bg-[#d4af37] hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#d4af37]/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#d4af37]">
                Images Totales
              </CardTitle>
              <ImageIcon className="h-4 w-4 text-[#d4af37]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{productImages.length}</div>
              <p className="text-xs text-gray-600 mt-1">images dans la bibliothèque</p>
            </CardContent>
          </Card>

          <Card className="border-[#d4af37]/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#d4af37]">
                Stockage Utilisé
              </CardTitle>
              <HardDrive className="h-4 w-4 text-[#d4af37]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{formatSize(totalSize)}</div>
              <p className="text-xs text-gray-600 mt-1">espace total occupé</p>
            </CardContent>
          </Card>

          <Card className="border-[#d4af37]/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#d4af37]">
                Base de Données
              </CardTitle>
              <Database className="h-4 w-4 text-[#d4af37]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {productImages.filter(img => img.size && img.size > 0).length}
              </div>
              <p className="text-xs text-gray-600 mt-1">images avec métadonnées</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-[#d4af37] text-2xl">Bibliothèque de médias</CardTitle>
          <CardDescription className="text-base">
            Parcourez, gérez et supprimez vos images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-[#d4af37]/30 rounded-lg p-6 bg-[#d4af37]/5">
              <ImageUploader
                onUploadSuccess={(url) => {
                  toast.success('Image ajoutée à la médiathèque');
                  loadProductImages();
                }}
              />
            </div>

            {productImages.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune image trouvée
                </h3>
                <p>Commencez par ajouter des images à votre médiathèque</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-sm text-gray-600 font-medium">
                  {productImages.length} image{productImages.length > 1 ? 's' : ''} disponible{productImages.length > 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {productImages.map((imageData, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#d4af37] transition-all group"
                    >
                      <img
                        src={imageData.url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopyUrl(imageData.url)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setImageToDelete(imageData.url)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                      {imageData.size && imageData.size > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center">
                          {formatSize(imageData.size)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible et
              l'image sera retirée de tous les produits qui l'utilisent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => imageToDelete && handleDeleteImage(imageToDelete)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
