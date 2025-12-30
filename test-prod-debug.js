async function testProductionWithDebug() {
  console.log('\n=== Test Production with Debug Mode ===\n');

  const prodUrl = 'https://www.laboutiquedemorgane.com/api/woocommerce/categories?action=list&debug=true';

  try {
    console.log(`Calling: ${prodUrl}\n`);

    const startTime = Date.now();
    const response = await fetch(prodUrl);
    const duration = Date.now() - startTime;

    console.log(`Status: ${response.status} (${duration}ms)\n`);

    const data = await response.json();

    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.error) {
      console.log('\n✗ ERROR DETECTED:');
      console.log(`  Message: ${data.error}`);
      if (data.debug) {
        console.log('\n  Debug Info:');
        console.log(`    WordPress URL: ${data.debug.wordpressUrl || 'NOT SET'}`);
        console.log(`    Has Consumer Key: ${data.debug.hasConsumerKey || false}`);
        console.log(`    Has Consumer Secret: ${data.debug.hasConsumerSecret || false}`);
      }
      if (data.stack) {
        console.log('\n  Stack Trace:');
        console.log(data.stack);
      }
    } else if (Array.isArray(data)) {
      console.log(`\n✓ SUCCESS: ${data.length} categories returned`);
      if (data.length > 0) {
        console.log('\nFirst 5 categories:');
        data.slice(0, 5).forEach(cat => {
          console.log(`  - [${cat.id}] ${cat.name} (${cat.slug})`);
        });
      }
    } else {
      console.log('\n⚠ WARNING: Unexpected response format');
    }

  } catch (error) {
    console.log('✗ EXCEPTION:', error.message);
  }
}

testProductionWithDebug().catch(console.error);
