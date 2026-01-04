import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AddTermRequest {
  attributeId: number;
  termName: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { attributeId, termName }: AddTermRequest = await req.json();

    if (!attributeId || !termName) {
      return new Response(
        JSON.stringify({ error: "attributeId and termName are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const wcConsumerKey = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
    const wcConsumerSecret = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");
    const wordpressUrl = Deno.env.get("WORDPRESS_URL");

    if (!wcConsumerKey || !wcConsumerSecret || !wordpressUrl) {
      return new Response(
        JSON.stringify({ error: "WooCommerce credentials not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const auth = btoa(`${wcConsumerKey}:${wcConsumerSecret}`);

    const response = await fetch(
      `${wordpressUrl}/wp-json/wc/v3/products/attributes/${attributeId}/terms`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: termName,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to add term: ${response.status}`);
    }

    const term = await response.json();

    return new Response(JSON.stringify({ term }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error adding WooCommerce attribute term:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});