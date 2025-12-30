import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const VERCEL_REVALIDATE_TOKEN = Deno.env.get('VERCEL_REVALIDATE_TOKEN') || 'votre-token-secret-ici';
    const VERCEL_DEPLOY_URL = Deno.env.get('VERCEL_DEPLOY_URL') || 'https://votre-site.vercel.app';

    const pathsToRevalidate: string[] = [];

    switch (payload.table) {
      case 'home_slides':
      case 'home_categories':
      case 'featured_products':
      case 'delivery_batches':
        pathsToRevalidate.push('/');
        break;
      case 'live_streams':
        pathsToRevalidate.push('/live', '/');
        break;
      case 'guestbook_entries':
        pathsToRevalidate.push('/livre-dor', '/');
        break;
      case 'customer_reviews':
        pathsToRevalidate.push('/');
        if (payload.record?.product_id) pathsToRevalidate.push('/product/*');
        break;
      case 'news_posts':
        pathsToRevalidate.push('/actualites');
        if (payload.record?.slug) pathsToRevalidate.push(`/actualites/${payload.record.slug}`);
        break;
      case 'weekly_ambassadors':
      case 'gift_thresholds':
      case 'loyalty_tiers':
        pathsToRevalidate.push('/');
        break;
    }

    const revalidationPromises = pathsToRevalidate.map(async (path) => {
      const revalidateUrl = `${VERCEL_DEPLOY_URL}/api/revalidate?path=${encodeURIComponent(path)}&secret=${VERCEL_REVALIDATE_TOKEN}`;
      
      try {
        const response = await fetch(revalidateUrl, { method: 'POST' });
        const result = await response.json();
        return { path, success: response.ok, result };
      } catch (error) {
        return { path, success: false, error: error.message };
      }
    });

    const results = await Promise.all(revalidationPromises);

    return new Response(
      JSON.stringify({ success: true, table: payload.table, type: payload.type, revalidated: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
