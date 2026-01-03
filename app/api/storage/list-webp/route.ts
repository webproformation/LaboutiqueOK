/**
 * API pour lister les images WebP dans le Storage Supabase
 * et créer un index de mapping product ID → WebP URLs
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[ListWebP] Scanning product-images bucket...');

    // Lister tous les fichiers dans product-images/products
    const { data: files, error } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 1000 });

    if (error) {
      console.error('[ListWebP] Storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[ListWebP] Found ${files?.length || 0} files`);

    // Filtrer uniquement les fichiers .webp
    const webpFiles = files?.filter(f => f.name.endsWith('.webp')) || [];
    console.log(`[ListWebP] WebP files: ${webpFiles.length}`);

    // Créer un index: woocommerce_id → URLs
    const productImageMap: Record<number, string[]> = {};

    webpFiles.forEach(file => {
      // Pattern: product-532-1735739286597.webp
      const match = file.name.match(/^product-(\d+)-\d+\.webp$/);
      if (match) {
        const wooId = parseInt(match[1]);
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/products/${file.name}`;

        if (!productImageMap[wooId]) {
          productImageMap[wooId] = [];
        }
        productImageMap[wooId].push(publicUrl);
      } else {
        console.log(`[ListWebP] Skipping file with invalid pattern: ${file.name}`);
      }
    });

    const productIds = Object.keys(productImageMap).map(Number).sort((a, b) => a - b);
    console.log(`[ListWebP] Mapped ${productIds.length} unique products`);
    console.log(`[ListWebP] Product IDs:`, productIds.slice(0, 20));

    return NextResponse.json({
      success: true,
      totalFiles: files?.length || 0,
      webpFiles: webpFiles.length,
      uniqueProducts: productIds.length,
      productImageMap,
      productIds,
    });
  } catch (error: any) {
    console.error('[ListWebP] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
