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
    console.log('📝 Registering in media_library:', {
      fileName,
      path: fileName,
      url: urlData.publicUrl,
      bucket,
      size: file.size,
      type: file.type
    });

    const { error: dbError, data: mediaData } = await supabaseAdmin
      .from('media_library')
      .insert({
        file_name: file.name,
        file_path: fileName,
        public_url: urlData.publicUrl,
        bucket_name: bucket,
        file_size: file.size,
        mime_type: file.type,
        usage_count: 0,
        is_orphan: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error inserting into media_library:', {
        error: dbError,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      });
    } else {
      console.log('✅ Successfully registered in media_library:', mediaData);
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
