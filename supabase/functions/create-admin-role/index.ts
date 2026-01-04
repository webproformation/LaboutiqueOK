import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === email);
    let userId: string;

    if (userExists) {
      userId = userExists.id;
    } else {
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName || '', last_name: lastName || '' }
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = createData.user.id;

      try {
        await supabaseAdmin.from('user_profiles').insert({
          user_id: userId,
          email: email,
          first_name: firstName || '',
          last_name: lastName || '',
          wallet_balance: 0
        });
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    const { error: insertError } = await supabaseAdmin.from('user_roles').insert({
      user_id: userId,
      role: 'admin'
    });

    if (insertError && insertError.code === '23505') {
      const { error: updateError } = await supabaseAdmin.from('user_roles').update({ role: 'admin' }).eq('user_id', userId);
      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Erreur mise à jour rôle: ${updateError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (insertError) {
      return new Response(
        JSON.stringify({ error: `Erreur création rôle: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: userExists ? 'Rôle admin mis à jour avec succès' : 'Utilisateur admin créé avec succès',
        user: { id: userId, email: email }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
