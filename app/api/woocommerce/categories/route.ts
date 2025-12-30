import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

console.log('[Categories Route] Module loaded');

// Configuration pour augmenter le timeout sur Vercel
export const maxDuration = 30; // 30 secondes max

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  image?: {
    src: string;
    name?: string;
    alt?: string;
  } | null;
  [key: string]: any;
}

interface HierarchicalCategory extends Category {
  children?: HierarchicalCategory[];
}

function buildCategoryTree(categories: Category[]): HierarchicalCategory[] {
  const categoryMap = new Map<number, HierarchicalCategory>();
  const rootCategories: HierarchicalCategory[] = [];

  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach(cat => {
    const category = categoryMap.get(cat.id)!;
    if (cat.parent === 0) {
      rootCategories.push(category);
    } else {
      const parent = categoryMap.get(cat.parent);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(category);
      } else {
        rootCategories.push(category);
      }
    }
  });

  const cleanEmptyChildren = (cats: HierarchicalCategory[]) => {
    cats.forEach(cat => {
      if (cat.children && cat.children.length === 0) {
        delete cat.children;
      } else if (cat.children && cat.children.length > 0) {
        cleanEmptyChildren(cat.children);
      }
    });
  };

  cleanEmptyChildren(rootCategories);
  return rootCategories;
}

// Charger directement depuis WooCommerce sans toucher au cache Supabase
// (Le cache PostgREST est complètement bloqué)
async function loadCategoriesFromWooCommerce() {
  const wordpressUrl = process.env.WORDPRESS_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;

  console.log('[Load] Loading categories from WooCommerce...');
  console.log('[Load] WordPress URL:', wordpressUrl);
  console.log('[Load] Consumer Key exists:', !!consumerKey);
  console.log('[Load] Consumer Secret exists:', !!consumerSecret);

  if (!wordpressUrl || !consumerKey || !consumerSecret) {
    const missing = [];
    if (!wordpressUrl) missing.push('WORDPRESS_URL');
    if (!consumerKey) missing.push('WC_CONSUMER_KEY');
    if (!consumerSecret) missing.push('WC_CONSUMER_SECRET');
    throw new Error(`Missing WooCommerce configuration: ${missing.join(', ')}`);
  }

  const auth = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Charger toutes les catégories (paginer si nécessaire)
    const allCategories = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Max 10 pages
      const url = `${wordpressUrl}/wp-json/wc/v3/products/categories?per_page=100&page=${page}`;
      console.log(`[Load] Fetching page ${page}...`);

      const response = await fetch(url, {
        headers: {
          Authorization: auth,
          'User-Agent': 'NextJS-App'
        },
        signal: controller.signal,
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Load] WooCommerce API error:`, errorText);
        throw new Error(`WooCommerce API returned ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const categories = await response.json();
      console.log(`[Load] Page ${page}: ${categories.length} categories`);

      allCategories.push(...categories);

      // Vérifier s'il y a plus de pages
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      hasMore = page < totalPages;
      page++;
    }

    clearTimeout(timeoutId);

    console.log(`[Load] Total loaded: ${allCategories.length} categories`);

    if (allCategories.length === 0) {
      console.log('[Load] No categories found');
      return [];
    }

    // Retourner directement (pas de cache Supabase)
    return allCategories.map((cat: any) => ({
      category_id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent: cat.parent,
      description: cat.description || '',
      image: cat.image,
      count: cat.count || 0,
    }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('[Load] Timeout after 15s');
      throw new Error('WooCommerce connection timeout');
    }
    console.error('[Load] Error:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    console.log('[Categories API] GET request received');

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const action = searchParams.get('action');
    const refresh = searchParams.get('refresh') === 'true';
    const debug = searchParams.get('debug') === 'true';

    console.log('[Categories API] Action:', action, 'Refresh:', refresh, 'Debug:', debug);

    // Vérifier les variables d'environnement
    const wordpressUrl = process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      const missing = [];
      if (!wordpressUrl) missing.push('WORDPRESS_URL');
      if (!consumerKey) missing.push('WC_CONSUMER_KEY');
      if (!consumerSecret) missing.push('WC_CONSUMER_SECRET');

      console.error('[Categories API] Missing WooCommerce configuration:', missing.join(', '));

      // Return error details in debug mode
      if (debug) {
        return NextResponse.json({
          error: 'Missing WooCommerce configuration',
          missing: missing,
          debug: {
            wordpressUrl: wordpressUrl || 'NOT SET',
            hasConsumerKey: !!consumerKey,
            hasConsumerSecret: !!consumerSecret
          }
        }, { status: 500 });
      }

      // Return empty array to not break frontend
      return NextResponse.json([]);
    }

    // Charger directement depuis WooCommerce (bypass cache Supabase)
    console.log('[Categories API] Loading from WooCommerce...');

    try {
      const loaded = await loadCategoriesFromWooCommerce();

      if (!loaded || loaded.length === 0) {
        console.log('[Categories API] No categories found');
        const debugInfo = {
          message: 'No categories found in WooCommerce',
          wordpressUrl: process.env.WORDPRESS_URL,
          hasConsumerKey: !!process.env.WC_CONSUMER_KEY,
          hasConsumerSecret: !!process.env.WC_CONSUMER_SECRET
        };

        if (debug) {
          return NextResponse.json({ error: 'No categories found', debug: debugInfo });
        }
        return NextResponse.json([]);
      }

      console.log(`[Categories API] Loaded ${loaded.length} categories`);

      // Convertir au format attendu
      const categories: Category[] = loaded.map((cat: any) => ({
        id: cat.category_id,
        name: cat.name,
        slug: cat.slug,
        parent: cat.parent,
        description: cat.description || '',
        image: cat.image,
        count: cat.count || 0,
      }));

      // Retourner selon l'action demandée
      if (action === 'list') {
        return NextResponse.json(categories);
      }

      const tree = buildCategoryTree(categories);
      return NextResponse.json(tree);

    } catch (loadError: any) {
      console.error('[Categories API] Load failed:', loadError.message);

      const errorInfo = {
        error: loadError.message,
        stack: loadError.stack,
        wordpressUrl: process.env.WORDPRESS_URL,
        hasConsumerKey: !!process.env.WC_CONSUMER_KEY,
        hasConsumerSecret: !!process.env.WC_CONSUMER_SECRET,
        timestamp: new Date().toISOString()
      };

      // Return error details if debug=true
      if (debug) {
        return NextResponse.json(errorInfo, { status: 500 });
      }

      // Return empty array to not break frontend
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('[Categories API] Unexpected error:', error);
    // Return empty array instead of error to not break frontend
    return NextResponse.json([]);
  }
}

async function invalidateCache() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase.from('woocommerce_categories_cache').delete().neq('id', 0);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, categoryData } = body;

    const wordpressUrl = process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Missing WooCommerce configuration' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    if (action === 'create') {
      const createResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/categories`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        return NextResponse.json(
          { error: 'Failed to create category', details: errorData },
          { status: createResponse.status }
        );
      }

      const createdCategory = await createResponse.json();
      await invalidateCache();
      return NextResponse.json(createdCategory);
    }

    if (action === 'setup-morgane-categories') {
      const existingResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/categories?per_page=100`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!existingResponse.ok) {
        throw new Error(`WooCommerce API error: ${existingResponse.status}`);
      }

      const existingCategories = await existingResponse.json();

      let parentCategory = existingCategories.find(
        (cat: any) => cat.slug === 'les-looks-de-morgane'
      );

      if (!parentCategory) {
        const createParentResponse = await fetch(
          `${wordpressUrl}/wp-json/wc/v3/products/categories`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Les looks de Morgane',
              slug: 'les-looks-de-morgane',
            }),
          }
        );

        if (!createParentResponse.ok) {
          const errorData = await createParentResponse.json();
          throw new Error(`Failed to create parent category: ${JSON.stringify(errorData)}`);
        }

        parentCategory = await createParentResponse.json();
      }

      const subCategories = [
        { name: "L'ambiance de la semaine", slug: 'lambiance-de-la-semaine' },
        { name: 'Les coups de coeur de Morgane', slug: 'les-coups-de-coeur-de-morgane' },
        { name: 'Le look de la semaine by Morgane', slug: 'le-look-de-la-semaine-by-morgane' },
      ];

      const createdCategories = [parentCategory];

      for (const subCat of subCategories) {
        const existingSubCat = existingCategories.find(
          (cat: any) => cat.slug === subCat.slug
        );

        if (!existingSubCat) {
          const createSubCatResponse = await fetch(
            `${wordpressUrl}/wp-json/wc/v3/products/categories`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: subCat.name,
                slug: subCat.slug,
                parent: parentCategory.id,
              }),
            }
          );

          if (!createSubCatResponse.ok) {
            const errorData = await createSubCatResponse.json();
            console.error(`Failed to create ${subCat.name}:`, errorData);
          } else {
            const createdSubCat = await createSubCatResponse.json();
            createdCategories.push(createdSubCat);
          }
        } else {
          createdCategories.push(existingSubCat);
        }
      }

      await invalidateCache();
      return NextResponse.json({
        success: true,
        categories: createdCategories,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/woocommerce/categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action, categoryId, categoryData } = body;

    const wordpressUrl = process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Missing WooCommerce configuration' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    if (action === 'update') {
      if (!categoryId) {
        return NextResponse.json(
          { error: 'Category ID is required' },
          { status: 400 }
        );
      }

      const updateResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/categories/${categoryId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        return NextResponse.json(
          { error: 'Failed to update category', details: errorData },
          { status: updateResponse.status }
        );
      }

      const updatedCategory = await updateResponse.json();
      await invalidateCache();
      return NextResponse.json(updatedCategory);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PUT /api/woocommerce/categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { action, categoryId } = body;

    const wordpressUrl = process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Missing WooCommerce configuration' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    if (action === 'delete') {
      if (!categoryId) {
        return NextResponse.json(
          { error: 'Category ID is required' },
          { status: 400 }
        );
      }

      const deleteResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/categories/${categoryId}?force=true`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        return NextResponse.json(
          { error: 'Failed to delete category', details: errorData },
          { status: deleteResponse.status }
        );
      }

      const deletedCategory = await deleteResponse.json();
      await invalidateCache();
      return NextResponse.json(deletedCategory);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/woocommerce/categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
