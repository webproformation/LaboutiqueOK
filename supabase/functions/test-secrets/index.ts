import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const allEnvVars: Record<string, string> = {};
  
  // Liste toutes les variables d'environnement disponibles
  for (const key of Object.keys(Deno.env.toObject())) {
    const value = Deno.env.get(key);
    if (value) {
      // Masque les valeurs sensibles mais montre qu'elles existent
      if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
        allEnvVars[key] = `[EXISTE - ${value.length} chars]`;
      } else {
        allEnvVars[key] = value.substring(0, 50) + (value.length > 50 ? '...' : '');
      }
    }
  }

  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalEnvVars: Object.keys(allEnvVars).length,
      envVars: allEnvVars,
      specificChecks: {
        WORDPRESS_URL: Deno.env.get('WORDPRESS_URL') || 'NOT_FOUND',
        WOOCOMMERCE_CONSUMER_KEY: Deno.env.get('WOOCOMMERCE_CONSUMER_KEY') ? `EXISTS (${Deno.env.get('WOOCOMMERCE_CONSUMER_KEY')?.length} chars)` : 'NOT_FOUND',
        WOOCOMMERCE_CONSUMER_SECRET: Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET') ? `EXISTS (${Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET')?.length} chars)` : 'NOT_FOUND',
      }
    }, null, 2),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
});