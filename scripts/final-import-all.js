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
  console.log('📥 Récupération des produits WooCommerce...\n');
  let allProducts = [];
  let page = 1;

  while (true) {
    const url = `${WORDPRESS_URL}/wp-json/wc/v3/products?per_page=100&page=${page}`;
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

    const response = await fetch(url, { headers: { 'Authorization': `Basic ${auth}` }});
    if (!response.ok) break;

    const products = await response.json();
    if (!Array.isArray(products) || products.length === 0) break;

    console.log(`   Page ${page}: ${products.length} produits`);
    allProducts = allProducts.concat(products);
    page++;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`✅ ${allProducts.length} produits récupérés\n`);
  return allProducts;
}

async function importProducts(wpProducts) {
  console.log('💾 Import des produits...\n');
  let imported = 0;
  let errors = 0;

  for (const wp of wpProducts) {
    const id = wp.id.toString();
    const name = (wp.name || '').replace(/'/g, "''").substring(0, 200);
    const slug = wp.slug.replace(/'/g, "''");
    const desc = (wp.description || '').replace(/'/g, "''").substring(0, 500);
    const regPrice = parseFloat(wp.regular_price) || 0;
    const salePrice = wp.sale_price ? parseFloat(wp.sale_price) : null;
    const stock = wp.stock_quantity || 0;
    const status = wp.status || 'draft';
    const imgUrl = wp.images?.[0]?.src ? `'${wp.images[0].src}'` : 'NULL';

    const sql = `
      INSERT INTO products (id, name, slug, description, regular_price, sale_price, stock_quantity, status, image_url, images)
      VALUES ('${id}', '${name}', '${slug}', '${desc}', ${regPrice}, ${salePrice !== null ? salePrice : 'NULL'}, ${stock}, '${status}', ${imgUrl}, '[]'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `;

    try {
      await supabase.rpc('execute_sql', { query: sql });
      imported++;
      if (imported % 10 === 0) console.log(`   ✅ ${imported} produits importés...`);
    } catch (error) {
      errors++;
    }
  }

  console.log(`\n✅ Import produits: ${imported} réussis, ${errors} erreurs\n`);
  return wpProducts;
}

async function importMappings(wpProducts) {
  console.log('🔗 Import des mappings...\n');
  let mapped = 0;

  const { data: categories } = await supabase.from('categories').select('id');
  const categoryIds = new Set(categories?.map(c => c.id) || []);

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
        }, { onConflict: 'product_id,category_id', ignoreDuplicates: true });

      if (!error) mapped++;
    }
  }

  console.log(`✅ ${mapped} mappings créés\n`);
}

async function verify() {
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: mappingCount } = await supabase.from('product_category_mapping').select('*', { count: 'exact', head: true });
  const { data: sample } = await supabase.from('products').select('id, name').limit(5);

  console.log('📊 RÉSULTAT FINAL:');
  console.log(`   ✅ Produits: ${productCount}`);
  console.log(`   ✅ Mappings: ${mappingCount}\n`);
  console.log('📦 Exemples:');
  sample?.forEach(p => console.log(`   - ID: "${p.id}" → ${p.name}`));
}

async function main() {
  console.log('🚀 IMPORT COMPLET WooCommerce → Supabase\n');

  try {
    const wpProducts = await fetchWooCommerceProducts();
    await importProducts(wpProducts);
    await importMappings(wpProducts);
    await verify();
    console.log('\n✨ Import terminé avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

main();
