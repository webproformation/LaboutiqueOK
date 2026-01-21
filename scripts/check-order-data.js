const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/tmp/cc-agent/62170990/project/.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkOrder() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', 'CMD-1769024257344')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== ORDER ITEMS ===');
  data.order_items?.forEach((item, idx) => {
    console.log(`\nItem ${idx + 1}:`);
    console.log('  product_name:', item.product_name);
    console.log('  SKU:', item.sku);
    console.log('  variation_data:', JSON.stringify(item.variation_data, null, 2));
  });
}

checkOrder();
