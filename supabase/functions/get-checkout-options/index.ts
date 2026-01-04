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
    const WORDPRESS_URL = Deno.env.get("WORDPRESS_URL");
    const WC_CONSUMER_KEY = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
    const WC_CONSUMER_SECRET = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");

    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return new Response(
        JSON.stringify({ shippingMethods: [], paymentGateways: [], taxRates: [], error: "WooCommerce credentials not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auth = btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`);
    const headers = { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" };

    const shippingZonesResponse = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/shipping/zones`, { headers });
    if (!shippingZonesResponse.ok) {
      throw new Error(`Failed to fetch shipping zones: ${shippingZonesResponse.statusText}`);
    }

    const shippingZones = await shippingZonesResponse.json();
    const shippingMethods = [];

    for (const zone of shippingZones) {
      const methodsResponse = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/shipping/zones/${zone.id}/methods`, { headers });
      if (methodsResponse.ok) {
        const methods = await methodsResponse.json();
        const enabledMethods = methods.filter(m => m.enabled).map(method => ({
          id: `${zone.id}_${method.instance_id}`,
          zone_id: zone.id,
          zone_name: zone.name,
          instance_id: method.instance_id,
          method_id: method.method_id,
          title: method.title,
          cost: method.settings?.cost?.value || "0",
          description: method.method_description,
        }));
        shippingMethods.push(...enabledMethods);
      }
    }

    const paymentGatewaysResponse = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/payment_gateways`, { headers });
    if (!paymentGatewaysResponse.ok) {
      throw new Error(`Failed to fetch payment gateways: ${paymentGatewaysResponse.statusText}`);
    }

    const allGateways = await paymentGatewaysResponse.json();
    const paymentGateways = allGateways.filter(gateway => gateway.enabled).map(gateway => ({
      id: gateway.id,
      title: gateway.title,
      description: gateway.description,
      order: gateway.order,
    }));

    const taxRatesResponse = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/taxes`, { headers });
    let taxRates = [];
    if (taxRatesResponse.ok) {
      const allTaxRates = await taxRatesResponse.json();
      taxRates = allTaxRates.map(rate => ({
        id: rate.id,
        country: rate.country,
        state: rate.state,
        rate: rate.rate,
        name: rate.name,
        shipping: rate.shipping,
        class: rate.class,
      }));
    }

    return new Response(
      JSON.stringify({ shippingMethods, paymentGateways, taxRates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", shippingMethods: [], paymentGateways: [], taxRates: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
