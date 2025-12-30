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

    const { data: pointsData, error: pointsError } = await supabase
      .from('loyalty_points')
      .select('points')
      .eq('user_id', user_id);

    if (pointsError) throw pointsError;

    const totalPoints = pointsData?.reduce((sum: number, p: any) => sum + (p.points || 0), 0) || 0;
    const current_balance = totalPoints * 0.01;

    let tier = 1;
    let multiplier = 1;
    let tier_name = 'Palier 1';
    let next_tier_threshold = 200;

    if (current_balance >= 500) {
      tier = 3;
      multiplier = 3;
      tier_name = 'Palier 3';
      next_tier_threshold = 500;
    } else if (current_balance >= 200) {
      tier = 2;
      multiplier = 2;
      tier_name = 'Palier 2';
      next_tier_threshold = 500;
    }

    return new Response(
      JSON.stringify([{
        tier,
        multiplier,
        tier_name,
        current_balance,
        next_tier_threshold
      }]),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-loyalty-tier:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});