'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onUploadSuccess: (imageUrl: string) => void;
}

export function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          0.9
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide (format image uniquement)');
      return;
    }

    if (file.size === 0) {
      toast.error('Le fichier est vide. Veuillez sélectionner un fichier valide');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10MB');
      return;
    }

    setUploading(true);

    try {
      const webpBlob = await convertToWebP(file);

      const originalName = file.name.replace(/\.[^/.]+$/, '');
      const timestamp = Date.now();
      const webpFileName = `${originalName}-${timestamp}.webp`;

      const formData = new FormData();
      formData.append('file', webpBlob, webpFileName);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();

      toast.success('Image uploadée et convertie en WebP avec succès');
      setPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="bg-[#d4af37] hover:bg-[#b8933d]"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Conversion et upload en cours...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Uploader une image
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {preview && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={clearPreview}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {preview && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs rounded-lg"
          />
        </div>
      )}

      <p className="text-xs text-gray-500">
        L'image sera automatiquement convertie en WebP pour optimiser la taille
      </p>
    </div>
  );
}
