"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  bucket_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  usage_count: number;
  is_orphan: boolean;
  created_at: string;
}

interface MediaLibraryProps {
  bucket?: 'product-images' | 'category-images';
  selectedUrl?: string;
  onSelect: (url: string) => void;
  onClose?: () => void;
  onUploadSuccess?: () => void;
}

export default function MediaLibrary({
  bucket = 'product-images',
  selectedUrl,
  onSelect,
  onClose,
  onUploadSuccess
}: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(selectedUrl || null);
  const [deleteConfirm, setDeleteConfirm] = useState<MediaFile | null>(null);

  useEffect(() => {
    loadMediaFiles();
  }, [bucket]);

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('bucket_name', bucket)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFiles(data || []);
    } catch (error) {
      console.error('Error loading media files:', error);
      toast.error('Erreur lors du chargement des médias');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('folder', bucket === 'product-images' ? 'products' : 'categories');

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ Upload response:', result);

      if (result.mediaId) {
        console.log('✅ Media registered in library with ID:', result.mediaId);
      }

      toast.success('Image uploadée avec succès');

      // Recharger la liste des fichiers
      await loadMediaFiles();

      setSelectedFile(result.url);
      onSelect(result.url);

      // Notifier le parent pour rafraîchir les stats
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (media: MediaFile) => {
    if (media.usage_count > 0 && !confirm(`Cette image est utilisée ${media.usage_count} fois. Êtes-vous sûr de vouloir la supprimer ?`)) {
      return;
    }

    try {
      // Supprimer du storage
      const { error: storageError } = await supabase.storage
        .from(media.bucket_name)
        .remove([media.file_path]);

      if (storageError) throw storageError;

      // Supprimer de media_library
      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', media.id);

      if (dbError) throw dbError;

      toast.success('Image supprimée avec succès');
      await loadMediaFiles();
      setDeleteConfirm(null);

      // Notifier le parent pour rafraîchir les stats
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const orphanFiles = filteredFiles.filter(f => f.is_orphan);
  const usedFiles = filteredFiles.filter(f => !f.is_orphan);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une image..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="media-upload"
          />
          <Button
            onClick={() => document.getElementById('media-upload')?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Upload...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Uploader</>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Toutes ({filteredFiles.length})
          </TabsTrigger>
          <TabsTrigger value="used">
            Utilisées ({usedFiles.length})
          </TabsTrigger>
          <TabsTrigger value="orphan">
            Non utilisées ({orphanFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <MediaGrid
            files={filteredFiles}
            loading={loading}
            selectedFile={selectedFile}
            onSelect={(url) => {
              setSelectedFile(url);
              onSelect(url);
            }}
            onDelete={setDeleteConfirm}
          />
        </TabsContent>

        <TabsContent value="used" className="mt-4">
          <MediaGrid
            files={usedFiles}
            loading={loading}
            selectedFile={selectedFile}
            onSelect={(url) => {
              setSelectedFile(url);
              onSelect(url);
            }}
            onDelete={setDeleteConfirm}
          />
        </TabsContent>

        <TabsContent value="orphan" className="mt-4">
          <MediaGrid
            files={orphanFiles}
            loading={loading}
            selectedFile={selectedFile}
            onSelect={(url) => {
              setSelectedFile(url);
              onSelect(url);
            }}
            onDelete={setDeleteConfirm}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette image ?
              {deleteConfirm && deleteConfirm.usage_count > 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <AlertCircle className="h-4 w-4 text-amber-600 inline mr-2" />
                  <span className="text-amber-800">
                    Cette image est utilisée {deleteConfirm.usage_count} fois
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MediaGridProps {
  files: MediaFile[];
  loading: boolean;
  selectedFile: string | null;
  onSelect: (url: string) => void;
  onDelete: (media: MediaFile) => void;
}

function MediaGrid({ files, loading, selectedFile, onSelect, onDelete }: MediaGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <FolderOpen className="h-12 w-12 mb-2" />
        <p>Aucune image trouvée</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
        {files.map((file) => (
          <Card
            key={file.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedFile === file.public_url
                ? 'ring-2 ring-pink-500'
                : ''
            }`}
            onClick={() => onSelect(file.public_url)}
          >
            <CardContent className="p-2">
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden mb-2">
                <img
                  src={file.public_url}
                  alt={file.file_name}
                  className="w-full h-full object-cover"
                />
                {selectedFile === file.public_url && (
                  <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-pink-600" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium truncate" title={file.file_name}>
                  {file.file_name}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant={file.is_orphan ? "secondary" : "default"} className="text-xs">
                    {file.is_orphan ? 'Non utilisée' : `Utilisée ${file.usage_count}x`}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(file);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {(file.file_size / 1024).toFixed(1)} KB
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
