import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // 5 minutes max pour la migration

interface MigrationStats {
  totalProducts: number;
  totalCategories: number;
  migratedProducts: number;
  migratedCategories: number;
  errors: string[];
  migratedFiles: Array<{
    originalUrl: string;
    newUrl: string;
    entityType: string;
    entityId: number;
  }>;
}

// Conversion d'image en WebP
async function convertToWebP(imageBlob: Blob): Promise<Blob> {
  // Pour la conversion WebP côté serveur, on utilise sharp via une edge function
  // Pour l'instant, on retourne le blob tel quel
  return imageBlob;
}

// Télécharger une image depuis WordPress
async function downloadImage(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MediaMigration/1.0)'
      }
    });

    if (!response.ok) {
      console.error(`Failed to download ${url}: ${response.status}`);
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return null;
  }
}

// Générer un nom de fichier unique
function generateFileName(originalUrl: string, entityType: string, entityId: number): string {
  const extension = originalUrl.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  return `${entityType}-${entityId}-${timestamp}.${extension}`;
}

// Uploader sur Supabase Storage
async function uploadToSupabase(
  supabase: any,
  blob: Blob,
  fileName: string,
  bucket: string,
  folder: string
): Promise<string | null> {
  try {
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        cacheControl: '31536000',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    return null;
  }
}

// Enregistrer dans media_library
async function registerInMediaLibrary(
  supabase: any,
  publicUrl: string,
  fileName: string,
  filePath: string,
  bucketName: string,
  fileSize: number,
  mimeType: string,
  originalUrl: string,
  entityType: string,
  entityId: number
) {
  try {
    // Validation des données requises
    if (!publicUrl || !fileName || !filePath || !bucketName) {
      console.error('❌ Missing required fields for media_library:', {
        hasPublicUrl: !!publicUrl,
        hasFileName: !!fileName,
        hasFilePath: !!filePath,
        hasBucketName: !!bucketName,
        publicUrl,
        fileName,
        filePath,
        bucketName
      });
      return;
    }

    const mediaData = {
      file_name: fileName,
      file_path: filePath,
      public_url: publicUrl,
      bucket_name: bucketName,
      file_size: fileSize || 0,
      mime_type: mimeType || 'image/jpeg',
      is_optimized: false,
      original_wordpress_url: originalUrl || null,
      used_in_products: entityType === 'product' ? [entityId] : [],
      used_in_categories: entityType === 'category' ? [entityId] : [],
      usage_count: 1,
      is_orphan: false
    };

    console.log('📝 Inserting media into library:', {
      fileName,
      bucketName,
      entityType,
      entityId
    });

    const { error, data } = await supabase
      .from('media_library')
      .upsert(mediaData, { onConflict: 'file_path' })
      .select();

    if (error) {
      console.error('❌ Error registering in media_library:', {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code,
        mediaData
      });
    } else {
      console.log('✅ Media registered successfully:', fileName);
    }
  } catch (error) {
    console.error('❌ Exception in registerInMediaLibrary:', error);
  }
}

export async function POST(request: Request) {
  try {
    console.log('🚀 Starting migration process...');

    const { dryRun = false, entityType = 'all' } = await request.json();

    console.log('📋 Migration config:', { dryRun, entityType });

    const supabaseUrl = process.env.BYPASS_SUPABASE_URL!;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY!;
    const wordpressUrl = process.env.BYPASS_WORDPRESS_URL!;

    if (!supabaseUrl || !supabaseServiceKey || !wordpressUrl) {
      console.error('❌ Missing environment variables:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasWordpressUrl: !!wordpressUrl
      });
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    console.log('✅ Environment variables loaded');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const stats: MigrationStats = {
      totalProducts: 0,
      totalCategories: 0,
      migratedProducts: 0,
      migratedCategories: 0,
      errors: [],
      migratedFiles: []
    };

    // Migration des catégories
    if (entityType === 'all' || entityType === 'categories') {
      console.log('📂 Starting category migration...');
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, woocommerce_id, name, image_url')
        .not('image_url', 'is', null);

      if (catError) {
        console.error('❌ Error fetching categories:', catError);
        stats.errors.push(`Error fetching categories: ${catError.message}`);
      } else if (categories) {
        console.log(`✅ Found ${categories.length} categories`);
        stats.totalCategories = categories.length;

        for (const category of categories) {
          try {
            const imageUrl = category.image_url;

            // Vérifier si c'est une URL WordPress
            if (!imageUrl || !imageUrl.includes(wordpressUrl)) {
              console.log(`⏭️  Skipping category ${category.woocommerce_id}: Not a WordPress URL`);
              continue;
            }

            console.log(`📸 Migrating category ${category.woocommerce_id}: ${category.name}`);

          if (dryRun) {
            stats.migratedCategories++;
            stats.migratedFiles.push({
              originalUrl: imageUrl,
              newUrl: '[DRY RUN - Would be migrated]',
              entityType: 'category',
              entityId: category.woocommerce_id
            });
            continue;
          }

          // Télécharger l'image
          const blob = await downloadImage(imageUrl);
          if (!blob) {
            stats.errors.push(`Failed to download category ${category.woocommerce_id} image`);
            continue;
          }

          // Générer nom de fichier
          const fileName = generateFileName(imageUrl, 'category', category.woocommerce_id);

          // Uploader sur Supabase
          const newUrl = await uploadToSupabase(
            supabase,
            blob,
            fileName,
            'category-images',
            'categories'
          );

          if (!newUrl) {
            stats.errors.push(`Failed to upload category ${category.woocommerce_id} image`);
            continue;
          }

          // Mettre à jour la table categories
          const { error: updateError } = await supabase
            .from('categories')
            .update({ image_url: newUrl })
            .eq('id', category.id);

          if (updateError) {
            stats.errors.push(`Failed to update category ${category.woocommerce_id}: ${updateError.message}`);
            continue;
          }

          // Enregistrer dans media_library
          await registerInMediaLibrary(
            supabase,
            newUrl,
            fileName,
            `categories/${fileName}`,
            'category-images',
            blob.size,
            blob.type,
            imageUrl,
            'category',
            category.woocommerce_id
          );

            stats.migratedCategories++;
            stats.migratedFiles.push({
              originalUrl: imageUrl,
              newUrl: newUrl,
              entityType: 'category',
              entityId: category.woocommerce_id
            });

            console.log(`✅ Migrated category ${category.woocommerce_id}`);
          } catch (categoryError: any) {
            console.error(`❌ Error migrating category ${category.woocommerce_id}:`, categoryError);
            stats.errors.push(`Category ${category.woocommerce_id}: ${categoryError.message}`);
          }
        }
      }
    }

    // Migration des produits
    if (entityType === 'all' || entityType === 'products') {
      console.log('📦 Starting product migration...');

      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, woocommerce_id, name, image_url')
        .not('image_url', 'is', null);

      if (prodError) {
        console.error('❌ Error fetching products:', prodError);
        stats.errors.push(`Error fetching products: ${prodError.message}`);
      } else if (products) {
        console.log(`✅ Found ${products.length} products`);
        stats.totalProducts = products.length;

        for (const product of products) {
          try {
            const imageUrl = product.image_url;

            // Vérifier si c'est une URL WordPress
            if (!imageUrl || !imageUrl.includes(wordpressUrl)) {
              console.log(`⏭️  Skipping product ${product.woocommerce_id}: Not a WordPress URL`);
              continue;
            }

            console.log(`📸 Migrating product ${product.woocommerce_id}: ${product.name}`);

          if (dryRun) {
            stats.migratedProducts++;
            stats.migratedFiles.push({
              originalUrl: imageUrl,
              newUrl: '[DRY RUN - Would be migrated]',
              entityType: 'product',
              entityId: product.woocommerce_id
            });
            continue;
          }

          // Télécharger l'image
          const blob = await downloadImage(imageUrl);
          if (!blob) {
            stats.errors.push(`Failed to download product ${product.woocommerce_id} image`);
            continue;
          }

          // Générer nom de fichier
          const fileName = generateFileName(imageUrl, 'product', product.woocommerce_id);

          // Uploader sur Supabase
          const newUrl = await uploadToSupabase(
            supabase,
            blob,
            fileName,
            'product-images',
            'products'
          );

          if (!newUrl) {
            stats.errors.push(`Failed to upload product ${product.woocommerce_id} image`);
            continue;
          }

          // Mettre à jour la table products
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: newUrl })
            .eq('id', product.id);

          if (updateError) {
            stats.errors.push(`Failed to update product ${product.woocommerce_id}: ${updateError.message}`);
            continue;
          }

          // Enregistrer dans media_library
          await registerInMediaLibrary(
            supabase,
            newUrl,
            fileName,
            `products/${fileName}`,
            'product-images',
            blob.size,
            blob.type,
            imageUrl,
            'product',
            product.woocommerce_id
          );

            stats.migratedProducts++;
            stats.migratedFiles.push({
              originalUrl: imageUrl,
              newUrl: newUrl,
              entityType: 'product',
              entityId: product.woocommerce_id
            });

            console.log(`✅ Migrated product ${product.woocommerce_id}`);
          } catch (productError: any) {
            console.error(`❌ Error migrating product ${product.woocommerce_id}:`, productError);
            stats.errors.push(`Product ${product.woocommerce_id}: ${productError.message}`);
          }
        }
      }
    }

    console.log('✅ Migration completed:', {
      totalCategories: stats.totalCategories,
      migratedCategories: stats.migratedCategories,
      totalProducts: stats.totalProducts,
      migratedProducts: stats.migratedProducts,
      errorCount: stats.errors.length
    });

    return NextResponse.json({
      success: true,
      dryRun,
      stats
    });

  } catch (error: any) {
    console.error('❌ FATAL Migration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      error
    });
    return NextResponse.json(
      {
        error: error.message || 'Migration failed',
        details: error.stack,
        type: error.name
      },
      { status: 500 }
    );
  }
}

// GET pour vérifier le statut de la migration
export async function GET() {
  try {
    console.log('📊 Checking migration status...');

    const supabaseUrl = process.env.BYPASS_SUPABASE_URL!;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY!;
    const wordpressUrl = process.env.BYPASS_WORDPRESS_URL!;

    if (!supabaseUrl || !supabaseServiceKey || !wordpressUrl) {
      console.error('❌ Missing environment variables for status check');
      return NextResponse.json(
        { error: 'Missing configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Compter les images WordPress restantes
    console.log('🔍 Counting WordPress images in categories...');
    const { count: categoriesCount, error: catError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .like('image_url', `%${wordpressUrl}%`);

    if (catError) {
      console.error('❌ Error counting categories:', catError);
    }

    console.log('🔍 Counting WordPress images in products...');
    const { count: productsCount, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .like('image_url', `%${wordpressUrl}%`);

    if (prodError) {
      console.error('❌ Error counting products:', prodError);
    }

    // Statistiques de la médiathèque
    console.log('📈 Fetching media library stats...');
    const { data: mediaStats, error: statsError } = await supabase
      .from('media_library_stats')
      .select('*');

    if (statsError) {
      console.error('❌ Error fetching media stats:', statsError);
    }

    const result = {
      pendingMigration: {
        categories: categoriesCount || 0,
        products: productsCount || 0,
        total: (categoriesCount || 0) + (productsCount || 0)
      },
      mediaLibrary: mediaStats || []
    };

    console.log('✅ Status check completed:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ FATAL Status check error:', {
      message: error.message,
      stack: error.stack,
      error
    });
    return NextResponse.json(
      {
        error: error.message,
        pendingMigration: {
          categories: 0,
          products: 0,
          total: 0
        },
        mediaLibrary: []
      },
      { status: 500 }
    );
  }
}
