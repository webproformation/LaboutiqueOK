import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      live_stream_id,
      product_id,
      live_product_id,
      special_offer,
      promo_price,
      original_price,
      live_sku,
      product_name,
      product_image,
    } = await req.json();

    if (!live_stream_id || !product_id || !promo_price) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: live_stream_id, product_id, promo_price',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    console.log('[Edge Function] Calling add_product_to_live function...');

    const { data, error } = await supabaseAdmin.rpc('add_product_to_live', {
      p_live_stream_id: live_stream_id,
      p_product_id: product_id,
      p_live_product_id: live_product_id || null,
      p_special_offer: special_offer || null,
      p_promo_price: parseFloat(promo_price),
      p_original_price: original_price ? parseFloat(original_price) : null,
      p_live_sku: live_sku || null,
      p_product_name: product_name || null,
      p_product_image: product_image || null,
    });

    if (error) {
      console.error('[Edge Function] Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to add product to live',
          message: error.message,
          details: error,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Edge Function] Success:', data);

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Edge Function] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
