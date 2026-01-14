const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('TEST ULTRA MINIMAL');
  console.log('==================\n');
  
  const liveId = 'live_ultra_' + Date.now();
  await supabase.from('live_streams').insert({
    id: liveId,
    title: 'Test Ultra',
    status: 'live',
    started_at: new Date().toISOString()
  });
  
  const { data: products } = await supabase.from('products').select('id').limit(1);
  const productId = products[0].id;
  
  console.log('Test 1: Seulement live_stream_id et product_id');
  const ultraMinimal = {
    live_stream_id: liveId,
    product_id: productId
  };
  
  const { data: inserted, error } = await supabase
    .from('live_shared_products')
    .insert(ultraMinimal)
    .select()
    .single();
    
  if (error) {
    console.log('ERREUR:', error.message);
  } else {
    console.log('SUCCESS ! Produit insere avec ID:', inserted.id);
    console.log('Colonnes retournees:', Object.keys(inserted));
  }
  
  await supabase.from('live_shared_products').delete().eq('live_stream_id', liveId);
  await supabase.from('live_streams').delete().eq('id', liveId);
})();
