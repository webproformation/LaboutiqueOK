import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { db: { schema: 'public' } }
    );

    const { data: lastBonus } = await supabase
      .from('loyalty_points')
      .select('created_at')
      .eq('user_id', user_id)
      .eq('bonus_type', 'daily_connection')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastBonus) {
      const lastBonusDate = new Date(lastBonus.created_at).toDateString();
      const today = new Date().toDateString();

      if (lastBonusDate === today) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Bonus déjà attribué aujourd\'hui',
            points: 0
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { error } = await supabase
      .from('loyalty_points')
      .insert({
        user_id,
        points: 10,
        bonus_type: 'daily_connection',
        description: 'Bonus de connexion quotidien'
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vous avez gagné 10 points de fidélité pour votre connexion quotidienne !',
        points: 10
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in award-daily-bonus:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});