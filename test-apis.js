const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

async function testLoyaltyPoints() {
  console.log('\n=== Test loyalty_points table ===');
  try {
    const response = await fetch(`${BASE_URL}/rest/v1/loyalty_points?select=*&limit=3`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });

    console.log('Status:', response.status);
    const data = await response.json();

    if (response.ok) {
      console.log('✓ SUCCESS - loyalty_points accessible');
      console.log('Sample data:', JSON.stringify(data.slice(0, 2), null, 2));
    } else {
      console.log('✗ ERROR - loyalty_points not accessible');
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('✗ EXCEPTION:', error.message);
  }
}

async function testCategoriesCache() {
  console.log('\n=== Test woocommerce_categories_cache table ===');
  try {
    const response = await fetch(`${BASE_URL}/rest/v1/woocommerce_categories_cache?select=category_id,name,slug&limit=5`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });

    console.log('Status:', response.status);
    const data = await response.json();

    if (response.ok) {
      console.log('✓ SUCCESS - categories cache accessible');
      console.log('Sample categories:', JSON.stringify(data, null, 2));
    } else {
      console.log('✗ ERROR - categories cache not accessible');
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('✗ EXCEPTION:', error.message);
  }
}

async function testCategoriesAPI() {
  console.log('\n=== Test /api/woocommerce/categories?action=list ===');
  try {
    const response = await fetch('http://localhost:3000/api/woocommerce/categories?action=list');

    console.log('Status:', response.status);
    const data = await response.json();

    if (response.ok && Array.isArray(data)) {
      console.log('✓ SUCCESS - categories API working');
      console.log(`Found ${data.length} categories`);
      console.log('Sample categories:', data.slice(0, 3).map(c => `${c.id}: ${c.name}`));
    } else {
      console.log('✗ ERROR - categories API failed');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('✗ EXCEPTION:', error.message);
  }
}

async function runTests() {
  console.log('Starting API tests...\n');
  await testLoyaltyPoints();
  await testCategoriesCache();
  await testCategoriesAPI();
  console.log('\n=== Tests completed ===\n');
}

runTests().catch(console.error);
