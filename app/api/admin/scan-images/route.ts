/**
 * API Route pour scanner le Storage Supabase et construire l'index des images
 *
 * Cette route utilise SERVICE_ROLE_KEY pour accéder au Storage
 * et retourne un index mapping WooCommerce ID → URLs d'images
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Utiliser SERVICE_ROLE_KEY côté serveur (sécurisé)
    const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials', index: {} },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[API/ScanImages] 🔍 Scanning Storage for images...');

    // Scanner le bucket product-images
    const { data: files, error } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 2000 });

    if (error) {
      console.error('[API/ScanImages] Storage error:', error);
      return NextResponse.json(
        { error: 'Storage scan failed', details: error.message, index: {} },
        { status: 500 }
      );
    }

    console.log(`[API/ScanImages] Found ${files?.length || 0} total files`);

    // Filtrer les images
    const imageFiles = files?.filter(f =>
      f.name.endsWith('.webp') ||
      f.name.endsWith('.jpg') ||
      f.name.endsWith('.jpeg') ||
      f.name.endsWith('.png')
    ) || [];

    const webpCount = files?.filter(f => f.name.endsWith('.webp')).length || 0;
    const jpgCount = files?.filter(f => f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')).length || 0;
    const pngCount = files?.filter(f => f.name.endsWith('.png')).length || 0;

    console.log(`[API/ScanImages] Image files breakdown:`);
    console.log(`  - WebP: ${webpCount}`);
    console.log(`  - JPG/JPEG: ${jpgCount}`);
    console.log(`  - PNG: ${pngCount}`);
    console.log(`  - TOTAL: ${imageFiles.length}`);

    // Construire l'index
    const index: { [wooId: number]: string[] } = {};

    imageFiles.forEach(file => {
      // Pattern: product-{id}-{timestamp}.{ext}
      const match = file.name.match(/^product-(\d+)-\d+\.(webp|jpg|jpeg|png)$/);
      if (match) {
        const wooId = parseInt(match[1]);
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/products/${file.name}`;

        if (!index[wooId]) {
          index[wooId] = [];
        }
        index[wooId].push(publicUrl);

        console.log(`[API/ScanImages] FOUND: ${file.name} for WooCommerce ID ${wooId}`);
      }
    });

    const productCount = Object.keys(index).length;
    const totalImages = Object.values(index).reduce((sum, imgs) => sum + imgs.length, 0);

    console.log(`[API/ScanImages] ✅ Indexed ${productCount} products with ${totalImages} images`);
    console.log(`[API/ScanImages] Product IDs (first 30):`, Object.keys(index).slice(0, 30).join(', '));

    return NextResponse.json({
      success: true,
      stats: {
        totalFiles: files?.length || 0,
        imageFiles: imageFiles.length,
        webpCount,
        jpgCount,
        pngCount,
        productCount,
        totalImages
      },
      index
    });

  } catch (error: any) {
    console.error('[API/ScanImages] Exception:', error);
    return NextResponse.json(
      { error: 'Scan failed', message: error.message, index: {} },
      { status: 500 }
    );
  }
}
