async function testProductionCategoriesAPI() {
  console.log('\n=== Test Production Categories API ===\n');

  const prodUrl = 'https://www.laboutiquedemorgane.com/api/woocommerce/categories?action=list';

  try {
    console.log(`Calling ${prodUrl}...\n`);

    const startTime = Date.now();
    const response = await fetch(prodUrl);
    const duration = Date.now() - startTime;

    console.log(`Status: ${response.status} (${duration}ms)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('✗ ERROR Response:', errorText.substring(0, 500));
      return;
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.log('✗ ERROR: Response is not an array');
      console.log('Response type:', typeof data);
      console.log('Response:', JSON.stringify(data).substring(0, 200));
      return;
    }

    console.log(`✓ SUCCESS: Received ${data.length} categories\n`);

    if (data.length === 0) {
      console.log('⚠ WARNING: No categories returned (expected 69)');
      console.log('\nPossible causes:');
      console.log('  - WooCommerce API not accessible');
      console.log('  - WordPress credentials invalid');
      console.log('  - Network timeout');
      return;
    }

    // Afficher les premières catégories
    console.log('First 10 categories:');
    data.slice(0, 10).forEach(cat => {
      console.log(`  - [${cat.id}] ${cat.name} (${cat.slug}) - Parent: ${cat.parent || 'none'}, Count: ${cat.count || 0}`);
    });

    // Compter les catégories parentes
    const parentCategories = data.filter(cat => cat.parent === 0);
    console.log(`\n✓ Total categories: ${data.length}`);
    console.log(`✓ Parent categories: ${parentCategories.length}`);

    if (parentCategories.length > 0) {
      console.log('\nParent categories (first 15):');
      parentCategories.slice(0, 15).forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug}) - ${cat.count || 0} products`);
      });
    }

    if (data.length >= 69) {
      console.log('\n✓✓✓ SUCCESS: All categories loaded successfully! ✓✓✓');
    } else {
      console.log(`\n⚠ Expected 69 categories, got ${data.length}`);
    }

  } catch (error) {
    console.log('✗ EXCEPTION:', error.message);
    console.log('\nThis could mean:');
    console.log('  - Network issue');
    console.log('  - Site not accessible');
    console.log('  - CORS issue');
  }
}

testProductionCategoriesAPI().catch(console.error);
