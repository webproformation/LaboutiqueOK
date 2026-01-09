import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD] Début du traitement de la requête');

    const formData = await request.formData();
    console.log('[UPLOAD] FormData reçu, nombre de champs:', Array.from(formData.keys()).length);
    const file = formData.get('file') as File;
    let bucket = formData.get('bucket') as string || 'media';
    const folder = formData.get('folder') as string || '';

    // Normaliser vers 'media' (sans s)
    if (bucket === 'medias') {
      bucket = 'media';
    }

    console.log(`[UPLOAD] Bucket cible: ${bucket}`);

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
      console.error('[UPLOAD] Bucket utilisé:', bucket);

      const errorMessage = uploadError.message.includes('Bucket not found')
        ? `Bucket '${bucket}' introuvable. Vérifiez que le bucket existe dans Supabase Storage.`
        : uploadError.message;

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          bucket: bucket,
          details: uploadError
        },
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
