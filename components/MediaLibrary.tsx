"use client";

import { useState, useEffect, useCallback } from 'react';
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
  filename: string;
  url: string;
  bucket_name: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  created_at?: string;

  // Legacy support (pour compatibilité si anciennes données)
  file_name?: string;
  file_path?: string;
  public_url?: string;
  usage_count?: number;
  is_orphan?: boolean;
}

interface MediaLibraryProps {
  bucket?: 'product-images' | 'category-images';
  selectedUrl?: string;
  onSelect: (url: string) => void;
  onClose?: () => void;
  onUploadSuccess?: () => void;
}

// 🛡️ Fonction pour construire une URL d'image valide
function buildImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';

  // Si l'URL est déjà complète (commence par http/https), la retourner
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    // Nettoyer les doubles slashes sauf après le protocole
    return rawUrl.replace(/([^:]\/)\/+/g, '$1');
  }

  // Sinon, construire l'URL avec l'URL Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  // Enlever les slashes en début/fin pour éviter les doublons
  const cleanBase = supabaseUrl.replace(/\/$/, '');
  const cleanPath = rawUrl.replace(/^\//, '');

  return `${cleanBase}/${cleanPath}`;
}

export default function MediaLibrary({
  bucket = 'product-images',
  selectedUrl,
  onSelect,
  onClose,
  onUploadSuccess
}: MediaLibraryProps) {
  const [mounted, setMounted] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(selectedUrl || null);
  const [deleteConfirm, setDeleteConfirm] = useState<MediaFile | null>(null);

  // 🛡️ PROTECTION HYDRATION: Ne monter le composant que côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadMediaFiles = useCallback(async () => {
    // ⚠️ NE PAS charger si non monté (évite erreurs SSR)
    if (!mounted) return;

    setLoading(true);
    console.log(`🔄 [MediaLibrary] Loading files for bucket: ${bucket}`);

    try {
      // Tenter de charger depuis media_library
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('bucket_name', bucket)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [MediaLibrary] Error loading from media_library:', error);
      }

      // Sécuriser les données avec validation stricte
      let safeFiles = Array.isArray(data)
        ? data.filter(file => {
            if (!file || typeof file !== 'object') return false;
            if (!file.id || !file.url || !file.filename) return false;
            return true;
          })
        : [];

      console.log(`📚 [MediaLibrary] Loaded ${safeFiles.length} files from media_library (${bucket})`);

      // 🔄 FALLBACK : Si media_library est vide, synchroniser depuis Storage
      if (safeFiles.length === 0) {
        console.log(`⚠️ [MediaLibrary] media_library is empty, syncing from Storage API...`);

        try {
          // Appeler l'API de synchronisation
          const syncResponse = await fetch('/api/admin/sync-media-library', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket })
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log(`✅ [MediaLibrary] Sync completed: ${syncResult.totalSynced} files synced`);

            // Recharger depuis media_library après la sync
            const { data: syncedData } = await supabase
              .from('media_library')
              .select('*')
              .eq('bucket_name', bucket)
              .order('created_at', { ascending: false });

            if (syncedData) {
              safeFiles = Array.isArray(syncedData)
                ? syncedData.filter(file => file?.id && file?.url && file?.filename)
                : [];
              console.log(`📚 [MediaLibrary] Loaded ${safeFiles.length} files after sync`);
            }
          } else {
            console.warn('⚠️ [MediaLibrary] Sync API failed, listing from Storage directly...');

            // Fallback ultime : lister depuis Storage directement
            const folder = bucket === 'product-images' ? 'products' : 'categories';
            const { data: storageFiles } = await supabase
              .storage
              .from(bucket)
              .list(folder, {
                limit: 1000,
                sortBy: { column: 'created_at', order: 'desc' }
              });

            if (storageFiles && storageFiles.length > 0) {
              safeFiles = storageFiles
                .filter(file => file?.name && !file.name.endsWith('/'))
                .map((file) => {
                  const { data: urlData } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(`${folder}/${file.name}`);

                  const filePath = `${bucket}/${folder}/${file.name}`;
                  const stableId = `storage-${Buffer.from(filePath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;

                  return {
                    id: stableId,
                    filename: file?.name || 'unknown.jpg',
                    url: urlData?.publicUrl || '',
                    bucket_name: bucket,
                    file_size: file?.metadata?.size || 0,
                    mime_type: file?.metadata?.mimetype || 'image/jpeg',
                    created_at: file?.created_at || new Date().toISOString(),
                    usage_count: 0,
                    is_orphan: false
                  };
                })
                .filter(file => file !== null) as MediaFile[];
            }
          }
        } catch (storageError) {
          console.error('❌ [MediaLibrary] Error syncing from Storage:', storageError);
        }
      }

      console.log(`✅ [MediaLibrary] Final file count: ${safeFiles.length}`);
      setFiles(safeFiles);
    } catch (error) {
      console.error('❌ [MediaLibrary] Critical error loading media files:', error);
      toast.error('Erreur lors du chargement des médias');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [bucket, mounted]); // Dépendances : bucket ET mounted

  // 🛡️ Charger les médias uniquement après le mount côté client
  useEffect(() => {
    if (mounted) {
      loadMediaFiles();
    }
  }, [mounted, loadMediaFiles]); // Dépendances : mounted ET loadMediaFiles

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
    const usageCount = media?.usage_count || 0;
    if (usageCount > 0 && !confirm(`Cette image est utilisée ${usageCount} fois. Êtes-vous sûr de vouloir la supprimer ?`)) {
      return;
    }

    try {
      // 🛡️ Extraire le path depuis l'URL (support nouveau et ancien format)
      const mediaUrl = media?.url || media?.public_url || '';
      const urlParts = mediaUrl.split('/');
      const filePath = urlParts[urlParts.length - 1];

      if (!filePath) {
        throw new Error('Impossible d\'extraire le chemin du fichier');
      }

      // Supprimer du storage
      const { error: storageError } = await supabase.storage
        .from(media?.bucket_name || bucket)
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        throw storageError;
      }

      // Supprimer de media_library seulement si l'entrée existe en base
      // Ne pas essayer de supprimer les entrées temporaires (temp- ou storage-)
      if (media?.id && !media.id.startsWith('temp-') && !media.id.startsWith('storage-')) {
        const { error: dbError } = await supabase
          .from('media_library')
          .delete()
          .eq('id', media.id);

        if (dbError) console.warn('DB delete warning:', dbError);
      }

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

  // 🛡️ BLINDAGE TOTAL : Supporte filename ET file_name (anciennes données)
  const safeFiles = Array.isArray(files)
    ? files.filter(f => {
        if (!f || typeof f !== 'object') return false;
        if (!f.id || !f.url) return false;
        return true;
      })
    : [];

  const filteredFiles = safeFiles.filter(file => {
    try {
      if (!file || !file.id) return false;

      // Support des deux formats (nouveau: filename, ancien: file_name)
      const name = (file?.filename || file?.file_name || 'Sans nom').toLowerCase();
      const search = (searchTerm || '').toLowerCase();

      return name.includes(search);
    } catch (error) {
      console.error('❌ [MediaLibrary] Error filtering file:', error);
      return false;
    }
  });

  const orphanFiles = filteredFiles.filter(f => {
    try {
      return f && f?.is_orphan === true;
    } catch (error) {
      return false;
    }
  });

  const usedFiles = filteredFiles.filter(f => {
    try {
      return f && f?.is_orphan !== true;
    } catch (error) {
      return false;
    }
  });

  // 🛡️ FIX #460 RADICAL: Retourner null si pas monté (CLIENT ONLY)
  if (!mounted) {
    return null;
  }

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
              {deleteConfirm && deleteConfirm?.usage_count && deleteConfirm.usage_count > 0 && (
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
              onClick={() => {
                if (deleteConfirm) {
                  handleDelete(deleteConfirm);
                }
              }}
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
  // 🛡️ SKELETON LOADER pendant le chargement
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-3" />
          <p className="text-sm text-gray-500">Chargement des médias...</p>
        </div>
      </div>
    );
  }

  // 🛡️ BLINDAGE TOTAL : Validation stricte + filtre null/undefined
  const safeFiles = Array.isArray(files)
    ? files.filter(f => {
        try {
          if (!f || typeof f !== 'object') return false;
          if (!f?.id) return false;
          // Support nouveau format (url) ET ancien (public_url)
          const hasUrl = f?.url || f?.public_url;
          const hasName = f?.filename || f?.file_name;
          return Boolean(hasUrl && hasName);
        } catch (error) {
          console.error('❌ [MediaGrid] Filter error:', error);
          return false;
        }
      })
    : [];

  // 🛡️ État vide avec UI friendly
  if (safeFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-lg">
        <FolderOpen className="h-12 w-12 mb-2" />
        <p className="text-sm">Aucune image trouvée</p>
        <p className="text-xs mt-1">Uploadez des images pour commencer</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
        {safeFiles.map((file, index) => {
          try {
            // 🛡️ Validation stricte avant le rendu
            if (!file?.id) {
              console.warn('⚠️ [MediaGrid] File without id at index:', index);
              return null;
            }

            // 🛡️ Support des deux formats + construction URL valide
            const rawUrl = file?.url || file?.public_url || '';
            const fileName = file?.filename || file?.file_name || 'Sans nom';

            // Si pas d'URL valide, ignorer cette image
            if (!rawUrl) {
              console.warn('⚠️ [MediaGrid] File without URL:', file?.id);
              return null;
            }

            const finalUrl = buildImageUrl(rawUrl);

            // 🛡️ Clé unique robuste (évite les collisions)
            const uniqueKey = `media-${file.id}-${index}`;

            return (
            <Card
              key={uniqueKey}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedFile === finalUrl
                  ? 'ring-2 ring-pink-500'
                  : ''
              }`}
              onClick={() => onSelect(finalUrl)}
            >
              <CardContent className="p-2">
                <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <img
                    src={finalUrl}
                    alt={fileName}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ [MediaGrid] Image load error:', {
                        id: file.id,
                        filename: fileName,
                        url: finalUrl
                      });
                      // Image de fallback SVG grise avec icône
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="16" dy=".3em"%3EImage introuvable%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {selectedFile === finalUrl && (
                    <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-pink-600" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium truncate" title={fileName}>
                    {fileName}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant={file?.is_orphan ? "secondary" : "default"} className="text-xs">
                      {file?.is_orphan ? 'Non utilisée' : `Utilisée ${file?.usage_count || 0}x`}
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
                    {((file?.file_size || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
              </CardContent>
            </Card>
            );
          } catch (renderError) {
            // 🛡️ ATTRAPER toute erreur individuelle sans faire planter le composant entier
            console.error('❌ [MediaGrid] Render error for file:', file?.id, renderError);
            return null;
          }
        }).filter(Boolean)}
      </div>
    </ScrollArea>
  );
}
