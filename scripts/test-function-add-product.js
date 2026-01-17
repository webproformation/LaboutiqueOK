const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('TEST FONCTION add_product_to_live');
  console.log('==================================\n');
  
  console.log('1. Creation live stream...');
  const liveId = 'live_func_' + Date.now();
  const { error: liveError } = await supabase
    .from('live_streams')
    .insert({
      id: liveId,
      title: 'Test Function',
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
    .select('id, name, image_url, regular_price')
    .limit(1);
    
  const product = products[0];
  console.log('Produit:', product.name);
  
  console.log('\n3. Appel fonction add_product_to_live...');
  const { data: result, error: funcError } = await supabase
    .rpc('add_product_to_live', {
      p_live_stream_id: liveId,
      p_product_id: product.id,
      p_live_product_id: product.id + '-live-func',
      p_special_offer: product.name,
      p_promo_price: 6.99,
      p_original_price: product.regular_price || 14.99,
      p_live_sku: 'test-func-sku',
      p_product_name: product.name,
      p_product_image: product.image_url
    });
    
  if (funcError) {
    console.log('Erreur fonction:', funcError);
  } else {
    console.log('SUCCESS ! Produit ajoute via fonction');
    console.log('Resultat:', result);
  }
  
  console.log('\n4. Verification...');
  const { data: check } = await supabase
    .from('live_shared_products')
    .select('*')
    .eq('live_stream_id', liveId);
    
  console.log('Produits trouves:', check ? check.length : 0);
  if (check && check.length > 0) {
    console.log('Premier produit:', {
      id: check[0].id,
      promo_price: check[0].promo_price,
      product_name: check[0].product_name
    });
  }
  
  console.log('\n5. Nettoyage...');
  await supabase.from('live_shared_products').delete().eq('live_stream_id', liveId);
  await supabase.from('live_streams').delete().eq('id', liveId);
  console.log('Nettoye');
  
  console.log('\nTEST TERMINE !');
})();
