const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateImages() {
  console.log('🔍 Scanning Storage Supabase...\n');

  // 1. Liste tous les fichiers du storage
  const { data: files, error: storageError } = await supabase.storage
    .from('product-images')
    .list('products', { limit: 1000 });

  if (storageError) {
    console.error('❌ Error listing storage files:', storageError.message);
    return;
  }

  console.log(`✅ Found ${files.length} files in Storage\n`);

  // 2. Crée un mapping product_id → filename
  const imageMap = {};
  files.forEach(file => {
    // Format: product-{ID}-{timestamp}.{ext}
    const match = file.name.match(/^product-(\d+)-/);
    if (match) {
      const productId = match[1];
      imageMap[productId] = file.name;
    }
  });

  console.log(`📋 Mapped ${Object.keys(imageMap).length} products to images\n`);

  // 3. Récupère tous les produits
  const { data: products, error: dbError } = await supabase
    .from('products')
    .select('id, name, image_url')
    .order('id');

  if (dbError) {
    console.error('❌ Error fetching products:', dbError.message);
    return;
  }

  console.log(`📦 Found ${products.length} products in database\n`);

  // 4. Met à jour les URLs
  let updated = 0;
  let notFound = 0;
  let skipped = 0;

  for (const product of products) {
    const filename = imageMap[product.id];

    if (!filename) {
      notFound++;
      console.log(`⚠️  Product ${product.id} (${product.name}): No image in storage`);
      continue;
    }

    // Construction de la nouvelle URL
    const newUrl = `${supabaseUrl}/storage/v1/object/public/product-images/products/${filename}`;

    // Vérifie si déjà migré
    if (product.image_url && product.image_url.includes('qcqbtmvbvipsxwjlgjvk.supabase.co')) {
      skipped++;
      continue;
    }

    // Met à jour
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: newUrl })
      .eq('id', product.id);

    if (updateError) {
      console.log(`❌ Error updating product ${product.id}:`, updateError.message);
    } else {
      updated++;
      console.log(`✅ Product ${product.id}: ${filename}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updated} products`);
  console.log(`⏭️  Skipped: ${skipped} products (already migrated)`);
  console.log(`⚠️  Not found: ${notFound} products (no image in storage)`);
  console.log(`📦 Total: ${products.length} products`);
  console.log('='.repeat(60) + '\n');
}

migrateImages().catch(console.error);
