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
    const envVars = {
      WORDPRESS_URL: Deno.env.get('WORDPRESS_URL') ? 'DÉFINI (' + Deno.env.get('WORDPRESS_URL')?.substring(0, 30) + '...)' : 'NON DÉFINI',
      WORDPRESS_USERNAME: Deno.env.get('WORDPRESS_USERNAME') ? 'DÉFINI (longueur: ' + Deno.env.get('WORDPRESS_USERNAME')?.length + ' chars)' : 'NON DÉFINI',
      WORDPRESS_APP_PASSWORD: Deno.env.get('WORDPRESS_APP_PASSWORD') ? 'DÉFINI (longueur: ' + Deno.env.get('WORDPRESS_APP_PASSWORD')?.length + ' chars)' : 'NON DÉFINI',
      WOOCOMMERCE_CONSUMER_KEY: Deno.env.get('WOOCOMMERCE_CONSUMER_KEY') ? 'DÉFINI (longueur: ' + Deno.env.get('WOOCOMMERCE_CONSUMER_KEY')?.length + ' chars)' : 'NON DÉFINI',
      WOOCOMMERCE_CONSUMER_SECRET: Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET') ? 'DÉFINI (longueur: ' + Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET')?.length + ' chars)' : 'NON DÉFINI',
    };

    let connectionTest = null;
    if (Deno.env.get('WORDPRESS_URL') && Deno.env.get('WOOCOMMERCE_CONSUMER_KEY') && Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET')) {
      try {
        const credentials = btoa(`${Deno.env.get('WOOCOMMERCE_CONSUMER_KEY')}:${Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET')}`);
        const testUrl = `${Deno.env.get('WORDPRESS_URL')}/wp-json/wc/v3/products?per_page=1`;

        const response = await fetch(testUrl, { headers: { 'Authorization': `Basic ${credentials}` } });

        connectionTest = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          success: response.ok,
        };

        if (!response.ok) {
          const errorBody = await response.text();
          connectionTest.errorBody = errorBody.substring(0, 500);
        }
      } catch (error) {
        connectionTest = { error: error.message, success: false };
      }
    }

    return new Response(
      JSON.stringify({ envVars, connectionTest, timestamp: new Date().toISOString() }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
