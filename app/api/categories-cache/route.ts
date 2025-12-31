import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parentOnly = url.searchParams.get('parent_only') === 'true';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    console.error('[Categories Cache API] Unexpected error:', {
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, categories } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration manquante' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (action === 'sync') {
      if (!Array.isArray(categories)) {
        return NextResponse.json(
          { error: 'categories doit être un tableau' },
          { status: 400 }
        );
      }

      const { error: deleteError } = await supabase
        .from('woocommerce_categories_cache')
        .delete()
        .neq('id', 0);

      if (deleteError) {
        console.error('[Categories Cache API] Error clearing cache:', deleteError);
      }

      const formattedCategories = categories.map(cat => ({
        category_id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parent: cat.parent || 0,
        description: cat.description || '',
        image: cat.image || null,
        count: cat.count || 0,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('woocommerce_categories_cache')
        .upsert(formattedCategories, {
          onConflict: 'category_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[Categories Cache API] Error syncing:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        count: formattedCategories.length,
        message: `${formattedCategories.length} catégories synchronisées`
      });
    }

    return NextResponse.json(
      { error: 'Action invalide' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Categories Cache API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
