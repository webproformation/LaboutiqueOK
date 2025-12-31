import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('[Admin Products API] GET request started');

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Admin Products API] Missing Supabase configuration');
      return NextResponse.json({
        success: false,
        error: 'Missing configuration',
        data: []
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Admin Products API] Step 1: Fetching products from database...');

    // Fetch products with all columns
    let query = supabase
      .from('products')
      .select(`
        id,
        woocommerce_id,
        name,
        slug,
        description,
        short_description,
        regular_price,
        sale_price,
        image_url,
        images,
        stock_status,
        stock_quantity,
        category_id,
        woocommerce_category_id,
        categories,
        tags,
        attributes,
        variations,
        is_featured,
        is_active,
        is_hidden_diamond,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (search.trim()) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      console.error('[Admin Products API] Error fetching products:', {
        message: productsError.message,
        details: productsError.details,
        hint: productsError.hint,
        code: productsError.code
      });
      return NextResponse.json({
        success: false,
        error: productsError.message,
        details: productsError.details,
        hint: productsError.hint,
        code: productsError.code,
        data: []
      }, { status: 500 });
    }

    console.log(`[Admin Products API] Found ${products?.length || 0} products`);

    if (!products || products.length === 0) {
      console.log('[Admin Products API] No products found, returning empty array');
      return NextResponse.json({ success: true, data: [] });
    }

    // Step 2: Get all unique category IDs from the categories jsonb field
    const allCategoryIds = new Set<number>();
    products.forEach(product => {
      // Extract WooCommerce category IDs from the categories jsonb array
      if (Array.isArray(product.categories)) {
        product.categories.forEach((cat: any) => {
          if (cat && cat.id) {
            allCategoryIds.add(cat.id);
          }
        });
      }
    });

    const categoryIdsArray = Array.from(allCategoryIds);
    console.log(`[Admin Products API] Step 2: Fetching ${categoryIdsArray.length} unique categories...`);

    let categoriesData: any[] = [];

    if (categoryIdsArray.length > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, woocommerce_id, name, slug')
        .in('woocommerce_id', categoryIdsArray);

      if (categoriesError) {
        console.error('[Admin Products API] Error fetching categories:', {
          message: categoriesError.message,
          details: categoriesError.details
        });
        // Continue without category details
      } else {
        categoriesData = categories || [];
        console.log(`[Admin Products API] Fetched ${categoriesData.length} category details`);
      }
    }

    // Step 3: Combine data - add category names to products
    const productsWithCategories = products.map(product => {
      const categoryNames: string[] = [];
      const matchedCategories: any[] = [];

      // Extract category IDs from the product's categories jsonb field
      if (Array.isArray(product.categories)) {
        product.categories.forEach((cat: any) => {
          if (cat && cat.id) {
            const matchedCategory = categoriesData.find(c => c.woocommerce_id === cat.id);
            if (matchedCategory) {
              categoryNames.push(matchedCategory.name);
              matchedCategories.push(matchedCategory);
            }
          }
        });
      }

      return {
        ...product,
        category_names: categoryNames,
        matched_categories: matchedCategories
      };
    });

    console.log('[Admin Products API] Returning formatted data:', productsWithCategories.length);

    return NextResponse.json({
      success: true,
      data: productsWithCategories
    });

  } catch (error: any) {
    console.error('[Admin Products API] Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      data: []
    }, { status: 500 });
  }
}
