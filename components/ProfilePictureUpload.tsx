"use client";

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Loader2, Upload } from 'lucide-react';

interface ProfilePictureUploadProps {
  currentAvatarUrl: string;
  firstName: string;
  lastName: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export default function ProfilePictureUpload({
  currentAvatarUrl,
  firstName,
  lastName,
  onAvatarUpdate,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);

  const getInitials = () => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return;
    }

    setUploading(true);

    try {
      const { supabase } = await import('@/lib/supabase-client');
      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append('file', file);

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/wordpress/upload-media', {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.url) {
        onAvatarUpdate(result.url);
        toast.success('Photo de profil mise à jour avec succès !');
      } else {
        toast.error('Erreur lors du téléchargement de l\'image');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-32 w-32 border-4 border-[#b8933d]">
          <AvatarImage src={currentAvatarUrl} alt={`${firstName} ${lastName}`} className="object-cover" />
          <AvatarFallback className="text-3xl bg-[#b8933d] text-white">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-8 w-8 text-white" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Label htmlFor="avatar-upload" className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            className="border-[#b8933d] text-[#b8933d] hover:bg-[#b8933d] hover:text-white"
            disabled={uploading}
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Changer la photo
              </>
            )}
          </Button>
        </Label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <p className="text-xs text-gray-500 text-center">
          JPG, PNG ou GIF. Max 5 Mo.
        </p>
      </div>
    </div>
  );
}
