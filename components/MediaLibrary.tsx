'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, Search, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  bucket_name: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  usage_count?: number;
  is_orphan?: boolean;
  created_at?: string;
  fromStorage?: boolean;
}

interface MediaLibraryProps {
  bucket?: 'media' | 'category-images';
  selectedUrl?: string;
  onSelect: (url: string) => void;
  onClose?: () => void;
  onUploadSuccess?: () => void;
}

const convertToWebP = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context non disponible'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`✅ [WebP] Conversion réussie: ${file.name} (qualité 0.8)`);
              resolve(blob);
            } else {
              reject(new Error('Conversion WebP échouée'));
            }
          },
          'image/webp',
          0.8
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));

    reader.readAsDataURL(file);
  });
};

export default function MediaLibrary({
  bucket = 'media',
  selectedUrl,
  onSelect,
  onClose,
  onUploadSuccess,
}: MediaLibraryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'used' | 'unused'>('all');
  const [selectedFile, setSelectedFile] = useState<string | null>(selectedUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMediaFiles();
  }, [bucket]);

  useEffect(() => {
    filterFiles();
  }, [searchQuery, activeTab, mediaFiles]);

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      console.log('[MediaLibrary] Loading media files from bucket:', bucket);

      // 1. Charger depuis la vue unified_media (filtrer les fichiers vides)
      const { data: dbMedia, error: dbError } = await supabase
        .from('unified_media')
        .select('*')
        .eq('bucket_name', bucket)
        .gt('file_size', 0)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('[MediaLibrary] Unified media view error:', dbError);
      }
      console.log('[MediaLibrary] Unified media loaded:', dbMedia?.length || 0);

      // 2. Lister les fichiers depuis le storage
      const folder = bucket === 'media' ? '' : 'categories';
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (storageError) {
        console.error('[MediaLibrary] Storage error:', storageError);
      }
      console.log('[MediaLibrary] Storage files loaded:', storageFiles?.length || 0);

      // 3. Charger les images depuis les produits/catégories
      let entityImages: string[] = [];
      if (bucket === 'media') {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('image_url, gallery_images');

        if (productsError) {
          console.error('[MediaLibrary] Products error:', productsError);
        }

        products?.forEach(p => {
          if (p.image_url) entityImages.push(p.image_url);
          if (p.gallery_images && Array.isArray(p.gallery_images)) {
            entityImages.push(...p.gallery_images.filter((img: string) => img));
          }
        });
      } else if (bucket === 'category-images') {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('image_url');

        if (categoriesError) {
          console.error('[MediaLibrary] Categories error:', categoriesError);
        }

        categories?.forEach(c => {
          if (c.image_url) entityImages.push(c.image_url);
        });
      }
      console.log('[MediaLibrary] Entity images loaded:', entityImages.length);

      // 4. Combiner toutes les sources
      const urlMap = new Map<string, MediaFile>();

      // Ajouter les fichiers de la table media
      (dbMedia || []).forEach(file => {
        urlMap.set(file.url, file);
      });

      // Ajouter les fichiers du storage (filtrer les fichiers vides)
      if (storageFiles) {
        for (const storageFile of storageFiles) {
          if (!storageFile.name || storageFile.name === '.emptyFolderPlaceholder') {
            continue;
          }

          const fileSize = storageFile.metadata?.size || 0;
          if (fileSize === 0) {
            console.warn(`[MediaLibrary] Skipping empty file: ${storageFile.name}`);
            continue;
          }

          const filePath = folder ? `${folder}/${storageFile.name}` : storageFile.name;
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          if (!urlMap.has(publicUrlData.publicUrl)) {
            urlMap.set(publicUrlData.publicUrl, {
              id: storageFile.id || `storage-${storageFile.name}`,
              filename: storageFile.name,
              url: publicUrlData.publicUrl,
              bucket_name: bucket,
              file_size: storageFile.metadata?.size,
              mime_type: storageFile.metadata?.mimetype,
              created_at: storageFile.created_at,
              fromStorage: true,
              usage_count: 0,
            });
          }
        }
      }

      // Ajouter les images depuis les entités (produits/catégories)
      entityImages.forEach((url, index) => {
        if (!urlMap.has(url)) {
          const filename = url.split('/').pop() || `image-${index}`;
          urlMap.set(url, {
            id: `entity-${index}-${Date.now()}`,
            filename: filename,
            url: url,
            bucket_name: bucket,
            fromStorage: false,
            usage_count: 1,
            created_at: new Date().toISOString(),
          });
        } else {
          const existing = urlMap.get(url);
          if (existing) {
            existing.usage_count = (existing.usage_count || 0) + 1;
          }
        }
      });

      const combinedFiles = Array.from(urlMap.values());
      console.log(`[MediaLibrary] Loaded ${combinedFiles.length} total media files`);
      setMediaFiles(combinedFiles);
    } catch (error: any) {
      console.error('Error loading media files:', error);
      toast.error(`Erreur lors du chargement: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = [...mediaFiles];

    if (searchQuery) {
      filtered = filtered.filter((file) =>
        file.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === 'used') {
      filtered = filtered.filter((file) => file.usage_count && file.usage_count > 0);
    } else if (activeTab === 'unused') {
      filtered = filtered.filter((file) => !file.usage_count || file.usage_count === 0);
    }

    setFilteredFiles(filtered);
  };

  const uploadSingleFile = async (file: File): Promise<string> => {
    // Validation stricte
    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name}: Format invalide (image uniquement)`);
    }

    if (file.size === 0) {
      throw new Error(`${file.name}: Fichier vide`);
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`${file.name}: Taille max 10MB`);
    }

    let fileToUpload: File | Blob = file;
    let fileName = file.name;

    // TOUJOURS convertir en WebP sauf si déjà en WebP
    if (!file.type.includes('webp')) {
      console.log(`🔄 [WebP] Conversion de ${file.name} en WebP...`);

      try {
        const webpBlob = await convertToWebP(file);
        fileToUpload = webpBlob;
        fileName = file.name.replace(/\.(jpg|jpeg|png|gif|bmp|tiff)$/i, '.webp');
        console.log(`✅ [WebP] Converti: ${fileName}`);
      } catch (conversionError) {
        throw new Error(`${file.name}: Erreur conversion WebP`);
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload, fileName);
    formData.append('bucket', bucket);
    formData.append('folder', bucket === 'media' ? '' : 'categories');

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.url;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      if (files.length === 1) {
        toast.info('Upload en cours...', { duration: 2000 });
      } else {
        toast.info(`Upload de ${files.length} images...`, { duration: 2000 });
      }

      // Upload simultané avec Promise.all
      const uploadPromises = files.map((file, index) =>
        uploadSingleFile(file).then(url => {
          setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
          return { success: true, url, filename: file.name };
        }).catch(error => {
          setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
          return { success: false, error: error.message, filename: file.name };
        })
      );

      const results = await Promise.all(uploadPromises);

      const successful = results.filter((r): r is { success: true; url: string; filename: string } => r.success === true);
      const failed = results.filter((r): r is { success: false; error: any; filename: string } => r.success === false);

      // Basculer automatiquement sur l'onglet "Toutes les images"
      setActiveTab('all');

      // Recharger la liste
      await loadMediaFiles();

      // Sélectionner la dernière image uploadée
      if (successful.length > 0) {
        const lastSuccessful = successful[successful.length - 1];
        setSelectedFile(lastSuccessful.url);
        onSelect(lastSuccessful.url);
      }

      // Notifications
      if (successful.length > 0) {
        toast.success(
          `${successful.length} image${successful.length > 1 ? 's' : ''} uploadée${successful.length > 1 ? 's' : ''} avec succès`,
          { duration: 4000 }
        );
      }

      if (failed.length > 0) {
        failed.forEach(f => {
          toast.error(f.error || `Erreur: ${f.filename}`);
        });
      }

      // Second chargement différé
      setTimeout(async () => {
        await loadMediaFiles();
      }, 1000);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));

    if (files.length === 0) {
      toast.error('Veuillez déposer des images uniquement');
      return;
    }

    // Simuler un event pour réutiliser handleUpload
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));

    const mockEvent = {
      target: { files: dataTransfer.files }
    } as React.ChangeEvent<HTMLInputElement>;

    await handleUpload(mockEvent);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDelete = async (fileId: string, filePath: string, fromStorage?: boolean) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      // Extract the path relative to the bucket
      // filePath is a full URL, we need to extract the path after the bucket name
      const folder = bucket === 'media' ? '' : 'categories';
      const filename = filePath.split('/').slice(-1)[0];
      const pathToDelete = folder ? `${folder}/${filename}` : filename;

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([pathToDelete]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      if (!fromStorage) {
        const { error: dbError } = await supabase
          .from('media')
          .delete()
          .eq('id', fileId);

        if (dbError) {
          console.error('Database delete error:', dbError);
        }
      }

      toast.success('Fichier supprimé avec succès');

      // Premier chargement immédiat
      await loadMediaFiles();

      // Second chargement différé pour confirmer la disparition visuelle
      setTimeout(async () => {
        await loadMediaFiles();
      }, 500);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSelectFile = (url: string) => {
    setSelectedFile(url);
    onSelect(url);
    if (onClose) {
      onClose();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 transition-all ${
          isDragging
            ? 'border-[#d4af37] bg-[#d4af37]/10'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <Upload className={`h-10 w-10 ${isDragging ? 'text-[#d4af37]' : 'text-gray-400'}`} />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Glissez-déposez vos images ici
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ou cliquez pour sélectionner (plusieurs fichiers possibles)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2 bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress ? `${uploadProgress.current}/${uploadProgress.total}` : 'Upload...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Sélectionner des images
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom de fichier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-white">
            Toutes ({mediaFiles.length})
          </TabsTrigger>
          <TabsTrigger value="used" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-white">
            Utilisées ({mediaFiles.filter((f) => f.usage_count && f.usage_count > 0).length})
          </TabsTrigger>
          <TabsTrigger value="unused" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-white">
            Non utilisées ({mediaFiles.filter((f) => !f.usage_count || f.usage_count === 0).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun fichier trouvé</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#d4af37] scrollbar-track-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFiles.map((file) => (
                  <Card
                    key={file.id}
                    className={`relative group cursor-pointer overflow-hidden transition-all bg-white ${
                      selectedFile === file.url
                        ? 'ring-2 ring-[#d4af37] ring-offset-2'
                        : 'hover:shadow-lg hover:border-[#d4af37]'
                    }`}
                    onClick={() => handleSelectFile(file.url)}
                  >
                    <div className="aspect-square relative bg-gray-100">
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                      />
                      {selectedFile === file.url && (
                        <div className="absolute top-2 right-2 bg-[#d4af37] text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file.id, file.url, file.fromStorage);
                          }}
                          className="gap-2 bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    <div className="p-2 space-y-1 bg-white">
                      <p className="text-xs font-medium truncate text-gray-900" title={file.filename}>
                        {file.filename}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(file.file_size)}</span>
                        {file.usage_count !== undefined && (
                          <span className="text-[#d4af37]">Utilisé: {file.usage_count}×</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
