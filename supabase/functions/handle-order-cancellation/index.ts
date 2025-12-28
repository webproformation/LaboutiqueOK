import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { userId, orderId } = await req.json();

    if (!userId || !orderId) {
      throw new Error('userId and orderId are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('cancelled_orders_count, blocked')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const newCount = (profile.cancelled_orders_count || 0) + 1;

    const updateData: any = {
      cancelled_orders_count: newCount,
    };

    if (newCount >= 3 && !profile.blocked) {
      updateData.blocked = true;
      updateData.blocked_reason = 'Bloqué automatiquement après 3 commandes annulées';
      updateData.blocked_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        cancelledCount: newCount,
        blocked: newCount >= 3,
        message: newCount >= 3 
          ? 'Client bloqué automatiquement après 3 annulations'
          : 'Annulation enregistrée',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in handle-order-cancellation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});