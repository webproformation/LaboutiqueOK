require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

async function fetchWooCommerceProducts() {
  console.log('📥 Récupération des produits...\n');
  let allProducts = [];
  let page = 1;

  while (true) {
    const url = `${WORDPRESS_URL}/wp-json/wc/v3/products?per_page=100&page=${page}`;
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response = await fetch(url, { headers: { 'Authorization': `Basic ${auth}` }});
    if (!response.ok) break;

    const products = await response.json();
    if (!Array.isArray(products) || products.length === 0) break;

    allProducts = allProducts.concat(products);
    page++;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`✅ ${allProducts.length} produits récupérés\n`);
  return allProducts;
}

async function importWithSupabaseClient(wpProducts) {
  console.log('💾 Import via Supabase Client...\n');

  // Vérifier quels produits existent déjà
  const { data: existing } = await supabase.from('products').select('id');
  const existingIds = new Set(existing?.map(p => p.id) || []);

  const toImport = wpProducts.filter(p => !existingIds.has(p.id.toString()));
  console.log(`   ${existingIds.size} produits déjà importés`);
  console.log(`   ${toImport.length} produits à importer\n`);

  let imported = 0;
  let errors = 0;

  for (const wp of toImport) {
    try {
      const productData = {
        id: wp.id.toString(),
        name: wp.name.substring(0, 255),
        slug: wp.slug,
        description: (wp.description || '').substring(0, 5000),
        regular_price: parseFloat(wp.regular_price) || 0,
        sale_price: wp.sale_price ? parseFloat(wp.sale_price) : null,
        stock_quantity: wp.stock_quantity || 0,
        status: wp.status || 'draft',
        image_url: wp.images?.[0]?.src || null,
        images: wp.images || []
      };

      const { error } = await supabase.from('products').insert(productData);

      if (error) {
        console.error(`   ❌ ${wp.id}: ${error.message}`);
        errors++;
      } else {
        imported++;
        if (imported % 20 === 0) console.log(`   ✅ ${imported} produits importés...`);
      }
    } catch (err) {
      errors++;
    }
  }

  console.log(`\n✅ Import: ${imported} réussis, ${errors} erreurs\n`);
  return wpProducts;
}

async function createMappings(wpProducts) {
  console.log('🔗 Création des mappings...\n');

  const { data: categories } = await supabase.from('categories').select('id');
  const categoryIds = new Set(categories?.map(c => c.id) || []);
  console.log(`   ${categoryIds.size} catégories disponibles\n`);

  let mapped = 0;
  let errors = 0;

  for (const wp of wpProducts) {
    if (!wp.categories || wp.categories.length === 0) continue;

    for (let i = 0; i < wp.categories.length; i++) {
      const catId = wp.categories[i].id.toString();
      if (!categoryIds.has(catId)) continue;

      const { error } = await supabase
        .from('product_category_mapping')
        .upsert({
          product_id: wp.id.toString(),
          category_id: catId,
          is_primary: i === 0
        }, { onConflict: 'product_id,category_id' });

      if (error) {
        errors++;
      } else {
        mapped++;
        if (mapped % 50 === 0) console.log(`   ✅ ${mapped} mappings créés...`);
      }
    }
  }

  console.log(`\n✅ Mappings: ${mapped} créés, ${errors} erreurs\n`);
}

async function verify() {
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: mappingCount } = await supabase.from('product_category_mapping').select('*', { count: 'exact', head: true });
  const { data: sample } = await supabase.from('products').select('id, name').order('id', { ascending: false }).limit(5);

  console.log('📊 RÉSULTAT FINAL:');
  console.log(`   ✅ ${productCount} produits dans Supabase`);
  console.log(`   ✅ ${mappingCount} relations produits-catégories\n`);
  console.log('📦 Derniers produits importés:');
  sample?.forEach(p => console.log(`   - ID: "${p.id}" → ${p.name}`));
  console.log('');
}

async function main() {
  console.log('🚀 IMPORT COMPLET - WORDPRESS IDs TEXT\n');

  try {
    const wpProducts = await fetchWooCommerceProducts();
    await importWithSupabaseClient(wpProducts);
    await createMappings(wpProducts);
    await verify();
    console.log('✨ Import terminé avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

main();
