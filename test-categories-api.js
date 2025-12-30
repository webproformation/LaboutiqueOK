async function testCategoriesAPI() {
  console.log('\n=== Test Categories API ===\n');

  try {
    console.log('Calling /api/woocommerce/categories?action=list...\n');

    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/woocommerce/categories?action=list');
    const duration = Date.now() - startTime;

    console.log(`Status: ${response.status} (${duration}ms)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('✗ ERROR Response:', errorText);
      return;
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.log('✗ ERROR: Response is not an array');
      console.log('Response:', data);
      return;
    }

    console.log(`✓ SUCCESS: Received ${data.length} categories\n`);

    if (data.length === 0) {
      console.log('⚠ WARNING: No categories returned (expected 69)');
      return;
    }

    // Afficher les premières catégories
    console.log('First 10 categories:');
    data.slice(0, 10).forEach(cat => {
      console.log(`  - [${cat.id}] ${cat.name} (${cat.slug}) - Parent: ${cat.parent || 'none'}`);
    });

    // Compter les catégories parentes
    const parentCategories = data.filter(cat => cat.parent === 0);
    console.log(`\n✓ Total categories: ${data.length}`);
    console.log(`✓ Parent categories: ${parentCategories.length}`);

    if (parentCategories.length > 0) {
      console.log('\nParent categories:');
      parentCategories.slice(0, 15).forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`);
      });
    }

    if (data.length >= 69) {
      console.log('\n✓✓✓ SUCCESS: All categories loaded! ✓✓✓');
    } else {
      console.log(`\n⚠ WARNING: Expected 69 categories, got ${data.length}`);
    }

  } catch (error) {
    console.log('✗ EXCEPTION:', error.message);
    console.log(error);
  }
}

testCategoriesAPI().catch(console.error);
