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
  bucket?: 'product-images' | 'category-images';
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
              console.log(`✅ [WebP] Conversion réussie: ${file.name}`);
              resolve(blob);
            } else {
              reject(new Error('Conversion WebP échouée'));
            }
          },
          'image/webp',
          0.90
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
  bucket = 'product-images',
  selectedUrl,
  onSelect,
  onClose,
  onUploadSuccess,
}: MediaLibraryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'used' | 'unused'>('all');
  const [selectedFile, setSelectedFile] = useState<string | null>(selectedUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMediaFiles();
  }, [bucket]);

  useEffect(() => {
    filterFiles();
  }, [searchQuery, activeTab, mediaFiles]);

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      console.log('Loading media files from bucket:', bucket);

      const { data: dbMedia, error: dbError } = await supabase
        .from('media')
        .select('*')
        .eq('bucket_name', bucket)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // List files from the appropriate folder
      const folder = bucket === 'product-images' ? 'products' : 'categories';
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (storageError) {
        console.error('Storage error:', storageError);
      }

      const dbMediaMap = new Map(
        (dbMedia || []).map(file => [file.file_path, file])
      );

      const combinedFiles: MediaFile[] = [];

      (dbMedia || []).forEach(file => {
        combinedFiles.push(file);
      });

      if (storageFiles) {
        for (const storageFile of storageFiles) {
          const filePath = `${folder}/${storageFile.name}`;
          if (!dbMediaMap.has(filePath)) {
            const { data: publicUrlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);

            combinedFiles.push({
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

      console.log(`Loaded ${combinedFiles.length} total media files`);
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
      let fileToUpload: File | Blob = file;
      let fileName = file.name;

      if (!file.type.includes('webp')) {
        console.log(`🔄 [WebP] Conversion de ${file.name} en WebP...`);
        toast.info('Conversion en WebP...');

        try {
          const webpBlob = await convertToWebP(file);
          fileToUpload = webpBlob;
          fileName = file.name.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
        } catch (conversionError) {
          console.warn('[WebP] Conversion échouée, upload du fichier original');
          toast.warning('Conversion WebP échouée, upload de l\'image originale');
        }
      }

      const formData = new FormData();
      formData.append('file', fileToUpload, fileName);
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

      toast.success('Image uploadée avec succès');
      await loadMediaFiles();
      setSelectedFile(result.url);
      onSelect(result.url);

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

  const handleDelete = async (fileId: string, filePath: string, fromStorage?: boolean) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      // Extract the path relative to the bucket
      // filePath is a full URL, we need to extract the path after the bucket name
      const folder = bucket === 'product-images' ? 'products' : 'categories';
      const filename = filePath.split('/').slice(-1)[0];
      const pathToDelete = `${folder}/${filename}`;

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
      await loadMediaFiles();
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
              Upload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Uploader une image
            </>
          )}
        </Button>
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
