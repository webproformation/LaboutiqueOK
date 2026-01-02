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
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(selectedUrl || null);
  const [deleteConfirm, setDeleteConfirm] = useState<MediaFile | null>(null);

  const loadMediaFiles = useCallback(async () => {
    setLoading(true);
    try {
      // Tenter de charger depuis media_library
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('bucket_name', bucket)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading from media_library:', error);
      }

      // Sécuriser les données avec validation
      let safeFiles = Array.isArray(data)
        ? data.filter(file => file && typeof file === 'object')
        : [];

      console.log(`📚 Loaded ${safeFiles.length} files from media_library (${bucket})`);

      // 🔄 FALLBACK : Si media_library est vide, lister depuis Storage directement
      if (safeFiles.length === 0) {
        console.log(`⚠️ media_library is empty, falling back to Storage API...`);

        try {
          // Déterminer le dossier selon le bucket
          const folder = bucket === 'product-images' ? 'products' : 'categories';

          const { data: storageFiles, error: storageError } = await supabase
            .storage
            .from(bucket)
            .list(folder, {
              limit: 1000,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (storageError) {
            console.error('Storage list error:', storageError);
          } else if (storageFiles && storageFiles.length > 0) {
            console.log(`✅ Found ${storageFiles.length} files in Storage (${bucket}/${folder})`);

            // Convertir les fichiers Storage en format MediaFile
            safeFiles = storageFiles
              .filter(file => file?.name && !file.name.endsWith('/')) // Exclure les dossiers
              .map(file => {
                const { data: urlData } = supabase.storage
                  .from(bucket)
                  .getPublicUrl(`${folder}/${file.name}`);

                // Générer un id unique si absent
                const uniqueId = file?.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

                return {
                  id: uniqueId,
                  filename: file?.name || 'unknown.jpg',
                  url: urlData?.publicUrl || '',
                  bucket_name: bucket,
                  file_size: file?.metadata?.size || 0,
                  mime_type: file?.metadata?.mimetype || 'image/jpeg',
                  created_at: file?.created_at || new Date().toISOString(),
                  usage_count: 0,
                  is_orphan: false
                };
              });

            console.log(`🔄 Converted ${safeFiles.length} Storage files to MediaFile format`);
          }
        } catch (storageError) {
          console.error('Error listing from Storage:', storageError);
        }
      }

      setFiles(safeFiles);
    } catch (error) {
      console.error('Error loading media files:', error);
      toast.error('Erreur lors du chargement des médias');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [bucket]); // Dépendance : bucket

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]); // Dépendance : loadMediaFiles (stabilisée avec useCallback)

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
      if (media?.id && !media.id.startsWith('temp-')) {
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
  const safeFiles = Array.isArray(files) ? files.filter(f => f && typeof f === 'object' && f.id) : [];

  const filteredFiles = safeFiles.filter(file => {
    if (!file || !file.id) return false;

    // Support des deux formats (nouveau: filename, ancien: file_name)
    const name = (file?.filename || file?.file_name || 'Sans nom').toLowerCase();
    const search = (searchTerm || '').toLowerCase();

    return name.includes(search);
  });

  const orphanFiles = filteredFiles.filter(f => f && f?.is_orphan === true);
  const usedFiles = filteredFiles.filter(f => f && f?.is_orphan !== true);

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
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-3" />
        <p className="text-sm text-gray-500">Chargement des médias...</p>
      </div>
    );
  }

  // 🛡️ BLINDAGE TOTAL : Validation stricte avec support des deux formats
  const safeFiles = Array.isArray(files)
    ? files.filter(f => {
        if (!f || !f?.id) return false;
        // Support nouveau format (url) ET ancien (public_url)
        const hasUrl = f?.url || f?.public_url;
        const hasName = f?.filename || f?.file_name;
        return hasUrl && hasName;
      })
    : [];

  if (safeFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-lg">
        <FolderOpen className="h-12 w-12 mb-2" />
        <p>Aucune image trouvée</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
        {safeFiles.map((file) => {
          if (!file?.id) return null; // Sécurité supplémentaire

          // 🛡️ Support des deux formats + construction URL valide
          const rawUrl = file?.url || file?.public_url || '';
          const fileName = file?.filename || file?.file_name || 'Sans nom';
          const finalUrl = buildImageUrl(rawUrl);

          // 🔍 LOG DIAGNOSTIC : Voir les URLs générées
          console.log('🖼️ [MEDIA_LIBRARY] Image render:', {
            id: file?.id,
            filename: fileName,
            rawUrl: rawUrl,
            finalUrl: finalUrl,
            bucket: file?.bucket_name
          });

          return (
          <Card
            key={file?.id || `fallback-${Math.random()}`}
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
                    console.error('❌ [MEDIA_LIBRARY] Image load error:', {
                      filename: fileName,
                      url: finalUrl,
                      error: 'ERR_NAME_NOT_RESOLVED ou 404'
                    });
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="48"%3E?%3C/text%3E%3C/svg%3E';
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
        })}
      </div>
    </ScrollArea>
  );
}
