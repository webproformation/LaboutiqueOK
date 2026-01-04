import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { email, first_name, last_name } = await req.json();

    const WORDPRESS_URL = Deno.env.get("WORDPRESS_URL");
    const WC_CONSUMER_KEY = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
    const WC_CONSUMER_SECRET = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");

    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      throw new Error("WooCommerce configuration manquante");
    }

    const authString = btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`);
    const customerData = {
      email,
      first_name,
      last_name,
      username: email.split('@')[0],
    };

    const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(customerData),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: data.message || "Failed to create customer in WooCommerce", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, customer: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
