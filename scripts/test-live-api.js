const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('TEST API /api/live/add-product');
  console.log('================================\n');
  
  console.log('1. Creation live stream...');
  const liveId = 'live_test_' + Date.now();
  const { error: liveError } = await supabase
    .from('live_streams')
    .insert({
      id: liveId,
      title: 'Test Live API',
      status: 'live',
      started_at: new Date().toISOString()
    });
    
  if (liveError) {
    console.log('Erreur live:', liveError);
    return;
  }
  console.log('Live cree:', liveId);
  
  console.log('\n2. Recuperation produit...');
  const { data: products } = await supabase
    .from('products')
    .select('id, name, image_url, regular_price, sku')
    .limit(1);
    
  if (!products || products.length === 0) {
    console.log('Aucun produit');
    return;
  }
  
  const product = products[0];
  console.log('Produit:', product.name);
  
  console.log('\n3. Insertion directe avec SERVICE_ROLE_KEY...');
  const testData = {
    live_stream_id: liveId,
    product_id: product.id,
    live_product_id: product.id + '-live-test',
    special_offer: product.name,
    promo_price: 8.99,
    original_price: product.regular_price || 16.99,
    live_sku: 'test-live-sku',
    is_published: false,
    product_name: product.name,
    product_image: product.image_url
  };
  
  const { data: inserted, error: insertError } = await supabase
    .from('live_shared_products')
    .insert(testData)
    .select()
    .single();
    
  if (insertError) {
    console.log('Erreur insertion:', insertError);
  } else {
    console.log('SUCCESS ! Produit insere:', inserted.id);
    console.log('Promo:', inserted.promo_price, 'EUR');
    console.log('Expire:', inserted.expires_at);
  }
  
  console.log('\n4. Verification...');
  const { data: check, error: checkError } = await supabase
    .from('live_shared_products')
    .select('*')
    .eq('live_stream_id', liveId);
    
  if (checkError) {
    console.log('Erreur verification:', checkError);
  } else {
    console.log('Produits trouves:', check.length);
  }
  
  console.log('\n5. Nettoyage...');
  await supabase.from('live_shared_products').delete().eq('live_stream_id', liveId);
  await supabase.from('live_streams').delete().eq('id', liveId);
  console.log('Nettoye');
  
  console.log('\nTEST TERMINE !');
})();
