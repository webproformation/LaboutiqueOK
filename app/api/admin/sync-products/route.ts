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

export async function POST(request: Request) {
  try {
    const wcUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    const wcConsumerKey = process.env.WC_CONSUMER_KEY;
    const wcConsumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wcUrl || !wcConsumerKey || !wcConsumerSecret) {
      console.error('[Sync Products] Missing WooCommerce configuration');
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration WooCommerce manquante. Vérifiez vos variables d\'environnement.'
        },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Sync Products] Missing Supabase configuration');
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration Supabase manquante.'
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Sync Products] Starting product sync from WooCommerce...');

    // Counters for tracking progress
    let productsCreated = 0;
    let productsUpdated = 0;
    let totalProductsProcessed = 0;
    const errors: Array<{ productId: number; productName: string; error: string }> = [];

    // Pagination settings
    let page = 1;
    const perPage = 20; // Process 20 products at a time to avoid timeout
    let hasMore = true;
    let totalProducts = 0;

    // Helper function to process a single product
    const processProduct = async (wcProduct: WooCommerceProduct) => {
      try {
        const productData = {
          woocommerce_id: wcProduct.id,
          name: wcProduct.name,
          slug: wcProduct.slug,
          description: wcProduct.description || '',
          short_description: wcProduct.short_description || '',
          price: wcProduct.regular_price ? parseFloat(wcProduct.regular_price) : 0,
          sale_price: wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : null,
          image_url: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : null,
          gallery_images: wcProduct.images ? wcProduct.images.map(img => ({
            src: img.src,
            alt: img.alt || wcProduct.name
          })) : [],
          stock_status: wcProduct.stock_status || 'instock',
          stock_quantity: wcProduct.stock_quantity,
          categories: wcProduct.categories || [],
          tags: wcProduct.tags || [],
          attributes: wcProduct.attributes || [],
          variations: wcProduct.variations || [],
          is_active: wcProduct.status === 'publish',
          updated_at: new Date().toISOString()
        };

        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('woocommerce_id', wcProduct.id)
          .maybeSingle();

        if (existingProduct) {
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('woocommerce_id', wcProduct.id);

          if (updateError) {
            console.error(`[Sync Products] Error updating product ${wcProduct.id}:`, updateError);
            errors.push({
              productId: wcProduct.id,
              productName: wcProduct.name,
              error: updateError.message
            });
          } else {
            productsUpdated++;
          }
        } else {
          const { error: insertError } = await supabase
            .from('products')
            .insert([productData]);

          if (insertError) {
            console.error(`[Sync Products] Error inserting product ${wcProduct.id}:`, insertError);
            errors.push({
              productId: wcProduct.id,
              productName: wcProduct.name,
              error: insertError.message
            });
          } else {
            productsCreated++;
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

        console.log(`[Sync Products] Fetching page ${page} (${perPage} products per page)...`);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Sync Products] WooCommerce API error on page ${page}:`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText
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

          throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
        }

        const products: WooCommerceProduct[] = await response.json();

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
          if (totalPages && page >= parseInt(totalPages)) {
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

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée avec succès`,
      productsProcessed: totalProductsProcessed,
      totalProducts: totalProducts > 0 ? totalProducts : totalProductsProcessed,
      productsCreated,
      productsUpdated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('[Sync Products] Unexpected error:', {
      message: error?.message,
      stack: error?.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: `Erreur inattendue: ${error?.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
