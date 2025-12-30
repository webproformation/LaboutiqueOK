import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData = await req.json();
    const { orderData, localOrderId } = requestData;

    const WORDPRESS_URL = Deno.env.get("WORDPRESS_URL");
    const WC_CONSUMER_KEY = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
    const WC_CONSUMER_SECRET = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");

    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return new Response(
        JSON.stringify({ error: "WooCommerce configuration manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auth = btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`);

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/orders`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create order in WooCommerce: ${response.statusText}`);
    }

    const woocommerceOrder = await response.json();

    await supabaseClient.from("orders").update({ 
      woocommerce_order_id: woocommerceOrder.id,
      woocommerce_order_number: woocommerceOrder.number,
    }).eq("id", localOrderId);

    return new Response(
      JSON.stringify({ 
        success: true,
        woocommerce_order_id: woocommerceOrder.id,
        woocommerce_order_number: woocommerceOrder.number,
        order: woocommerceOrder,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
