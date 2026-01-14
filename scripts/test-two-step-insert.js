const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('TEST INSERTION EN 2 ETAPES');
  console.log('===========================\n');
  
  const liveId = 'live_2step_' + Date.now();
  await supabase.from('live_streams').insert({
    id: liveId,
    title: 'Test 2 Steps',
    status: 'live',
    started_at: new Date().toISOString()
  });
  
  const { data: products } = await supabase.from('products').select('id, name, regular_price').limit(1);
  const product = products[0];
  
  console.log('Step 1: INSERT minimal');
  const { data: inserted, error: insertError } = await supabase
    .from('live_shared_products')
    .insert({
      live_stream_id: liveId,
      product_id: product.id
    })
    .select()
    .single();
    
  if (insertError) {
    console.log('Erreur INSERT:', insertError);
    return;
  }
  console.log('INSERT OK, ID:', inserted.id);
  
  console.log('\nStep 2: UPDATE avec donnees completes');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);
  
  const { data: updated, error: updateError } = await supabase
    .from('live_shared_products')
    .update({
      live_product_id: product.id + '-live',
      promo_price: 7.99,
      original_price: product.regular_price || 15.99,
      live_sku: '2step-sku',
      is_published: false,
      expires_at: expiresAt.toISOString()
    })
    .eq('id', inserted.id)
    .select()
    .single();
    
  if (updateError) {
    console.log('Erreur UPDATE:', updateError);
  } else {
    console.log('UPDATE OK !');
    console.log('Promo:', updated.promo_price, 'EUR');
    console.log('Expire:', updated.expires_at);
    console.log('SKU:', updated.live_sku);
  }
  
  await supabase.from('live_shared_products').delete().eq('id', inserted.id);
  await supabase.from('live_streams').delete().eq('id', liveId);
  
  console.log('\nTEST REUSSI !');
})();
