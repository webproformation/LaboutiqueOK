"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, Search, Trash2, RefreshCw } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

interface MediaItem {
  id: number;
  source_url: string;
  title?: { rendered: string } | string;
  alt_text?: string;
}

interface WordPressMediaSelectorProps {
  onSelect: (imageUrl: string, imageId: number) => void;
  selectedImage?: string;
}

export default function WordPressMediaSelector({ onSelect, selectedImage }: WordPressMediaSelectorProps) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async (pageNum: number, searchTerm: string = '') => {
    setLoading(true);
    try {
      let url = `/api/wordpress/media?per_page=20&page=${pageNum}`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('Erreur de chargement');

      const data = await response.json();

      if (pageNum === 1) {
        setMedia(data);
      } else {
        setMedia(prev => [...prev, ...data]);
      }

      setHasMore(data.length === 20);
    } catch (error) {
      toast.error('Erreur lors du chargement des images');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      loadMedia(1, search);
    }
  }, [open, search]);

  const handleRefresh = () => {
    setPage(1);
    loadMedia(1, search);
    toast.success('Médiathèque actualisée');
  };

  const handleSelect = (item: MediaItem) => {
    onSelect(item.source_url, item.id);
    setOpen(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMedia(nextPage, search);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/wordpress/upload-media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const uploadedMedia = await response.json();

      setPage(1);
      await loadMedia(1, search);

      toast.success('Image uploadée avec succès et médiathèque rafraîchie');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: number) => {
    setDeleting(mediaId);
    setDeleteConfirm(null);
    try {
      const response = await fetch('/api/wordpress/delete-media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      setMedia(prev => prev.filter(item => item.id !== mediaId));
      toast.success('Image supprimée avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'image');
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          {selectedImage ? (
            <div className="relative group">
              <img
                src={selectedImage}
                alt="Image sélectionnée"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Changer l'image
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect('', 0);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full h-48 border-dashed">
              <Upload className="w-6 h-6 mr-2" />
              Choisir une image
            </Button>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Médiathèque WordPress</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher une image..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                title="Actualiser la médiathèque"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && page === 1 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucune image trouvée
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all group cursor-pointer w-full"
                      disabled={deleting === item.id}
                    >
                      <img
                        src={item.source_url}
                        alt={item.alt_text || (typeof item.title === 'string' ? item.title : item.title?.rendered || 'Image')}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          Sélectionner
                        </span>
                      </div>
                      {deleting === item.id && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(item.id);
                      }}
                      disabled={deleting === item.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      'Charger plus'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible et supprimera définitivement l'image de WordPress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
