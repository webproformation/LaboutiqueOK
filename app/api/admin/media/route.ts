import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// Synchroniser l'utilisation des médias avec les tables products et categories
export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'sync-usage') {
      // Récupérer tous les médias
      const { data: mediaFiles, error: mediaError } = await supabase
        .from('media_library')
        .select('id, public_url, bucket_name');

      if (mediaError) throw mediaError;

      let updated = 0;

      for (const media of mediaFiles || []) {
        const usedInProducts: number[] = [];
        const usedInCategories: number[] = [];

        // Vérifier utilisation dans products
        if (media.bucket_name === 'product-images') {
          const { data: products } = await supabase
            .from('products')
            .select('woocommerce_id')
            .eq('image_url', media.public_url);

          if (products) {
            usedInProducts.push(...products.map(p => p.woocommerce_id));
          }
        }

        // Vérifier utilisation dans categories
        if (media.bucket_name === 'category-images') {
          const { data: categories } = await supabase
            .from('categories')
            .select('woocommerce_id')
            .eq('image_url', media.public_url);

          if (categories) {
            usedInCategories.push(...categories.map(c => c.woocommerce_id));
          }
        }

        const usageCount = usedInProducts.length + usedInCategories.length;

        // Mettre à jour media_library
        const { error: updateError } = await supabase
          .from('media_library')
          .update({
            used_in_products: usedInProducts,
            used_in_categories: usedInCategories,
            usage_count: usageCount,
            is_orphan: usageCount === 0
          })
          .eq('id', media.id);

        if (!updateError) {
          updated++;
        }
      }

      return NextResponse.json({
        success: true,
        updated,
        total: mediaFiles?.length || 0
      });
    }

    if (action === 'delete-orphans') {
      const { daysOld = 30 } = await request.json();

      const { data, error } = await supabase
        .rpc('cleanup_orphan_media', { p_days_old: daysOld });

      if (error) throw error;

      const result = data[0] || { deleted_count: 0, deleted_media: [] };

      // Supprimer également du storage
      if (result.deleted_media) {
        const deletedMedia = JSON.parse(result.deleted_media);
        for (const media of deletedMedia) {
          await supabase.storage
            .from(media.bucket_name)
            .remove([media.file_path]);
        }
      }

      return NextResponse.json({
        success: true,
        deletedCount: result.deleted_count
      });
    }

    if (action === 'delete-by-url') {
      const { imageUrl, force = false } = await request.json();

      if (!imageUrl) {
        return NextResponse.json(
          { error: 'imageUrl is required' },
          { status: 400 }
        );
      }

      // Récupérer le média
      const { data: media, error: fetchError } = await supabase
        .from('media_library')
        .select('*')
        .eq('public_url', imageUrl)
        .single();

      if (fetchError || !media) {
        return NextResponse.json(
          { error: 'Media not found' },
          { status: 404 }
        );
      }

      // Vérifier si utilisé
      if (media.usage_count > 0 && !force) {
        return NextResponse.json({
          success: false,
          error: 'Media is still in use',
          usageCount: media.usage_count,
          usedInProducts: media.used_in_products,
          usedInCategories: media.used_in_categories
        }, { status: 400 });
      }

      // Supprimer du storage
      const { error: storageError } = await supabase.storage
        .from(media.bucket_name)
        .remove([media.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Supprimer de media_library
      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', media.id);

      if (dbError) throw dbError;

      return NextResponse.json({
        success: true,
        deleted: true
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Media management error:', error);
    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}

// Obtenir les statistiques des médias
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'stats') {
      const { data: stats } = await supabase
        .from('media_library_stats')
        .select('*');

      const { data: orphans } = await supabase
        .from('media_library')
        .select('id, file_name, public_url, file_size, created_at')
        .eq('is_orphan', true)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        stats: stats || [],
        orphans: orphans || []
      });
    }

    if (action === 'check-usage') {
      const imageUrl = url.searchParams.get('url');

      if (!imageUrl) {
        return NextResponse.json(
          { error: 'url parameter required' },
          { status: 400 }
        );
      }

      const { data: media } = await supabase
        .from('media_library')
        .select('*')
        .eq('public_url', imageUrl)
        .single();

      if (!media) {
        return NextResponse.json({
          exists: false,
          usage_count: 0
        });
      }

      return NextResponse.json({
        exists: true,
        usage_count: media.usage_count,
        used_in_products: media.used_in_products,
        used_in_categories: media.used_in_categories,
        is_orphan: media.is_orphan
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Media stats error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
