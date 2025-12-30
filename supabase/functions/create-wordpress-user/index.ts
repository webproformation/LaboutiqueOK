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
    const { email, firstName, lastName, password } = await req.json();

    const wpUrl = Deno.env.get('WORDPRESS_URL');
    const wpUsername = Deno.env.get('WORDPRESS_USERNAME');
    const wpAppPassword = Deno.env.get('WORDPRESS_APP_PASSWORD');

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      throw new Error('WordPress credentials not configured');
    }

    const authString = btoa(`${wpUsername}:${wpAppPassword}`);
    const userData = {
      username: email.split('@')[0] + '_' + Date.now(),
      email: email,
      first_name: firstName,
      last_name: lastName,
      password: password,
      roles: ['customer']
    };

    const response = await fetch(`${wpUrl}/wp-json/wp/v2/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authString}` },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400 && errorText.includes('existing_user_email')) {
        return new Response(
          JSON.stringify({ success: true, message: 'User already exists in WordPress' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Failed to create WordPress user: ${response.status}`);
    }

    const wpUserCreated = await response.json();

    return new Response(
      JSON.stringify({ success: true, userId: wpUserCreated.id, message: 'WordPress user created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});