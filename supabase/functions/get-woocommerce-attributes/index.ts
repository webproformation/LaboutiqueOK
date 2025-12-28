import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WooCommerceAttribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  order_by: string;
  has_archives: boolean;
}

interface WooCommerceAttributeTerm {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const attributeId = url.searchParams.get("attributeId");

    const wcConsumerKey = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
    const wcConsumerSecret = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");
    const wordpressUrl = Deno.env.get("WORDPRESS_URL");

    if (!wcConsumerKey || !wcConsumerSecret || !wordpressUrl) {
      return new Response(
        JSON.stringify({ attributes: [], message: "WooCommerce credentials not configured" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const auth = btoa(`${wcConsumerKey}:${wcConsumerSecret}`);

    if (attributeId) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const termsResponse = await fetch(
          `${wordpressUrl}/wp-json/wc/v3/products/attributes/${attributeId}/terms?per_page=100`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!termsResponse.ok) {
          throw new Error(`Failed to fetch attribute terms: ${termsResponse.status}`);
        }

        const terms: WooCommerceAttributeTerm[] = await termsResponse.json();

        return new Response(JSON.stringify({ terms }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const attributesResponse = await fetch(
        `${wordpressUrl}/wp-json/wc/v3/products/attributes`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!attributesResponse.ok) {
        throw new Error(`Failed to fetch attributes: ${attributesResponse.status}`);
      }

    const attributes: WooCommerceAttribute[] = await attributesResponse.json();

      const attributesWithTerms = await Promise.all(
        attributes.map(async (attribute) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const termsResponse = await fetch(
              `${wordpressUrl}/wp-json/wc/v3/products/attributes/${attribute.id}/terms?per_page=100`,
              {
                headers: {
                  Authorization: `Basic ${auth}`,
                },
                signal: controller.signal,
              }
            );

            clearTimeout(timeoutId);

            if (!termsResponse.ok) {
              return { ...attribute, terms: [] };
            }

            const terms: WooCommerceAttributeTerm[] = await termsResponse.json();
            return { ...attribute, terms };
          } catch (error) {
            console.error(`Error fetching terms for attribute ${attribute.id}:`, error);
            return { ...attribute, terms: [] };
          }
        })
      );

      return new Response(JSON.stringify({ attributes: attributesWithTerms }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error("Error fetching WooCommerce attributes:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        attributes: []
      }),
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