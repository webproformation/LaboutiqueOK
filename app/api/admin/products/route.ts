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

    // Fetch products (simple query, no JOIN - same pattern as home-categories)
    let query = supabase
      .from('products')
      .select('*')
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

    // Step 2: Get unique category IDs (from category_id FK)
    const categoryIds = Array.from(new Set(
      products
        .map(p => p.category_id)
        .filter(id => id != null)
    ));

    console.log(`[Admin Products API] Step 2: Fetching ${categoryIds.length} categories...`);

    let categoriesData: any[] = [];

    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds);

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

    // Step 3: Combine data - add category name to each product
    const productsWithCategories = products.map(product => {
      // Find the category using the category_id FK
      const category = categoriesData.find(c => c.id === product.category_id);

      return {
        ...product,
        category_name: category ? category.name : null,
        category_slug: category ? category.slug : null
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
