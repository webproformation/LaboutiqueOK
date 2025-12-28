import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WORDPRESS_URL = Deno.env.get('WORDPRESS_URL');
const WORDPRESS_USERNAME = Deno.env.get('WORDPRESS_USERNAME');
const WORDPRESS_APP_PASSWORD = Deno.env.get('WORDPRESS_APP_PASSWORD');

const getAuthHeader = () => {
  if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
    const credentials = btoa(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`);
    return `Basic ${credentials}`;
  }
  return null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = getAuthHeader();

    if (!authHeader || !WORDPRESS_URL) {
      return new Response(
        JSON.stringify({
          error: 'Configuration manquante : WORDPRESS_URL, WORDPRESS_USERNAME et WORDPRESS_APP_PASSWORD doivent être configurés',
          users: []
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const perPage = url.searchParams.get('per_page') || '100';
    const search = url.searchParams.get('search') || '';

    let wpUrl = `${WORDPRESS_URL}/wp-json/wp/v2/users?page=${page}&per_page=${perPage}&context=edit`;
    if (search) {
      wpUrl += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(wpUrl, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const users = await response.json();
    const totalPages = response.headers.get('X-WP-TotalPages');
    const totalItems = response.headers.get('X-WP-Total');

    const formattedUsers = users.map((user: any) => ({
      id: `wp-${user.id}`,
      wordpress_id: user.id,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      name: user.name || '',
      roles: user.roles || [],
      created_at: user.registered_date || new Date().toISOString(),
      source: 'wordpress'
    }));

    return new Response(
      JSON.stringify({
        users: formattedUsers,
        totalPages: totalPages ? parseInt(totalPages) : 1,
        totalItems: totalItems ? parseInt(totalItems) : formattedUsers.length
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching WordPress users:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        users: []
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});