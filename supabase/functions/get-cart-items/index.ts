import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { db: { schema: 'public' } }
    );

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');

      if (!userId) {
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify(data || []),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, ...data } = body;

      switch (action) {
        case 'add': {
          const { user_id, product_id, variation_id, ...itemData } = data;

          const { error } = await supabase
            .from('cart_items')
            .upsert({
              user_id,
              product_id,
              variation_id,
              ...itemData
            }, {
              onConflict: 'user_id,product_id,variation_id',
              ignoreDuplicates: false
            });

          if (error) throw error;

          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'update': {
          const { id, ...updateData } = data;
          const { error } = await supabase
            .from('cart_items')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;

          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'delete': {
          const { id } = data;
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', id);

          if (error) throw error;

          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-cart-items:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});