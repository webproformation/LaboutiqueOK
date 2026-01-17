require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCardFlipGame() {
  console.log('🎮 Testing Card Flip Game...\n');

  const now = new Date().toISOString();
  console.log('📅 Current time (ISO):', now);
  console.log('📅 Current time (local):', new Date().toLocaleString('fr-FR'));

  const { data, error } = await supabase
    .from('card_flip_games')
    .select('*')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data) {
    console.log('❌ No active card flip game found');
    return;
  }

  console.log('\n✅ Active game found:');
  console.log('   ID:', data.id);
  console.log('   Name:', data.name);
  console.log('   Description:', data.description);
  console.log('   Is Active:', data.is_active);
  console.log('   Start Date:', data.start_date);
  console.log('   End Date:', data.end_date);
  console.log('   Max Plays:', data.max_plays_per_user);
  console.log('   Coupon ID:', data.coupon_id);
  console.log('\n🎉 Game should display on homepage!');
}

testCardFlipGame();
