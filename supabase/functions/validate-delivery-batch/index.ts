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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { batchId } = await req.json();
    if (!batchId) throw new Error("Missing batchId");

    const { data: batch, error: batchError } = await supabase
      .from("delivery_batches")
      .select(`*, shipping_address:addresses(*)`)
      .eq("id", batchId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    if (batchError || !batch) throw new Error("Batch not found or already validated");

    const { data: items, error: itemsError } = await supabase
      .from("delivery_batch_items")
      .select("*")
      .eq("batch_id", batchId);

    if (itemsError || !items || items.length === 0) throw new Error("No items found in batch");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const shippingCost = parseFloat(batch.shipping_cost);
    const total = subtotal + shippingCost;

    const woocommerceUrl = Deno.env.get("WORDPRESS_URL");
    const wooKey = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
    const wooSecret = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");

    if (!woocommerceUrl || !wooKey || !wooSecret) {
      throw new Error("WooCommerce credentials not configured");
    }

    const wooAuth = btoa(`${wooKey}:${wooSecret}`);
    const orderData = {
      status: "processing",
      set_paid: true,
      billing: {
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
        address_1: batch.shipping_address?.address_line1 || "",
        address_2: batch.shipping_address?.address_line2 || "",
        city: batch.shipping_address?.city || "",
        state: batch.shipping_address?.state || "",
        postcode: batch.shipping_address?.postal_code || "",
        country: batch.shipping_address?.country || "FR",
      },
      shipping: {
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        address_1: batch.shipping_address?.address_line1 || "",
        address_2: batch.shipping_address?.address_line2 || "",
        city: batch.shipping_address?.city || "",
        state: batch.shipping_address?.state || "",
        postcode: batch.shipping_address?.postal_code || "",
        country: batch.shipping_address?.country || "FR",
      },
      line_items: items.map(item => ({ product_id: parseInt(item.product_id), quantity: item.quantity })),
      shipping_lines: [{ method_id: "flat_rate", method_title: "Livraison groupée (5 jours)", total: batch.shipping_cost.toString() }],
      meta_data: [
        { key: "_supabase_batch_id", value: batchId },
        { key: "_supabase_user_id", value: user.id },
        { key: "_batch_validated_at", value: new Date().toISOString() },
      ],
    };

    const wooResponse = await fetch(`${woocommerceUrl}/wp-json/wc/v3/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${wooAuth}` },
      body: JSON.stringify(orderData),
    });

    if (!wooResponse.ok) {
      const errorText = await wooResponse.text();
      throw new Error(`WooCommerce error: ${errorText}`);
    }

    const wooOrder = await wooResponse.json();

    await supabase.from("delivery_batches").update({
      status: "validated",
      validated_at: new Date().toISOString(),
      woocommerce_order_id: wooOrder.id.toString(),
    }).eq("id", batchId);

    return new Response(
      JSON.stringify({
        success: true,
        batchId: batchId,
        woocommerceOrderId: wooOrder.id,
        orderNumber: wooOrder.number,
        total: total,
        shippingCost: shippingCost,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
