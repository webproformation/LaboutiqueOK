import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, updates } = body;

    if (!productId || !updates) {
      return NextResponse.json(
        { success: false, error: 'productId et updates requis' },
        { status: 400 }
      );
    }

    const wcUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    const wcConsumerKey = process.env.WC_CONSUMER_KEY;
    const wcConsumerSecret = process.env.WC_CONSUMER_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!wcUrl || !wcConsumerKey || !wcConsumerSecret) {
      return NextResponse.json(
        { success: false, error: 'Configuration WooCommerce manquante' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get product from Supabase to find woocommerce_id
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('woocommerce_id')
      .eq('id', productId)
      .maybeSingle();

    if (fetchError || !product) {
      return NextResponse.json(
        { success: false, error: 'Produit non trouvé dans Supabase' },
        { status: 404 }
      );
    }

    const woocommerceId = product.woocommerce_id;

    // Prepare updates for Supabase
    const supabaseUpdates: any = {
      updated_at: new Date().toISOString()
    };

    // Prepare updates for WooCommerce
    const woocommerceUpdates: any = {};

    // Map field names
    if (updates.name !== undefined) {
      supabaseUpdates.name = updates.name;
      woocommerceUpdates.name = updates.name;
    }

    if (updates.price !== undefined) {
      supabaseUpdates.price = updates.price;
      woocommerceUpdates.regular_price = String(updates.price);
    }

    if (updates.sale_price !== undefined) {
      supabaseUpdates.sale_price = updates.sale_price;
      woocommerceUpdates.sale_price = updates.sale_price ? String(updates.sale_price) : '';
    }

    if (updates.stock_quantity !== undefined) {
      supabaseUpdates.stock_quantity = updates.stock_quantity;
      woocommerceUpdates.stock_quantity = updates.stock_quantity;
    }

    if (updates.stock_status !== undefined) {
      supabaseUpdates.stock_status = updates.stock_status;
      woocommerceUpdates.stock_status = updates.stock_status;
    }

    if (updates.description !== undefined) {
      supabaseUpdates.description = updates.description;
      woocommerceUpdates.description = updates.description;
    }

    if (updates.short_description !== undefined) {
      supabaseUpdates.short_description = updates.short_description;
      woocommerceUpdates.short_description = updates.short_description;
    }

    if (updates.is_active !== undefined) {
      supabaseUpdates.is_active = updates.is_active;
      woocommerceUpdates.status = updates.is_active ? 'publish' : 'draft';
    }

    // Update Supabase first
    const { error: updateError } = await supabase
      .from('products')
      .update(supabaseUpdates)
      .eq('id', productId);

    if (updateError) {
      console.error('[Update Product] Supabase error:', updateError);
      return NextResponse.json(
        { success: false, error: `Erreur Supabase: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Update WooCommerce if there are changes
    if (Object.keys(woocommerceUpdates).length > 0) {
      try {
        const apiUrl = `${wcUrl}/wp-json/wc/v3/products/${woocommerceId}?consumer_key=${wcConsumerKey}&consumer_secret=${wcConsumerSecret}`;

        const wcResponse = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(woocommerceUpdates),
        });

        if (!wcResponse.ok) {
          const errorText = await wcResponse.text();
          console.error('[Update Product] WooCommerce error:', {
            status: wcResponse.status,
            body: errorText
          });

          // Don't fail the whole operation if WooCommerce sync fails
          // The Supabase update was successful
          return NextResponse.json({
            success: true,
            warning: 'Produit mis à jour dans Supabase mais erreur WooCommerce',
            woocommerceError: errorText
          });
        }

        console.log('[Update Product] Successfully updated both Supabase and WooCommerce');
      } catch (wcError: any) {
        console.error('[Update Product] WooCommerce sync error:', wcError);
        return NextResponse.json({
          success: true,
          warning: 'Produit mis à jour dans Supabase mais erreur de connexion WooCommerce'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Produit mis à jour avec succès'
    });

  } catch (error: any) {
    console.error('[Update Product] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Erreur inattendue: ${error?.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
