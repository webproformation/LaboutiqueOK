import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Marquer la route comme dynamique pour éviter le pré-rendu statique
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials for migrate-image API');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Migrate an image from WordPress to Supabase Storage
 * POST /api/storage/migrate-image
 * Body: { url: string, bucket: 'product-images' | 'category-images', folder?: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const { url, bucket, folder = '' } = await req.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'No URL provided' },
        { status: 400 }
      );
    }

    if (!bucket || !['product-images', 'category-images'].includes(bucket)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bucket. Use "product-images" or "category-images"' },
        { status: 400 }
      );
    }

    // If the URL is already from Supabase, return it as-is
    if (url.includes('supabase.co')) {
      return NextResponse.json({
        success: true,
        url,
        message: 'Image already hosted on Supabase',
        migrated: false,
      });
    }

    console.log('[Migrate Image] Downloading from:', url);

    // Download the image from WordPress
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from WordPress');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Extract file extension from URL or content-type
    let ext = 'jpg';
    const urlExt = url.split('.').pop()?.split('?')[0].toLowerCase();
    if (urlExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(urlExt)) {
      ext = urlExt;
    } else if (contentType.includes('png')) {
      ext = 'png';
    } else if (contentType.includes('gif')) {
      ext = 'gif';
    } else if (contentType.includes('webp')) {
      ext = 'webp';
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `${folder ? folder + '/' : ''}migrated-${timestamp}-${randomStr}.${ext}`;

    console.log('[Migrate Image] Uploading to Supabase:', fileName);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, Buffer.from(imageBuffer), {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('[Migrate Image] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log('[Migrate Image] Success! New URL:', urlData.publicUrl);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      oldUrl: url,
      path: fileName,
      bucket,
      migrated: true,
      message: 'Image successfully migrated to Supabase',
    });
  } catch (error: any) {
    console.error('[Migrate Image] Exception:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
