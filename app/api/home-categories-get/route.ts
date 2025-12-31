import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('[Home Categories API] GET request started');

  try {
    const url = new URL(request.url);
    const active = url.searchParams.get('active') === 'true';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Home Categories API] Missing Supabase configuration');
      return NextResponse.json({ success: false, error: 'Missing configuration', data: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Home Categories API] Step 1: Fetching home_categories...');

    // Step 1: Fetch home_categories (simple query, no JOIN)
    let query = supabase
      .from('home_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (active) {
      query = query.eq('is_active', true);
    }

    const { data: homeCategories, error: homeCategoriesError } = await query;

    if (homeCategoriesError) {
      console.error('[Home Categories API] Error fetching home_categories:', {
        message: homeCategoriesError.message,
        details: homeCategoriesError.details,
        hint: homeCategoriesError.hint,
        code: homeCategoriesError.code
      });
      return NextResponse.json({
        success: false,
        error: homeCategoriesError.message,
        details: homeCategoriesError.details,
        hint: homeCategoriesError.hint,
        code: homeCategoriesError.code,
        data: []
      }, { status: 500 });
    }

    console.log(`[Home Categories API] Found ${homeCategories?.length || 0} home_categories`);

    if (!homeCategories || homeCategories.length === 0) {
      console.log('[Home Categories API] No home_categories found, returning empty array');
      return NextResponse.json({ success: true, data: [] });
    }

    // Step 2: Get unique category IDs
    const categoryIds = Array.from(new Set(
      homeCategories
        .map(hc => hc.category_id)
        .filter(id => id != null)
    ));

    console.log(`[Home Categories API] Step 2: Fetching ${categoryIds.length} categories...`);

    let categoriesData: any[] = [];

    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, woocommerce_id, name, slug, description, image_url, count')
        .in('id', categoryIds);

      if (categoriesError) {
        console.error('[Home Categories API] Error fetching categories:', {
          message: categoriesError.message,
          details: categoriesError.details,
          hint: categoriesError.hint,
          code: categoriesError.code
        });
        // Continue without category details
      } else {
        categoriesData = categories || [];
        console.log(`[Home Categories API] Fetched ${categoriesData.length} category details`);
      }
    }

    // Step 3: Combine data
    const formattedData = homeCategories.map(item => {
      const category = categoriesData.find(cat => cat.id === item.category_id);

      return {
        id: item.id,
        category_id: item.category_id,
        category_slug: item.category_slug || category?.slug || '',
        category_name: item.category_name || category?.name || '',
        display_order: item.display_order,
        is_active: item.is_active,
        image_url: item.image_url || category?.image_url || null,
        description: item.description || category?.description || null,
        category: category || null
      };
    });

    console.log('[Home Categories API] Returning formatted data:', formattedData.length);

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('[Home Categories API] Unexpected error:', {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, categoryData, categoryId } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (action === 'create') {
      const { data, error } = await supabase
        .from('home_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        console.error('[Home Categories API] Error creating:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json({
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }, { status: 500 });
      }

      // Call webhook revalidator to clear PostgREST cache
      try {
        await fetch('https://qcqbtmvbvipsxwjlgjvk.supabase.co/functions/v1/webhook-revalidator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ table: 'home_categories', action: 'INSERT' })
        });
      } catch (webhookError) {
        console.error('[Home Categories API] Webhook error (non-fatal):', webhookError);
      }

      return NextResponse.json(data);
    }

    if (action === 'update') {
      if (!categoryId) {
        return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('home_categories')
        .update(categoryData)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        console.error('[Home Categories API] Error updating:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json({
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    if (action === 'delete') {
      if (!categoryId) {
        return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('home_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('[Home Categories API] Error deleting:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json({
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Home Categories API] Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      details: error?.details
    });
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      details: error?.details,
      hint: error?.hint,
      code: error?.code
    }, { status: 500 });
  }
}
