const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('TEST INSERTION MINIMALE (sans product_name/image)');
  console.log('==================================================\n');
  
  const liveId = 'live_minimal_' + Date.now();
  console.log('1. Creation live...');
  await supabase.from('live_streams').insert({
    id: liveId,
    title: 'Test Minimal',
    status: 'live',
    started_at: new Date().toISOString()
  });
  console.log('Live:', liveId);
  
  console.log('\n2. Produit...');
  const { data: products } = await supabase.from('products').select('id, name').limit(1);
  const product = products[0];
  console.log('Produit:', product.name);
  
  console.log('\n3. Insert MINIMAL (colonnes anciennes seulement)...');
  const minimalData = {
    live_stream_id: liveId,
    product_id: product.id,
    live_product_id: product.id + '-min',
    special_offer: product.name,
    promo_price: 5.99,
    original_price: 12.99,
    live_sku: 'min-sku',
    is_published: false,
    expires_at: new Date(Date.now() + 7200000).toISOString()
  };
  
  const { data: inserted, error } = await supabase
    .from('live_shared_products')
    .insert(minimalData)
    .select()
    .single();
    
  if (error) {
    console.log('ERREUR:', error);
  } else {
    console.log('SUCCESS ! ID:', inserted.id);
    console.log('Promo:', inserted.promo_price, 'EUR');
  }
  
  console.log('\n4. Nettoyage...');
  await supabase.from('live_shared_products').delete().eq('live_stream_id', liveId);
  await supabase.from('live_streams').delete().eq('id', liveId);
  console.log('OK');
})();
