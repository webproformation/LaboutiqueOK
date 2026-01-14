const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('TEST API ENDPOINT /api/live/add-product');
  console.log('========================================');
  
  console.log('1. Creation live stream...');
  const liveId = 'live_' + Date.now() + '_api';
  const { error: liveError } = await supabase
    .from('live_streams')
    .insert({
      id: liveId,
      title: 'Test API Endpoint',
      status: 'live',
      started_at: new Date().toISOString()
    });
    
  if (liveError) {
    console.log('Erreur:', liveError);
    return;
  }
  console.log('Live cree:', liveId);
  
  console.log('\n2. Recuperation produit...');
  const { data: products } = await supabase
    .from('products')
    .select('id, name, image_url, regular_price')
    .limit(1);
    
  if (!products || products.length === 0) {
    console.log('Aucun produit');
    return;
  }
  
  const product = products[0];
  console.log('Produit:', product.name);
  
  console.log('\n3. Test via endpoint API...');
  const testData = {
    live_stream_id: liveId,
    product_id: product.id,
    live_product_id: product.id + '-live-api',
    special_offer: product.name,
    promo_price: 7.99,
    original_price: product.regular_price || 15.99,
    live_sku: 'test-api-sku',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    product_name: product.name,
    product_image: product.image_url
  };
  
  console.log('Test manuel RPC direct...');
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('insert_live_shared_product', {
      p_live_stream_id: testData.live_stream_id,
      p_product_id: testData.product_id,
      p_live_product_id: testData.live_product_id,
      p_special_offer: testData.special_offer,
      p_promo_price: testData.promo_price,
      p_original_price: testData.original_price,
      p_live_sku: testData.live_sku,
      p_expires_at: testData.expires_at,
      p_product_name: testData.product_name,
      p_product_image: testData.product_image
    });
    
  if (rpcError) {
    console.log('Erreur RPC:', rpcError);
  } else {
    console.log('SUCCESS RPC ! Donnees inserees');
  }
  
  console.log('\n4. Nettoyage...');
  await supabase.from('live_shared_products').delete().eq('live_stream_id', liveId);
  await supabase.from('live_streams').delete().eq('id', liveId);
  console.log('Nettoye');
  
  console.log('\nTEST TERMINE');
})();
