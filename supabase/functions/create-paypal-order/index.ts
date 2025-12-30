import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYPAL_API_BASE = "https://api-m.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
  const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("PayPal credentials not configured");
    }

    const orderData = await req.json();

    if (!orderData.amount || !orderData.currency) {
      throw new Error("Missing required fields: amount, currency");
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: orderData.currency, value: orderData.amount.toFixed(2) },
          description: orderData.description,
        }],
        application_context: {
          return_url: orderData.returnUrl,
          cancel_url: orderData.cancelUrl,
          brand_name: "La Boutique de Morgane",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PayPal order: ${error}`);
    }

    const paypalOrder = await response.json();
    const approvalUrl = paypalOrder.links.find((link: any) => link.rel === "approve")?.href;

    return new Response(
      JSON.stringify({ orderId: paypalOrder.id, approvalUrl, status: paypalOrder.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
