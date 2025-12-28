import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
    const { backupId, clearExisting } = await req.json();

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

    if (backup.status !== "completed") {
      return new Response(
        JSON.stringify({ error: "La sauvegarde n'est pas complète" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Download backup file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from("backups")
      .download(backup.file_path);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: "Erreur lors du téléchargement de la sauvegarde" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse backup data
    const backupText = await fileData.text();
    const backupData = JSON.parse(backupText);

    let restoredTables: string[] = [];
    let restoredCounts: Record<string, number> = {};

    // Restore data for each table
    const tables = Object.keys(backupData).filter(key => key !== "backup_info" && key !== "wordpress_media");

    for (const table of tables) {
      const tableData = backupData[table];
      
      if (!Array.isArray(tableData) || tableData.length === 0) {
        continue;
      }

      try {
        // Clear existing data if requested
        if (clearExisting) {
          await supabaseClient
            .from(table)
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
        }

        // Insert data in batches to avoid timeouts
        const batchSize = 100;
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize);
          const { error: insertError } = await supabaseClient
            .from(table)
            .upsert(batch, { onConflict: "id" });

          if (insertError) {
            console.error(`Error inserting into ${table}:`, insertError);
          }
        }

        restoredTables.push(table);
        restoredCounts[table] = tableData.length;
      } catch (error) {
        console.error(`Error restoring table ${table}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sauvegarde restaurée avec succès",
        restored: {
          tables: restoredTables,
          counts: restoredCounts,
        },
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
    console.error("Error restoring backup:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la restauration de la sauvegarde",
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