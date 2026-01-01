"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  bucket: 'product-images' | 'category-images';
  folder?: string;
  className?: string;
  previewClassName?: string;
}

export default function ImageUploader({
  value,
  onChange,
  bucket,
  folder = '',
  className = '',
  previewClassName = 'w-32 h-32',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (folder) {
        formData.append('folder', folder);
      }

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setPreview(result.url);
      onChange(result.url);
      toast.success('Image uploadée avec succès');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  // Check if URL is from WordPress (old) or Supabase (new)
  const isWordPressUrl = preview?.includes('wp.laboutiquedemorgane') || preview?.includes('laboutiquedemorgane.webprocreation');
  const isSupabaseUrl = preview?.includes('supabase.co');

  return (
    <div className={`space-y-3 ${className}`}>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className={`object-cover rounded border ${previewClassName}`}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
          {isWordPressUrl && (
            <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
              WordPress
            </div>
          )}
          {isSupabaseUrl && (
            <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
              Supabase
            </div>
          )}
        </div>
      ) : (
        <div className={`bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center ${previewClassName}`}>
          <ImageIcon className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <div>
        <Input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="max-w-xs"
        />
        {uploading && (
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Upload en cours...
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Formats acceptés: JPG, PNG, GIF, WebP (max 10MB)
        </p>
        {preview && (
          <p className="text-xs text-gray-600 mt-1 break-all">
            {isWordPressUrl && '📦 WordPress: '}
            {isSupabaseUrl && '✓ Supabase: '}
            {preview}
          </p>
        )}
      </div>
    </div>
  );
}
