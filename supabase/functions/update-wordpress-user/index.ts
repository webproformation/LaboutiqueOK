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
    const { wordpressUserId, firstName, lastName, phone } = await req.json();

    if (!wordpressUserId) {
      throw new Error('WordPress user ID is required');
    }

    const wpUrl = Deno.env.get('WORDPRESS_URL');
    const wpUsername = Deno.env.get('WORDPRESS_USERNAME');
    const wpAppPassword = Deno.env.get('WORDPRESS_APP_PASSWORD');

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      throw new Error('WordPress credentials not configured');
    }

    const authString = btoa(`${wpUsername}:${wpAppPassword}`);
    const userData: any = {};
    if (firstName) userData.first_name = firstName;
    if (lastName) userData.last_name = lastName;
    if (phone) userData.meta = { billing_phone: phone };

    const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/${wordpressUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authString}` },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update WordPress user: ${response.status}`);
    }

    const wpUserUpdated = await response.json();

    return new Response(
      JSON.stringify({ success: true, user: wpUserUpdated, message: 'WordPress user updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});