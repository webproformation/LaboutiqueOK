import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('[Update Product] POST request started');

  try {
    const body = await request.json();
    const { productId, productData } = body;

    if (!productId || !productData) {
      return NextResponse.json(
        { success: false, error: 'productId and productData required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

    const updates: any = {
      name: productData.name,
      slug: productData.slug || productData.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: productData.description || '',
      short_description: productData.short_description || '',
      is_active: productData.status === 'publish' || productData.is_active !== false,
      stock_status: productData.stock_status || 'instock',
      updated_at: new Date().toISOString()
    };

    if (productData.regular_price !== undefined) {
      updates.regular_price = productData.regular_price ? parseFloat(productData.regular_price) : null;
    }

    if (productData.sale_price !== undefined) {
      updates.sale_price = productData.sale_price ? parseFloat(productData.sale_price) : null;
    }

    if (productData.stock_quantity !== undefined) {
      updates.stock_quantity = productData.stock_quantity || null;
    }

    if (productData.images && Array.isArray(productData.images)) {
      updates.images = productData.images;
      if (productData.images.length > 0) {
        const firstImage = productData.images[0];
        updates.image_url = firstImage.src || firstImage.url || '';
      }
    }

    if (productData.category_id !== undefined) {
      updates.category_id = productData.category_id || null;
    }

    let updateQuery;
    if (isUUID) {
      updateQuery = supabase
        .from('products')
        .update(updates)
        .eq('id', productId);
    } else {
      updateQuery = supabase
        .from('products')
        .update(updates)
        .eq('woocommerce_id', parseInt(productId));
    }

    const { data: updatedProduct, error: updateError } = await updateQuery.select().single();

    if (updateError) {
      console.error('[Update Product] Error updating product:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    try {
      if (productData.featured === true) {
        const { error: featuredError } = await supabase
          .from('featured_products')
          .upsert({
            product_id: updatedProduct.id,
            display_order: 0,
            is_active: true
          }, {
            onConflict: 'product_id'
          });

        if (featuredError) {
          console.error('[Update Product] Error updating featured status:', featuredError);
        }
      } else if (productData.featured === false) {
        await supabase
          .from('featured_products')
          .delete()
          .eq('product_id', updatedProduct.id);
      }
    } catch (featuredErr: any) {
      console.error('[Update Product] Featured products error:', featuredErr);
    }

    console.log('[Update Product] Product updated successfully:', updatedProduct.name);

    return NextResponse.json({
      success: true,
      data: updatedProduct
    });

  } catch (error: any) {
    console.error('[Update Product] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
