import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-WordPress-URL, X-WordPress-Username, X-WordPress-Password",
};

interface PostData {
  title: string;
  content: string;
  excerpt?: string;
  status: 'publish' | 'draft' | 'pending';
  categories?: number[];
  featured_media?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Try to get from environment first
    let WORDPRESS_URL = Deno.env.get("WORDPRESS_URL");
    let WORDPRESS_USERNAME = Deno.env.get("WORDPRESS_USERNAME");
    let WORDPRESS_APP_PASSWORD = Deno.env.get("WORDPRESS_APP_PASSWORD");

    // If not in environment, try to get from request headers
    if (!WORDPRESS_URL || !WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
      const wpUrl = req.headers.get("X-WordPress-URL");
      const wpUsername = req.headers.get("X-WordPress-Username");
      const wpPassword = req.headers.get("X-WordPress-Password");

      if (wpUrl && wpUsername && wpPassword) {
        WORDPRESS_URL = wpUrl;
        WORDPRESS_USERNAME = wpUsername;
        WORDPRESS_APP_PASSWORD = wpPassword;
      } else {
        throw new Error("WordPress credentials not configured");
      }
    }

    const url = new URL(req.url);
    const postId = url.searchParams.get("id");
    const method = req.method;

    const auth = btoa(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`);
    const headers = {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    };

    // GET: Retrieve post(s)
    if (method === "GET") {
      if (postId) {
        // Get single post with embedded media
        const wpUrl = `${WORDPRESS_URL}/wp-json/wp/v2/posts/${postId}?_embed`;
        console.log(`Fetching WordPress post from: ${wpUrl}`);

        const response = await fetch(wpUrl, {
          headers,
        });

        console.log(`WordPress response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`WordPress error response:`, errorText);

          let errorJson;
          try {
            errorJson = JSON.parse(errorText);
          } catch (e) {
            errorJson = { message: errorText };
          }

          return new Response(
            JSON.stringify({
              error: `Erreur WordPress (${response.status})`,
              details: errorJson,
              url: wpUrl.replace(WORDPRESS_APP_PASSWORD, '***')
            }),
            {
              status: response.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const post = await response.json();
        return new Response(JSON.stringify(post), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Get all posts
        const wpUrl = `${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=100&_embed`;
        console.log(`Fetching WordPress posts from: ${wpUrl}`);

        const response = await fetch(wpUrl, {
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`WordPress error response:`, errorText);

          let errorJson;
          try {
            errorJson = JSON.parse(errorText);
          } catch (e) {
            errorJson = { message: errorText };
          }

          return new Response(
            JSON.stringify({
              error: `Erreur WordPress (${response.status})`,
              details: errorJson,
              url: wpUrl.replace(WORDPRESS_APP_PASSWORD, '***')
            }),
            {
              status: response.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const posts = await response.json();
        return new Response(JSON.stringify(posts), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // POST: Create new post
    if (method === "POST") {
      const postData: PostData = await req.json();

      const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts?_embed`, {
        method: "POST",
        headers,
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create post: ${error}`);
      }

      const newPost = await response.json();
      return new Response(JSON.stringify(newPost), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    // PUT: Update existing post
    if (method === "PUT") {
      if (!postId) {
        throw new Error("Post ID is required for updates");
      }

      const postData: Partial<PostData> = await req.json();

      const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts/${postId}?_embed`, {
        method: "POST",
        headers,
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update post: ${error}`);
      }

      const updatedPost = await response.json();
      return new Response(JSON.stringify(updatedPost), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE: Delete post
    if (method === "DELETE") {
      if (!postId) {
        throw new Error("Post ID is required for deletion");
      }

      const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts/${postId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete post: ${error}`);
      }

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error managing WordPress posts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});