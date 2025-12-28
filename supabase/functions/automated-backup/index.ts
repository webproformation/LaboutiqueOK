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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting automated backup...");

    // Get the first admin user to attribute the backup to
    const { data: adminUser } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    // Create backup record
    const { data: backup, error: createError } = await supabaseClient
      .from("backups")
      .insert({
        backup_type: "database",
        status: "processing",
        description: "Sauvegarde automatique quotidienne",
        created_by: adminUser?.user_id || null,
      })
      .select()
      .single();

    if (createError || !backup) {
      console.error("Error creating backup record:", createError);
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
      // Export all database tables
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
        "product_availability_notifications",
        "user_roles"
      ];

      console.log(`Backing up ${tables.length} tables...`);

      for (const table of tables) {
        try {
          const { data, error } = await supabaseClient
            .from(table)
            .select("*");

          if (!error && data) {
            backupData[table] = data;
            metadata[`${table}_count`] = data.length;
            console.log(`Backed up ${table}: ${data.length} rows`);
          } else if (error) {
            console.error(`Error backing up ${table}:`, error);
          }
        } catch (err) {
          console.error(`Exception backing up ${table}:`, err);
        }
      }

      // Store backup data as JSON
      const backupJson = JSON.stringify(backupData);
      const backupSize = new Blob([backupJson]).size;

      metadata.backup_size = backupSize;
      metadata.created_at = new Date().toISOString();

      console.log(`Backup completed. Size: ${backupSize} bytes`);

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