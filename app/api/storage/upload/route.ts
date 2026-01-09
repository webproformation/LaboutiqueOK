import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ⚠️ VERROUILLAGE ANTI-REVERT - Projet qcqbtmvbvipsxwjlgjvk
// Clé mise à jour : 2026-01-07
const LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const LOCKED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

const supabase = createClient(LOCKED_SUPABASE_URL, LOCKED_SUPABASE_ANON_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    let bucket = formData.get('bucket') as string || 'medias';
    const folder = formData.get('folder') as string || '';

    if (bucket === 'media') {
      bucket = 'medias';
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = folder ? `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}` : `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    console.log(`[UPLOAD] Uploading to bucket: ${bucket}, path: ${fileName}, size: ${file.size}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[UPLOAD] DÉTAIL ERREUR UPLOAD:', uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    console.log(`[UPLOAD] Success! File uploaded:`, uploadData);

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`[UPLOAD] Public URL generated:`, publicUrl);

    const { error: dbError } = await supabase
      .from('media')
      .insert({
        filename: file.name,
        file_path: fileName,
        url: publicUrl,
        bucket_name: bucket,
        file_size: file.size,
        mime_type: file.type,
        is_optimized: file.type.includes('webp'),
        usage_count: 0,
        is_orphan: false,
      });

    if (dbError) {
      console.warn('[UPLOAD] Warning: Could not save to media table:', dbError.message);
    } else {
      console.log('[UPLOAD] File metadata saved to media table');
    }

    console.log(`[UPLOAD] ✅ COMPLETE! URL: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: fileName,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    console.error('[UPLOAD] Critical error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
