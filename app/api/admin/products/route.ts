import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('[Admin Products API] GET request started');

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
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

    if (id) {
      console.log(`[Admin Products API] Fetching single product with id: ${id}`);

      let product = null;
      let productError = null;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isUUID) {
        const result = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        product = result.data;
        productError = result.error;
      } else if (!isNaN(parseInt(id))) {
        const result = await supabase
          .from('products')
          .select('*')
          .eq('woocommerce_id', parseInt(id))
          .maybeSingle();
        product = result.data;
        productError = result.error;
      }

      if (productError) {
        console.error('[Admin Products API] Error fetching product:', productError);
        return NextResponse.json({
          success: false,
          error: productError.message
        }, { status: 500 });
      }

      if (!product) {
        return NextResponse.json({
          success: false,
          error: 'Product not found'
        }, { status: 404 });
      }

      console.log('[Admin Products API] Product found:', product.name);
      return NextResponse.json(product);
    }

    console.log('[Admin Products API] Step 1: Fetching products from database...');

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
      } else {
        categoriesData = categories || [];
        console.log(`[Admin Products API] Fetched ${categoriesData.length} category details`);
      }
    }

    const productsWithCategories = products.map(product => {
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
