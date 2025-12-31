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
      return NextResponse.json({ success: true, categories: [] }, { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Categories Cache API] Fetching from categories table...');
    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (parentOnly) {
      query = query.is('woocommerce_parent_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Categories Cache API] ===== ERROR FETCHING =====');
      console.error('[Categories Cache API] Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ success: true, categories: [] }, { status: 200 });
    }

    console.log(`[Categories Cache API] Found ${data?.length || 0} categories in cache`);

    const formattedData = Array.isArray(data) ? data.map(cat => ({
      id: cat.woocommerce_id,
      name: cat.name,
      slug: cat.slug,
      parent: cat.woocommerce_parent_id,
      count: cat.count,
      image: cat.image_url ? { src: cat.image_url } : null,
      image_url: cat.image_url,
      description: cat.description
    })) : [];

    return NextResponse.json({
      success: true,
      categories: formattedData,
      count: formattedData.length
    });
  } catch (error: any) {
    console.error('[Categories Cache API] ===== GET CRITICAL ERROR =====');
    console.error('[Categories Cache API] GET Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json({ success: true, categories: [] }, { status: 200 });
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
      console.error('[Categories Sync Error]: Missing Supabase configuration');
      return NextResponse.json(
        {
          success: false,
          categories: [],
          error: 'Configuration Supabase manquante'
        },
        { status: 200 }
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
        console.error('[Categories Sync Error]: categories is not an array:', typeof categories);
        return NextResponse.json(
          {
            success: false,
            categories: [],
            error: 'categories doit être un tableau'
          },
          { status: 200 }
        );
      }

      console.log(`[Categories Cache API] Step 5: Formatting ${categories.length} categories for table 'categories'...`);
      const formattedCategories = Array.isArray(categories) ? categories.map((cat, index) => {
        if (!cat.id || !cat.name || !cat.slug) {
          console.error(`[Categories Cache API] Invalid category at index ${index}:`, cat);
        }

        // Extraction sécurisée de l'URL de l'image
        let imageUrl = null;
        if (cat.image) {
          if (typeof cat.image === 'string') {
            imageUrl = cat.image;
          } else if (cat.image.src) {
            imageUrl = cat.image.src;
          }
        }

        return {
          woocommerce_id: cat.id,
          name: cat.name,
          slug: cat.slug,
          woocommerce_parent_id: cat.parent && cat.parent !== 0 ? cat.parent : null,
          description: cat.description || '',
          image_url: imageUrl,
          count: cat.count || 0,
          is_active: true,
          updated_at: new Date().toISOString()
        };
      }) : [];

      console.log(`[Categories Cache API] Step 6: Sample category data:`, formattedCategories[0]);

      console.log(`[Categories Cache API] Step 7: Upserting ${formattedCategories.length} categories into 'categories' table...`);

      const { data, error } = await supabase
        .from('categories')
        .upsert(formattedCategories, {
          onConflict: 'woocommerce_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('[Categories Sync Error]: ===== ERROR DURING UPSERT =====');
        console.error('[Categories Sync Error]:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('[Categories Sync Error]: Sample formatted category:', formattedCategories[0]);
        return NextResponse.json(
          {
            success: false,
            categories: [],
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          { status: 200 }
        );
      }

      console.log(`[Categories Cache API] ===== SUCCESS =====`);
      console.log(`[Categories Cache API] ${formattedCategories.length} categories synced successfully to 'categories' table`);

      return NextResponse.json({
        success: true,
        count: formattedCategories.length,
        inserted: data?.length || 0,
        message: `${formattedCategories.length} catégories synchronisées`,
        data: data
      });
    }

    console.error('[Categories Sync Error]: Invalid action:', action);
    return NextResponse.json(
      {
        success: false,
        categories: [],
        error: 'Action invalide. Utilisez action="sync"'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Categories Sync Error]: ===== CRITICAL ERROR =====');
    console.error('[Categories Sync Error]:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });

    try {
      return NextResponse.json(
        {
          success: false,
          categories: [],
          error: error?.message || 'Erreur inconnue',
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message,
            name: error?.name,
            stack: error?.stack
          } : undefined
        },
        { status: 200 }
      );
    } catch (responseError) {
      console.error('[Categories Sync Error]: Failed to send error response:', responseError);
      return new Response(
        JSON.stringify({
          success: false,
          categories: [],
          error: 'Critical error: Unable to format response'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
