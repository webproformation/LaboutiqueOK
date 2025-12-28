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
    const { backupType, description, wpUrl, wpUsername, wpPassword } = await req.json();

    if (!backupType || !['database', 'media', 'full'].includes(backupType)) {
      return new Response(
        JSON.stringify({ error: "Type de sauvegarde invalide" }),
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

    // Create backup record
    const { data: backup, error: createError } = await supabaseClient
      .from("backups")
      .insert({
        backup_type: backupType,
        status: "processing",
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError || !backup) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de la sauvegarde" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let backupData: any = {};
    let metadata: any = {};

    try {
      // Export database tables
      if (backupType === "database" || backupType === "full") {
        const tables = [
          "profiles",
          "addresses",
          "orders",
          "order_items",
          "delivery_batches",
          "wishlist",
          "loyalty_points",
          "loyalty_rewards",
          "user_rewards",
          "coupons",
          "user_coupons",
          "home_slides",
          "scratch_game_settings",
          "pending_prizes",
          "newsletter_subscriptions",
          "featured_products",
          "product_availability_notifications"
        ];

        for (const table of tables) {
          const { data, error } = await supabaseClient
            .from(table)
            .select("*");

          if (!error && data) {
            backupData[table] = data;
            metadata[`${table}_count`] = data.length;
          }
        }
      }

      // Export WordPress media if requested
      if (backupType === "media" || backupType === "full") {
        if (!wpUrl || !wpUsername || !wpPassword) {
          throw new Error("Identifiants WordPress requis pour la sauvegarde des médias");
        }

        const wpAuthString = btoa(`${wpUsername}:${wpPassword}`);
        const mediaResponse = await fetch(`${wpUrl}/wp-json/wp/v2/media?per_page=100`, {
          headers: {
            'Authorization': `Basic ${wpAuthString}`,
          },
        });

        if (!mediaResponse.ok) {
          throw new Error("Erreur lors de la récupération des médias WordPress");
        }

        const mediaData = await mediaResponse.json();
        backupData['wordpress_media'] = mediaData;
        metadata['media_count'] = mediaData.length;
      }

      // Store backup data as JSON
      const backupJson = JSON.stringify(backupData);
      const backupSize = new Blob([backupJson]).size;

      metadata.backup_size = backupSize;
      metadata.created_at = new Date().toISOString();

      // Update backup record with success status
      await supabaseClient
        .from("backups")
        .update({
          status: "completed",
          file_size: backupSize,
          metadata: metadata,
        })
        .eq("id", backup.id);

      return new Response(
        JSON.stringify({
          success: true,
          backup_id: backup.id,
          size: backupSize,
          metadata: metadata,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (backupError: any) {
      console.error("Backup error:", backupError);

      // Update backup record with error status
      await supabaseClient
        .from("backups")
        .update({
          status: "failed",
          error_message: backupError.message,
        })
        .eq("id", backup.id);

      return new Response(
        JSON.stringify({
          error: "Erreur lors de la création de la sauvegarde",
          details: backupError.message,
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
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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