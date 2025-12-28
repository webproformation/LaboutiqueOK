import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
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
    const { backupId } = await req.json();

    if (!backupId) {
      return new Response(
        JSON.stringify({ error: "ID de sauvegarde requis" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userRole || userRole.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Accès refusé - admin requis" }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get backup record
    const { data: backup, error: backupError } = await supabaseClient
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .maybeSingle();

    if (backupError || !backup) {
      return new Response(
        JSON.stringify({ error: "Sauvegarde introuvable" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Delete file from storage if it exists
    if (backup.file_path) {
      const { error: deleteStorageError } = await supabaseClient.storage
        .from("backups")
        .remove([backup.file_path]);

      if (deleteStorageError) {
        console.error("Error deleting file from storage:", deleteStorageError);
      }
    }

    // Delete backup record from database
    const { error: deleteError } = await supabaseClient
      .from("backups")
      .delete()
      .eq("id", backupId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de la suppression de la sauvegarde" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sauvegarde supprimée avec succès",
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
    console.error("Error deleting backup:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la suppression de la sauvegarde",
        details: error instanceof Error ? error.message : "Unknown error",
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