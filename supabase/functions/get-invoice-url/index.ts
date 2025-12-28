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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { woocommerceOrderId } = await req.json();

    if (!woocommerceOrderId) {
      return new Response(
        JSON.stringify({ error: "WooCommerce order ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const WORDPRESS_URL = Deno.env.get("WORDPRESS_URL");
    const WC_CONSUMER_KEY = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
    const WC_CONSUMER_SECRET = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");

    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return new Response(
        JSON.stringify({ 
          error: "WooCommerce credentials not configured" 
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

    const auth = btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`);

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/orders/${woocommerceOrderId}`,
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch order from WooCommerce: ${response.statusText}`);
    }

    const order = await response.json();

    let invoiceUrl = null;

    if (order.meta_data) {
      const invoiceMeta = order.meta_data.find(
        (meta: any) => meta.key === '_wcpdf_invoice_number' || meta.key === 'invoice_url'
      );

      if (invoiceMeta) {
        invoiceUrl = `${WORDPRESS_URL}/wp-admin/admin-ajax.php?action=generate_wpo_wcpdf&template_type=invoice&order_ids=${woocommerceOrderId}&my-account`;
      }
    }

    if (!invoiceUrl && order.status === 'completed' || order.status === 'processing') {
      invoiceUrl = `${WORDPRESS_URL}/wp-admin/admin-ajax.php?action=generate_wpo_wcpdf&template_type=invoice&order_ids=${woocommerceOrderId}&my-account`;
    }

    return new Response(
      JSON.stringify({ 
        invoiceUrl,
        orderStatus: order.status,
        orderNumber: order.number,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching invoice URL:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        invoiceUrl: null,
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