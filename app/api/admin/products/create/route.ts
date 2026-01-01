import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const {
      name,
      slug,
      description,
      short_description,
      regular_price,
      sale_price,
      stock_quantity,
      stock_status,
      category_id,
      image_url,
      images,
      is_active
    } = body;

    if (!name || !regular_price) {
      return NextResponse.json(
        { error: 'Le nom et le prix sont obligatoires' },
        { status: 400 }
      );
    }

    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (existingProduct) {
      const timestamp = Date.now();
      finalSlug = `${finalSlug}-${timestamp}`;
    }

    const productData: any = {
      name,
      slug: finalSlug,
      description: description || '',
      short_description: short_description || '',
      regular_price: parseFloat(regular_price),
      sale_price: sale_price ? parseFloat(sale_price) : null,
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : null,
      stock_status: stock_status || 'instock',
      category_id: category_id || null,
      image_url: image_url || null,
      images: images || [],
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (insertError) {
      console.error('[Create Product API] Insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: 'Produit créé avec succès'
    });

  } catch (error: any) {
    console.error('[Create Product API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
}
