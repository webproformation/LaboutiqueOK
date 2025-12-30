const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
  console.log('\n=== Testing get_woocommerce_categories_cache RPC ===\n');

  try {
    const { data, error } = await supabase.rpc('get_woocommerce_categories_cache');

    if (error) {
      console.log('✗ ERROR:', error.message);
      console.log('Details:', error);
      return;
    }

    if (data && Array.isArray(data)) {
      console.log(`✓ SUCCESS: Retrieved ${data.length} categories`);
      console.log('\nFirst 5 categories:');
      data.slice(0, 5).forEach(cat => {
        console.log(`  - ${cat.category_id}: ${cat.name} (${cat.slug})`);
      });

      // Count parent categories
      const parentCategories = data.filter(cat => cat.parent === 0);
      console.log(`\n✓ Found ${parentCategories.length} parent categories`);
      console.log('\nParent categories:');
      parentCategories.slice(0, 10).forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`);
      });
    } else {
      console.log('✗ Unexpected response:', data);
    }
  } catch (error) {
    console.log('✗ EXCEPTION:', error.message);
    console.log(error);
  }
}

testRPC().catch(console.error);
