import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  regular_price: string;
  sale_price: string;
  images: Array<{ src: string; alt?: string }>;
  stock_status: string;
  stock_quantity: number | null;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  attributes: Array<any>;
  variations: Array<number>;
  status: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: Request) {
  console.log('[Sync Products] GET request - Configuration check');

  try {
    const wcUrl = process.env.WORDPRESS_URL;
    const wcConsumerKey = process.env.WC_CONSUMER_KEY;
    const wcConsumerSecret = process.env.WC_CONSUMER_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return NextResponse.json({
      success: true,
      configuration: {
        wordpress_url: wcUrl || 'MISSING',
        wc_consumer_key: wcConsumerKey ? `${wcConsumerKey.substring(0, 10)}...` : 'MISSING',
        wc_consumer_secret: wcConsumerSecret ? '***CONFIGURED***' : 'MISSING',
        supabase_url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
        supabase_service_key: supabaseServiceKey ? '***CONFIGURED***' : 'MISSING',
      },
      ready: !!(wcUrl && wcConsumerKey && wcConsumerSecret && supabaseUrl && supabaseServiceKey)
    });
  } catch (error: any) {
    console.error('[Sync Products] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('[Sync Products] ===== STARTING SYNC REQUEST =====');

  try {
    console.log('[Sync Products] Step 1: Checking environment variables...');

    const wcUrl = process.env.WORDPRESS_URL;
    const wcConsumerKey = process.env.WC_CONSUMER_KEY;
    const wcConsumerSecret = process.env.WC_CONSUMER_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[Sync Products] Environment check:', {
      wcUrl: wcUrl || 'MISSING',
      hasWcConsumerKey: !!wcConsumerKey,
      hasWcConsumerSecret: !!wcConsumerSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey
    });

    if (!wcUrl || !wcConsumerKey || !wcConsumerSecret) {
      console.error('[Sync Products] Missing WooCommerce configuration:', {
        wcUrl: !!wcUrl,
        wcConsumerKey: !!wcConsumerKey,
        wcConsumerSecret: !!wcConsumerSecret
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration WooCommerce manquante. Vérifiez WC_CONSUMER_KEY et WC_CONSUMER_SECRET dans vos variables d\'environnement.'
        },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Sync Products] Missing Supabase configuration:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration Supabase manquante. Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.'
        },
        { status: 500 }
      );
    }

    console.log('[Sync Products] Step 2: Creating Supabase client...');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Sync Products] Step 3: Verifying products table exists...');

    try {
      const { error: tableCheckError } = await supabase
        .from('products')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error('[Sync Products] Products table check failed:', tableCheckError);
        return NextResponse.json(
          {
            success: false,
            error: 'La table "products" n\'existe pas dans Supabase. Veuillez créer la table d\'abord.',
            details: tableCheckError.message
          },
          { status: 500 }
        );
      }
    } catch (tableError: any) {
      console.error('[Sync Products] Error checking products table:', tableError);
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de vérifier la table products dans Supabase',
          details: tableError?.message
        },
        { status: 500 }
      );
    }

    console.log('[Sync Products] Step 4: Starting product sync from WooCommerce...');

    // Counters for tracking progress
    let productsCreated = 0;
    let productsUpdated = 0;
    let totalProductsProcessed = 0;
    const errors: Array<{ productId: number; productName: string; error: string }> = [];

    // Pagination settings - LIMIT TO 3 PRODUCTS FOR TESTING
    let page = 1;
    const perPage = 3; // TEST MODE: Process only 3 products at a time
    let hasMore = true;
    let totalProducts = 0;
    const MAX_PAGES = 1; // TEST MODE: Process only 1 page

    // Helper function to process a single product
    const processProduct = async (wcProduct: WooCommerceProduct) => {
      try {
        // Extract primary category (first category) and find its UUID in categories table
        let categoryId: string | null = null;
        let wooCategoryId: number | null = null;

        if (wcProduct.categories && wcProduct.categories.length > 0) {
          wooCategoryId = wcProduct.categories[0].id;

          // Find category UUID from categories table
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('woocommerce_id', wooCategoryId)
            .maybeSingle();

          if (categoryData) {
            categoryId = categoryData.id;
            console.log(`[Sync Products] Product ${wcProduct.id}: Linked to category UUID ${categoryId} (WooCommerce ID: ${wooCategoryId})`);
          } else {
            console.log(`[Sync Products] Product ${wcProduct.id}: Category ${wooCategoryId} not found in categories table (will remain null)`);
          }
        }

        const productData = {
          woocommerce_id: wcProduct.id,
          name: wcProduct.name,
          slug: wcProduct.slug,
          description: wcProduct.description || '',
          short_description: wcProduct.short_description || '',
          regular_price: wcProduct.regular_price ? parseFloat(wcProduct.regular_price) : 0,
          sale_price: wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : null,
          image_url: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : null,
          images: Array.isArray(wcProduct.images) ? wcProduct.images.map(img => ({
            src: img.src,
            alt: img.alt || wcProduct.name
          })) : [],
          stock_status: wcProduct.stock_status || 'instock',
          stock_quantity: wcProduct.stock_quantity,
          category_id: categoryId,
          woocommerce_category_id: wooCategoryId,
          categories: wcProduct.categories || [],
          tags: wcProduct.tags || [],
          attributes: wcProduct.attributes || [],
          variations: wcProduct.variations || [],
          is_active: wcProduct.status === 'publish',
          updated_at: new Date().toISOString()
        };

        // Use upsert with onConflict to handle both insert and update in one query
        const { data: upsertedProduct, error: upsertError } = await supabase
          .from('products')
          .upsert(productData, {
            onConflict: 'woocommerce_id',
            ignoreDuplicates: false
          })
          .select('id, created_at')
          .single();

        if (upsertError) {
          console.error(`[Sync Products] Error upserting product ${wcProduct.id}:`, {
            message: upsertError.message,
            details: upsertError.details,
            hint: upsertError.hint,
            code: upsertError.code
          });
          errors.push({
            productId: wcProduct.id,
            productName: wcProduct.name,
            error: `${upsertError.message} (Code: ${upsertError.code})${upsertError.hint ? ` - Hint: ${upsertError.hint}` : ''}${upsertError.details ? ` - Details: ${upsertError.details}` : ''}`
          });
        } else {
          console.log(`[Sync Products] Successfully upserted product ${wcProduct.id} (${wcProduct.name})`);
          // Check if it was created (created_at is recent) or updated
          const isNewlyCreated = upsertedProduct &&
            new Date(upsertedProduct.created_at).getTime() > Date.now() - 5000;

          if (isNewlyCreated) {
            productsCreated++;
          } else {
            productsUpdated++;
          }
        }
      } catch (productError: any) {
        console.error(`[Sync Products] Unexpected error processing product ${wcProduct.id}:`, productError);
        errors.push({
          productId: wcProduct.id,
          productName: wcProduct.name,
          error: productError.message || 'Unknown error'
        });
      }
    };

    // Fetch and process products page by page
    while (hasMore) {
      try {
        const apiUrl = `${wcUrl}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}&consumer_key=${wcConsumerKey}&consumer_secret=${wcConsumerSecret}`;

        console.log(`[Sync Products] Step 5.${page}: Fetching page ${page} (${perPage} products per page)...`);
        console.log(`[Sync Products] Full API URL: ${wcUrl}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}&consumer_key=${wcConsumerKey?.substring(0, 10)}...`);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch((fetchError) => {
          console.error('[Sync Products] Network error during fetch:', fetchError);
          throw new Error(`Erreur réseau: ${fetchError.message}`);
        });

        console.log(`[Sync Products] Response status: ${response.status}`);
        console.log(`[Sync Products] Response headers:`, {
          contentType: response.headers.get('content-type'),
          total: response.headers.get('X-WP-Total'),
          totalPages: response.headers.get('X-WP-TotalPages')
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Sync Products] WooCommerce API error on page ${page}:`, {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            bodyPreview: errorText.substring(0, 500)
          });

          if (response.status === 401) {
            return NextResponse.json(
              {
                success: false,
                error: 'Authentification WooCommerce échouée. Vérifiez vos clés API.',
                productsProcessed: totalProductsProcessed,
                productsCreated,
                productsUpdated
              },
              { status: 401 }
            );
          }

          throw new Error(`WooCommerce API error: ${response.status} - ${errorText.substring(0, 200)}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('[Sync Products] Expected JSON but received:', {
            contentType,
            bodyPreview: textResponse.substring(0, 500)
          });
          throw new Error(`La réponse n'est pas du JSON. Type reçu: ${contentType}. Corps: ${textResponse.substring(0, 200)}`);
        }

        let products: WooCommerceProduct[];
        try {
          products = await response.json();
        } catch (jsonError: any) {
          const textResponse = await response.text();
          console.error('[Sync Products] JSON parse error:', jsonError);
          console.error('[Sync Products] Response body:', textResponse.substring(0, 1000));
          throw new Error(`Impossible de parser la réponse JSON: ${jsonError.message}. Corps: ${textResponse.substring(0, 200)}`);
        }

        // Get total products from headers on first page
        if (page === 1) {
          const total = response.headers.get('X-WP-Total');
          if (total) {
            totalProducts = parseInt(total);
            console.log(`[Sync Products] Total products to sync: ${totalProducts}`);
          }
        }

        if (products.length === 0) {
          hasMore = false;
          console.log('[Sync Products] No more products to fetch');
        } else {
          // Process this batch of products immediately
          console.log(`[Sync Products] Processing ${products.length} products from page ${page}...`);

          for (const wcProduct of products) {
            await processProduct(wcProduct);
            totalProductsProcessed++;
          }

          console.log(`[Sync Products] Progress: ${totalProductsProcessed}${totalProducts > 0 ? `/${totalProducts}` : ''} products processed`);

          // Check if there are more pages
          const totalPages = response.headers.get('X-WP-TotalPages');

          // TEST MODE: Stop after MAX_PAGES
          if (page >= MAX_PAGES) {
            hasMore = false;
            console.log(`[Sync Products] TEST MODE: Stopping after ${MAX_PAGES} page(s)`);
          } else if (totalPages && page >= parseInt(totalPages)) {
            hasMore = false;
            console.log('[Sync Products] All pages processed');
          } else {
            page++;

            // Rate limiting: wait 500ms before next API call
            console.log('[Sync Products] Waiting 500ms before next request (rate limiting)...');
            await sleep(500);
          }
        }
      } catch (fetchError: any) {
        console.error(`[Sync Products] Error fetching page ${page}:`, fetchError);
        return NextResponse.json(
          {
            success: false,
            error: `Erreur lors de la récupération des produits (page ${page}): ${fetchError.message}`,
            productsProcessed: totalProductsProcessed,
            productsCreated,
            productsUpdated,
            errors: errors.length > 0 ? errors : undefined
          },
          { status: 500 }
        );
      }
    }

    console.log(`[Sync Products] Sync completed:`, {
      total: totalProductsProcessed,
      created: productsCreated,
      updated: productsUpdated,
      errors: errors.length
    });

    // DEBUG: Verify products were actually created in database
    const { count: dbCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log(`[Sync Products] Database verification: ${dbCount} products in database`);

    if (countError) {
      console.error('[Sync Products] Error verifying database count:', countError);
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée - TEST MODE (${perPage} produits max)`,
      productsProcessed: totalProductsProcessed,
      totalProducts: totalProducts > 0 ? totalProducts : totalProductsProcessed,
      productsCreated,
      productsUpdated,
      databaseCount: dbCount || 0,
      errors: errors.length > 0 ? errors : [],
      debugInfo: {
        testMode: true,
        maxProductsPerPage: perPage,
        maxPages: MAX_PAGES,
        hasErrors: errors.length > 0,
        errorDetails: errors
      }
    });

  } catch (error: any) {
    console.error('[Sync Products] ===== CRITICAL ERROR =====');
    console.error('[Sync Products] Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });

    try {
      return NextResponse.json(
        {
          success: false,
          error: `Erreur inattendue: ${error?.message || 'Unknown error'}`,
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message,
            name: error?.name,
            stack: error?.stack
          } : undefined
        },
        { status: 500 }
      );
    } catch (responseError) {
      console.error('[Sync Products] Failed to send error response:', responseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Critical error: Unable to format response'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
