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
      is_active: productData.status === 'publish',
      stock_status: productData.stock_status || 'instock',
      updated_at: new Date().toISOString()
    };

    console.log('[Update Product] Status:', productData.status, '-> is_active:', updates.is_active);
    console.log('[Update Product] Featured:', productData.featured);

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

    if (productData.categories !== undefined) {
      updates.categories = productData.categories || [];
    }

    // 🎯 SAUVEGARDER LES ATTRIBUTS (nouveau système autonome)
    if (productData.attributes !== undefined) {
      updates.attributes = productData.attributes || [];
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

    // 🎯 SAUVEGARDER LES CATÉGORIES dans la table de liaison
    if (productData.categories && Array.isArray(productData.categories)) {
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', updatedProduct.id);

      if (productData.categories.length > 0) {
        const categoryLinks = productData.categories.map((cat: any, index: number) => ({
          product_id: updatedProduct.id,
          category_id: cat.id,
          is_primary: index === 0,
          display_order: index
        }));

        const { error: catError } = await supabase
          .from('product_categories')
          .insert(categoryLinks);

        if (catError) {
          console.error('[Update Product] Error saving categories:', catError);
        } else {
          console.log(`[Update Product] ✅ ${categoryLinks.length} catégories sauvegardées`);
        }
      }
    }

    // 🎯 SAUVEGARDER LES ATTRIBUTS dans la table de liaison
    if (productData.attributes && Array.isArray(productData.attributes)) {
      await supabase
        .from('product_attribute_values')
        .delete()
        .eq('product_id', updatedProduct.id);

      const attributeLinks: any[] = [];

      for (const attr of productData.attributes) {
        if (attr.terms && Array.isArray(attr.terms)) {
          for (const term of attr.terms) {
            if (term.id) {
              attributeLinks.push({
                product_id: updatedProduct.id,
                attribute_id: attr.id,
                term_id: term.id,
                is_variation: attr.variation || false
              });
            }
          }
        }
      }

      if (attributeLinks.length > 0) {
        const { error: attrError } = await supabase
          .from('product_attribute_values')
          .insert(attributeLinks);

        if (attrError) {
          console.error('[Update Product] Error saving attributes:', attrError);
        } else {
          console.log(`[Update Product] ✅ ${attributeLinks.length} attributs sauvegardés`);
        }
      }
    }

    // 🎯 SAUVEGARDER LES IMAGES dans la table de liaison
    if (productData.images && Array.isArray(productData.images)) {
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', updatedProduct.id);

      if (productData.images.length > 0) {
        const imageLinks = productData.images.map((img: any, index: number) => ({
          product_id: updatedProduct.id,
          image_url: img.src || img.url || '',
          alt_text: img.alt || img.name || '',
          display_order: index
        }));

        const { error: imgError } = await supabase
          .from('product_images')
          .insert(imageLinks);

        if (imgError) {
          console.error('[Update Product] Error saving images:', imgError);
        } else {
          console.log(`[Update Product] ✅ ${imageLinks.length} images sauvegardées`);
        }
      }
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
