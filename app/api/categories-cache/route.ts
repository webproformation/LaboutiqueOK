import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  console.log('[Categories Cache API] ===== GET REQUEST =====');

  try {
    const url = new URL(request.url);
    const parentOnly = url.searchParams.get('parent_only') === 'true';

    console.log('[Categories Cache API] Query params:', { parentOnly });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Categories Cache API] Missing Supabase configuration');
      return NextResponse.json([], { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Categories Cache API] Fetching from cache...');
    let query = supabase
      .from('woocommerce_categories_cache')
      .select('*')
      .order('name', { ascending: true });

    if (parentOnly) {
      query = query.eq('parent', 0);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Categories Cache API] Error fetching:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json([], { status: 200 });
    }

    console.log(`[Categories Cache API] Found ${data?.length || 0} categories in cache`);

    const formattedData = (data || []).map(cat => ({
      id: cat.category_id,
      name: cat.name,
      slug: cat.slug,
      parent: cat.parent,
      count: cat.count,
      image: cat.image || null,
      description: cat.description
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('[Categories Cache API] GET Unexpected error:', {
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  console.log('[Categories Cache API] ===== POST REQUEST STARTED =====');

  try {
    console.log('[Categories Cache API] Step 1: Parsing request body...');
    const body = await request.json().catch((parseError) => {
      console.error('[Categories Cache API] JSON parse error:', parseError);
      throw new Error('Invalid JSON body');
    });

    console.log('[Categories Cache API] Body received:', {
      action: body?.action,
      categoriesCount: Array.isArray(body?.categories) ? body.categories.length : 'not an array'
    });

    const { action, categories } = body;

    console.log('[Categories Cache API] Step 2: Checking environment variables...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[Categories Cache API] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Categories Cache API] Missing Supabase configuration');
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration Supabase manquante'
        },
        { status: 500 }
      );
    }

    console.log('[Categories Cache API] Step 3: Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (action === 'sync') {
      console.log('[Categories Cache API] Step 4: Validating categories array...');
      if (!Array.isArray(categories)) {
        console.error('[Categories Cache API] categories is not an array:', typeof categories);
        return NextResponse.json(
          {
            success: false,
            error: 'categories doit être un tableau'
          },
          { status: 400 }
        );
      }

      console.log(`[Categories Cache API] Step 5: Deleting old cache (clearing all entries)...`);
      const { error: deleteError } = await supabase
        .from('woocommerce_categories_cache')
        .delete()
        .gte('id', 0);

      if (deleteError) {
        console.error('[Categories Cache API] Error clearing cache:', {
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code
        });
      } else {
        console.log('[Categories Cache API] Cache cleared successfully');
      }

      console.log(`[Categories Cache API] Step 6: Formatting ${categories.length} categories...`);
      const formattedCategories = categories.map((cat, index) => {
        if (!cat.id || !cat.name || !cat.slug) {
          console.error(`[Categories Cache API] Invalid category at index ${index}:`, cat);
        }
        return {
          category_id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parent: cat.parent || 0,
          description: cat.description || '',
          image: cat.image || null,
          count: cat.count || 0,
          updated_at: new Date().toISOString()
        };
      });

      console.log(`[Categories Cache API] Step 7: Upserting ${formattedCategories.length} categories...`);
      const { data, error } = await supabase
        .from('woocommerce_categories_cache')
        .upsert(formattedCategories, {
          onConflict: 'category_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('[Categories Cache API] ===== ERROR DURING UPSERT =====');
        console.error('[Categories Cache API] Error syncing:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            details: error.details
          },
          { status: 500 }
        );
      }

      console.log(`[Categories Cache API] ===== SUCCESS =====`);
      console.log(`[Categories Cache API] ${formattedCategories.length} categories synced successfully`);

      return NextResponse.json({
        success: true,
        count: formattedCategories.length,
        message: `${formattedCategories.length} catégories synchronisées`,
        data: data
      });
    }

    console.error('[Categories Cache API] Invalid action:', action);
    return NextResponse.json(
      {
        success: false,
        error: 'Action invalide. Utilisez action="sync"'
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Categories Cache API] ===== CRITICAL ERROR =====');
    console.error('[Categories Cache API] Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });

    try {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || 'Erreur inconnue',
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message,
            name: error?.name,
            stack: error?.stack
          } : undefined
        },
        { status: 500 }
      );
    } catch (responseError) {
      console.error('[Categories Cache API] Failed to send error response:', responseError);
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
