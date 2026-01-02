import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
  imagesProcessed: number;
  totalImages?: number;
  imagesDownloaded: number;
  imagesUploaded: number;
  productsUpdated: number;
  errors?: Array<{
    productId: number;
    productName: string;
    imageUrl: string;
    error: string;
  }>;
  debugInfo?: {
    mode: string;
    imagesPerBatch: number;
    totalBatches: number;
    rateLimiting: string;
    hasErrors: boolean;
    errorDetails: any[];
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  console.log('[Media Sync] ===== STARTING MEDIA SYNC REQUEST =====');

  try {
    console.log('[Media Sync] Step 1: Checking environment variables...');

    const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Media Sync] Missing Supabase configuration');
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration Supabase manquante. Vérifiez les variables d\'environnement.'
        },
        { status: 500 }
      );
    }

    console.log('[Media Sync] Step 2: Creating Supabase client...');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Media Sync] Step 3: Fetching products with WordPress images...');

    // Get all products that have a WordPress image URL but no Supabase image
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, woocommerce_id, name, image_url')
      .not('image_url', 'is', null)
      .like('image_url', '%wp.laboutiquedemorgane.com%');

    if (productsError) {
      console.error('[Media Sync] Error fetching products:', productsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la récupération des produits',
          details: productsError.message
        },
        { status: 500 }
      );
    }

    const totalImages = products?.length || 0;
    console.log(`[Media Sync] Found ${totalImages} products with WordPress images to sync`);

    if (totalImages === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune image WordPress à synchroniser',
        imagesProcessed: 0,
        totalImages: 0,
        imagesDownloaded: 0,
        imagesUploaded: 0,
        productsUpdated: 0,
        errors: []
      });
    }

    // Counters
    let imagesProcessed = 0;
    let imagesDownloaded = 0;
    let imagesUploaded = 0;
    let productsUpdated = 0;
    const errors: Array<{
      productId: number;
      productName: string;
      imageUrl: string;
      error: string;
    }> = [];

    // 🛡️ SAFETY MODE: Process 10 images per batch
    const batchSize = 10;
    let batchNumber = 1;
    const totalBatches = Math.ceil(totalImages / batchSize);

    console.log('[Media Sync] ⚙️ Configuration:', {
      mode: 'SAFETY_MODE',
      imagesPerBatch: batchSize,
      totalBatches,
      rateLimiting: '500ms between batches',
      maxDuration: '300s'
    });

    // Process products in batches
    for (let i = 0; i < totalImages; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`[Media Sync] 📦 Processing batch ${batchNumber}/${totalBatches}: ${batch.length} images...`);
      const batchStartTime = Date.now();

      for (let j = 0; j < batch.length; j++) {
        const product = batch[j];
        const imageIndex = i + j + 1;

        try {
          console.log(`[Media Sync] [${imageIndex}/${totalImages}] Processing image for product ${product.woocommerce_id}: "${product.name}"`);

          if (!product.image_url) {
            console.warn(`[Media Sync] [${imageIndex}/${totalImages}] Product ${product.woocommerce_id} has no image_url, skipping`);
            continue;
          }

          // 🛡️ Step 1: Download image from WordPress
          let imageBlob: Blob;
          try {
            console.log(`[Media Sync] [${imageIndex}/${totalImages}] Downloading from: ${product.image_url.substring(0, 80)}...`);

            const downloadResponse = await fetch(product.image_url, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MediaSyncEngine/1.0)'
              }
            });

            if (!downloadResponse.ok) {
              throw new Error(`HTTP ${downloadResponse.status}: ${downloadResponse.statusText}`);
            }

            imageBlob = await downloadResponse.blob();
            imagesDownloaded++;
            console.log(`[Media Sync] [${imageIndex}/${totalImages}] ✅ Downloaded: ${imageBlob.size} bytes, type: ${imageBlob.type}`);
          } catch (downloadError: any) {
            console.error(`[Media Sync] [${imageIndex}/${totalImages}] ❌ Download failed:`, downloadError.message);
            errors.push({
              productId: product.woocommerce_id,
              productName: product.name,
              imageUrl: product.image_url,
              error: `Download failed: ${downloadError.message}`
            });
            continue; // Skip to next image
          }

          // 🛡️ Step 2: Generate filename
          const urlParts = product.image_url.split('/');
          const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
          const fileExtension = originalFilename.split('.').pop() || 'jpg';
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const newFilename = `products/product_${product.woocommerce_id}_${timestamp}_${randomString}.${fileExtension}`;

          // 🛡️ Step 3: Upload to Supabase Storage
          let supabaseUrl: string;
          try {
            console.log(`[Media Sync] [${imageIndex}/${totalImages}] Uploading to Supabase: ${newFilename}`);

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(newFilename, imageBlob, {
                contentType: imageBlob.type || 'image/jpeg',
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              throw new Error(`Upload error: ${uploadError.message}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(newFilename);

            supabaseUrl = urlData.publicUrl;

            // Ensure URL is complete
            if (!supabaseUrl.startsWith('http')) {
              const baseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
              supabaseUrl = `${baseUrl}/storage/v1/object/public/product-images/${newFilename}`;
            }

            imagesUploaded++;
            console.log(`[Media Sync] [${imageIndex}/${totalImages}] ✅ Uploaded to: ${supabaseUrl.substring(0, 80)}...`);
          } catch (uploadError: any) {
            console.error(`[Media Sync] [${imageIndex}/${totalImages}] ❌ Upload failed:`, uploadError.message);
            errors.push({
              productId: product.woocommerce_id,
              productName: product.name,
              imageUrl: product.image_url,
              error: `Upload failed: ${uploadError.message}`
            });
            continue; // Skip to next image
          }

          // 🛡️ Step 4: Create entry in media_library
          try {
            const { error: mediaError } = await supabase
              .from('media_library')
              .insert({
                filename: originalFilename,
                url: supabaseUrl,
                bucket_name: 'product-images',
                file_size: imageBlob.size,
                mime_type: imageBlob.type || 'image/jpeg'
              });

            if (mediaError) {
              console.warn(`[Media Sync] [${imageIndex}/${totalImages}] ⚠️ Media library insert failed:`, mediaError.message);
              // Don't fail the whole process if just media_library insert fails
            }
          } catch (mediaLibraryError: any) {
            console.warn(`[Media Sync] [${imageIndex}/${totalImages}] ⚠️ Media library error:`, mediaLibraryError.message);
            // Continue anyway
          }

          // 🛡️ Step 5: Update product with new Supabase URL
          try {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                image_url: supabaseUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', product.id);

            if (updateError) {
              throw new Error(`Product update error: ${updateError.message}`);
            }

            productsUpdated++;
            console.log(`[Media Sync] [${imageIndex}/${totalImages}] ✅ Product ${product.woocommerce_id} updated with Supabase URL`);
          } catch (updateError: any) {
            console.error(`[Media Sync] [${imageIndex}/${totalImages}] ❌ Product update failed:`, updateError.message);
            errors.push({
              productId: product.woocommerce_id,
              productName: product.name,
              imageUrl: product.image_url,
              error: `Product update failed: ${updateError.message}`
            });
            continue;
          }

          imagesProcessed++;
        } catch (imageError: any) {
          console.error(`[Media Sync] [${imageIndex}/${totalImages}] ❌ Unexpected error:`, imageError.message);
          errors.push({
            productId: product.woocommerce_id,
            productName: product.name,
            imageUrl: product.image_url || 'N/A',
            error: imageError.message || 'Unknown error'
          });
        }
      }

      const batchDuration = Date.now() - batchStartTime;
      console.log(`[Media Sync] ✅ Batch ${batchNumber}/${totalBatches} completed in ${batchDuration}ms`);
      console.log(`[Media Sync] 📊 Progress: ${imagesProcessed}/${totalImages} processed | Downloaded: ${imagesDownloaded} | Uploaded: ${imagesUploaded} | Updated: ${productsUpdated} | Errors: ${errors.length}`);

      batchNumber++;

      // Rate limiting: wait 500ms before next batch (except for last batch)
      if (i + batchSize < totalImages) {
        console.log('[Media Sync] Waiting 500ms before next batch (rate limiting)...');
        await sleep(500);
      }
    }

    console.log(`[Media Sync] Sync completed:`, {
      processed: imagesProcessed,
      downloaded: imagesDownloaded,
      uploaded: imagesUploaded,
      productsUpdated,
      errors: errors.length
    });

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée - MODE SÉCURISÉ (${batchSize} images par batch)`,
      imagesProcessed,
      totalImages,
      imagesDownloaded,
      imagesUploaded,
      productsUpdated,
      errors: errors.length > 0 ? errors : [],
      debugInfo: {
        mode: 'SAFETY_MODE',
        imagesPerBatch: batchSize,
        totalBatches,
        rateLimiting: '500ms',
        hasErrors: errors.length > 0,
        errorDetails: errors
      }
    });

  } catch (error: any) {
    console.error('[Media Sync] ===== CRITICAL ERROR =====');
    console.error('[Media Sync] Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });

    return NextResponse.json(
      {
        success: false,
        error: `Erreur critique: ${error?.message || 'Unknown error'}`,
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          name: error?.name,
          stack: error?.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}
