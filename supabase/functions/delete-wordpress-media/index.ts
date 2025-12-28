import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const { mediaId, wpUrl, wpUsername, wpPassword } = await req.json();

    if (!mediaId) {
      return new Response(
        JSON.stringify({ error: "ID du média requis" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!wpUrl || !wpUsername || !wpPassword) {
      return new Response(
        JSON.stringify({ error: "Configuration WordPress manquante" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authString = `${wpUsername}:${wpPassword}`;
    const encodedAuth = btoa(authString);

    const deleteUrl = `${wpUrl}/wp-json/wp/v2/media/${mediaId}?force=true`;

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "Authorization": `Basic ${encodedAuth}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WordPress API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la suppression du média dans WordPress",
          details: errorText
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Média supprimé avec succès",
        data: result
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error deleting media:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur serveur lors de la suppression",
        details: error instanceof Error ? error.message : "Unknown error"
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