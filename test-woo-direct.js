async function testWooCommerceDirectly() {
  console.log('\n=== Test Direct WooCommerce API ===\n');

  const wordpressUrl = 'https://wp.laboutiquedemorgane.com';
  const consumerKey = 'ck_d620ae1f9fcd1832bdb2c31fe3ad8362a9de8b28';
  const consumerSecret = 'cs_f452fc79440e83b64d6c3a0c712d51c91c8dd5a4';

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const url = `${wordpressUrl}/wp-json/wc/v3/products/categories?per_page=10`;

  console.log(`Testing: ${url}\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Test-Script'
      }
    });
    const duration = Date.now() - startTime;

    console.log(`Status: ${response.status} (${duration}ms)`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('\n✗ ERROR Response:');
      console.log(errorText.substring(0, 1000));
      return;
    }

    const data = await response.json();
    const total = response.headers.get('X-WP-Total');

    console.log(`\n✓ SUCCESS: API is accessible`);
    console.log(`✓ Total categories in WooCommerce: ${total || 'unknown'}`);
    console.log(`✓ Received ${data.length} categories in this response\n`);

    if (data.length > 0) {
      console.log('Sample categories:');
      data.forEach(cat => {
        console.log(`  - [${cat.id}] ${cat.name} (${cat.slug}) - Parent: ${cat.parent || 'none'}, Count: ${cat.count || 0}`);
      });
      console.log('\n✓✓✓ WooCommerce API is working correctly! ✓✓✓');
    } else {
      console.log('⚠ WARNING: No categories returned from WooCommerce');
    }

  } catch (error) {
    console.log('✗ EXCEPTION:', error.message);
    console.log('\nFull error:', error);
  }
}

testWooCommerceDirectly().catch(console.error);
