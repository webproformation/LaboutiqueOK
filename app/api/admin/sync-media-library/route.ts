import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[Sync Media Library] Starting synchronization...');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const buckets = ['product-images', 'category-images'];
    let totalSynced = 0;
    let totalErrors = 0;

    for (const bucket of buckets) {
      console.log(`[Sync Media Library] Processing bucket: ${bucket}`);

      const folder = bucket === 'product-images' ? 'products' : 'categories';

      // List all files in Storage
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from(bucket)
        .list(folder, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (storageError) {
        console.error(`[Sync Media Library] Storage error for ${bucket}:`, storageError);
        continue;
      }

      if (!storageFiles || storageFiles.length === 0) {
        console.log(`[Sync Media Library] No files found in ${bucket}/${folder}`);
        continue;
      }

      console.log(`[Sync Media Library] Found ${storageFiles.length} files in ${bucket}/${folder}`);

      // For each file, check if it exists in media_library
      for (const file of storageFiles) {
        if (!file.name || file.name.endsWith('/')) {
          continue; // Skip folders
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(`${folder}/${file.name}`);

        const publicUrl = urlData.publicUrl;

        // Check if already exists in media_library
        const { data: existingMedia } = await supabase
          .from('media_library')
          .select('id')
          .eq('url', publicUrl)
          .maybeSingle();

        if (existingMedia) {
          console.log(`[Sync Media Library] ⏭️ Already exists: ${file.name}`);
          continue;
        }

        // Insert into media_library
        try {
          const { error: insertError } = await supabase
            .from('media_library')
            .insert({
              filename: file.name,
              url: publicUrl,
              bucket_name: bucket,
              file_size: file.metadata?.size || 0,
              mime_type: file.metadata?.mimetype || 'image/jpeg',
              usage_count: 0,
              is_orphan: false
            });

          if (insertError) {
            console.error(`[Sync Media Library] ❌ Insert error for ${file.name}:`, insertError);
            totalErrors++;
          } else {
            console.log(`[Sync Media Library] ✅ Synced: ${file.name}`);
            totalSynced++;
          }
        } catch (error: any) {
          console.error(`[Sync Media Library] ❌ Error syncing ${file.name}:`, error);
          totalErrors++;
        }
      }
    }

    console.log(`[Sync Media Library] Completed: ${totalSynced} synced, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      message: `${totalSynced} fichiers synchronisés dans media_library`,
      totalSynced,
      totalErrors
    });

  } catch (error: any) {
    console.error('[Sync Media Library] Critical error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la synchronisation'
      },
      { status: 500 }
    );
  }
}
