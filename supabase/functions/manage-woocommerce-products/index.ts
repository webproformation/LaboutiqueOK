import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WORDPRESS_URL = Deno.env.get('WORDPRESS_URL');
const WC_CONSUMER_KEY = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
const WC_CONSUMER_SECRET = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

const getAuthHeader = () => {
  const credentials = btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`);
  return `Basic ${credentials}`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Configuration manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    let productId = url.searchParams.get('id');
    let requestBody: any = null;

    if (req.method === 'POST' && req.body) {
      requestBody = await req.json();
      action = requestBody.action || action;
      productId = requestBody.productId?.toString() || productId;
    }

    if (action === 'list') {
      const page = url.searchParams.get('page') || '1';
      const perPage = url.searchParams.get('per_page') || '10';
      const search = url.searchParams.get('search') || '';
      let wcUrl = `${WORDPRESS_URL}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`;
      if (search) wcUrl += `&search=${encodeURIComponent(search)}`;

      const response = await fetch(wcUrl, { headers: { 'Authorization': getAuthHeader() } });
      const products = await response.json();

      return new Response(
        JSON.stringify({ products, totalPages: response.headers.get('X-WP-TotalPages'), totalItems: response.headers.get('X-WP-Total') }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get' && productId) {
      const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      return new Response(JSON.stringify(await response.json()), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create' && req.method === 'POST') {
      const productData = requestBody?.productData || requestBody;
      const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/products`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      return new Response(JSON.stringify(await response.json()), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update' && productId) {
      const productData = requestBody?.productData || requestBody;
      const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      return new Response(JSON.stringify(await response.json()), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});