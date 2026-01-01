import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Marquer la route comme dynamique pour éviter le pré-rendu statique
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials for storage upload API');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!bucket || !['product-images', 'category-images'].includes(bucket)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bucket. Use "product-images" or "category-images"' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop();
    const fileName = `${folder ? folder + '/' : ''}${timestamp}-${randomStr}.${ext}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[Storage Upload] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Insérer dans media_library
    const insertPayload = {
      file_name: file.name,
      file_path: fileName,
      public_url: urlData.publicUrl,
      bucket_name: bucket,
      file_size: file.size,
      mime_type: file.type,
      usage_count: 0,
      is_orphan: true
    };

    console.log('📝 [MEDIA_LIBRARY] Attempting insert with payload:', {
      ...insertPayload,
      timestamp: new Date().toISOString()
    });

    console.log('📝 [MEDIA_LIBRARY] Using Supabase Admin client:', {
      hasClient: !!supabaseAdmin,
      url: supabaseUrl?.substring(0, 30) + '...',
      hasServiceKey: !!supabaseServiceKey
    });

    const { error: dbError, data: mediaData } = await supabaseAdmin
      .from('media_library')
      .insert(insertPayload)
      .select()
      .single();

    if (dbError) {
      console.error('❌ [MEDIA_LIBRARY] Insert FAILED:', {
        errorObject: dbError,
        errorName: dbError.name,
        errorMessage: dbError.message,
        errorDetails: dbError.details,
        errorHint: dbError.hint,
        errorCode: dbError.code,
        payload: insertPayload,
        timestamp: new Date().toISOString()
      });

      // Ne pas échouer l'upload si juste l'insertion DB échoue
      console.warn('⚠️  [MEDIA_LIBRARY] File uploaded to storage but DB insert failed');
    } else {
      console.log('✅ [MEDIA_LIBRARY] Insert SUCCESS:', {
        mediaData,
        id: mediaData?.id,
        file_name: mediaData?.file_name,
        bucket: mediaData?.bucket_name,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName,
      bucket,
      mediaId: mediaData?.id
    });
  } catch (error: any) {
    console.error('[Storage Upload] Exception:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const { bucket, path } = await req.json();

    if (!bucket || !['product-images', 'category-images'].includes(bucket)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bucket' },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No path provided' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('[Storage Delete] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('[Storage Delete] Exception:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
