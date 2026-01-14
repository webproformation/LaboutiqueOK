const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('TEST FINAL 2 ETAPES');
  console.log('===================\n');
  
  const liveId = 'live_final_' + Date.now();
  await supabase.from('live_streams').insert({
    id: liveId,
    title: 'Test Final',
    status: 'live',
    started_at: new Date().toISOString()
  });
  
  const { data: products } = await supabase.from('products').select('id, name, regular_price').limit(1);
  const product = products[0];
  
  console.log('INSERT minimal...');
  const { data: inserted, error: insertError } = await supabase
    .from('live_shared_products')
    .insert({
      live_stream_id: liveId,
      product_id: product.id
    })
    .select()
    .single();
    
  if (insertError) {
    console.log('Erreur:', insertError);
    return;
  }
  console.log('ID:', inserted.id);
  
  console.log('\nUPDATE complet (sans live_product_id pour test)...');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);
  
  const { data: updated, error: updateError } = await supabase
    .from('live_shared_products')
    .update({
      promo_price: 6.49,
      original_price: product.regular_price || 14.99,
      live_sku: 'final-sku-' + Date.now(),
      is_published: false,
      expires_at: expiresAt.toISOString()
    })
    .eq('id', inserted.id)
    .select()
    .single();
    
  if (updateError) {
    console.log('Erreur UPDATE:', updateError);
  } else {
    console.log('SUCCESS !');
    console.log('Promo:', updated.promo_price, 'EUR');
    console.log('Original:', updated.original_price, 'EUR');
    console.log('SKU:', updated.live_sku);
    console.log('Expire dans 2h:', updated.expires_at ? 'OUI' : 'NON');
  }
  
  await supabase.from('live_shared_products').delete().eq('id', inserted.id);
  await supabase.from('live_streams').delete().eq('id', liveId);
  
  console.log('\n✓ TEST COMPLET REUSSI');
})();
