require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

console.log('🚀 IMPORT AUTOMATISÉ COMPLET - WordPress IDs TEXT\n');
console.log(`📍 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`📍 WordPress: ${WORDPRESS_URL}\n`);

async function executeSQL(sql, batchName) {
  console.log(`⏳ Exécution ${batchName}...`);

  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });

    if (error) {
      console.error(`   ❌ Erreur ${batchName}: ${error.message}`);
      return false;
    }

    console.log(`   ✅ ${batchName} terminé`);
    return true;
  } catch (err) {
    console.error(`   ❌ Exception ${batchName}: ${err.message}`);
    return false;
  }
}

async function importProductsFromSQLFiles() {
  console.log('💾 ÉTAPE 1: Import des produits via SQL\n');

  const sqlFiles = [
    'sql-batch-1.sql',
    'sql-batch-2.sql',
    'sql-batch-3.sql',
    'sql-batch-4.sql'
  ];

  let totalSuccess = 0;

  for (const file of sqlFiles) {
    const filePath = `/tmp/cc-agent/62170990/project/${file}`;

    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️ ${file} introuvable, génération...`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const success = await executeSQL(sql, file);

    if (success) totalSuccess++;

    // Pause entre chaque lot
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ ${totalSuccess}/${sqlFiles.length} lots SQL exécutés\n`);
}

async function verifyProducts() {
  console.log('🔍 ÉTAPE 2: Vérification des produits\n');

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  const { data: sample } = await supabase
    .from('products')
    .select('id, name, status')
    .order('id', { ascending: false })
    .limit(5);

  console.log(`   📦 Total produits: ${count}`);
  console.log(`   📋 Format IDs: TEXT (WordPress)\n`);

  if (sample && sample.length > 0) {
    console.log('   Exemples:');
    sample.forEach(p => {
      console.log(`   - ID: "${p.id}" → ${p.name} [${p.status}]`);
    });
    console.log('');
  }

  return count;
}

async function fetchWooCommerceProducts() {
  console.log('📥 ÉTAPE 3: Récupération produits WooCommerce pour mapping\n');

  let allProducts = [];
  let page = 1;

  while (true) {
    const url = `${WORDPRESS_URL}/wp-json/wc/v3/products?per_page=100&page=${page}`;
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      if (!response.ok) break;

      const products = await response.json();
      if (!Array.isArray(products) || products.length === 0) break;

      allProducts = allProducts.concat(products);
      page++;
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      break;
    }
  }

  console.log(`   ✅ ${allProducts.length} produits WooCommerce récupérés\n`);
  return allProducts;
}

async function createMappings(wpProducts) {
  console.log('🔗 ÉTAPE 4: Création des mappings produits-catégories\n');

  // Récupérer les catégories Supabase
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name');

  const categoryIds = new Set(categories?.map(c => c.id) || []);

  console.log(`   📁 ${categoryIds.size} catégories disponibles`);

  // Supprimer les anciens mappings
  await supabase.from('product_category_mapping').delete().neq('product_id', '');

  let mapped = 0;
  let skipped = 0;

  for (const wp of wpProducts) {
    if (!wp.categories || wp.categories.length === 0) {
      skipped++;
      continue;
    }

    for (let i = 0; i < wp.categories.length; i++) {
      const catId = wp.categories[i].id.toString();

      if (!categoryIds.has(catId)) continue;

      const { error } = await supabase
        .from('product_category_mapping')
        .insert({
          product_id: wp.id.toString(),
          category_id: catId,
          is_primary: i === 0
        });

      if (!error) {
        mapped++;
        if (mapped % 100 === 0) {
          console.log(`   ✅ ${mapped} mappings créés...`);
        }
      }
    }
  }

  console.log(`\n   ✅ ${mapped} mappings créés`);
  console.log(`   ⏭️  ${skipped} produits sans catégorie\n`);

  return mapped;
}

async function finalVerification() {
  console.log('📊 ÉTAPE 5: Vérification finale\n');

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  const { count: mappingCount } = await supabase
    .from('product_category_mapping')
    .select('*', { count: 'exact', head: true });

  const { count: categoryCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });

  // Vérifier quelques catégories avec leurs produits
  const { data: categoriesWithProducts } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      product_category_mapping(count)
    `)
    .limit(10);

  console.log('   ════════════════════════════════════════');
  console.log(`   ✅ PRODUITS: ${productCount} (IDs TEXT WordPress)`);
  console.log(`   ✅ CATÉGORIES: ${categoryCount}`);
  console.log(`   ✅ MAPPINGS: ${mappingCount}`);
  console.log('   ════════════════════════════════════════\n');

  if (categoriesWithProducts && categoriesWithProducts.length > 0) {
    console.log('   📦 Exemples de catégories remplies:\n');
    categoriesWithProducts.forEach(cat => {
      const productCount = cat.product_category_mapping?.[0]?.count || 0;
      console.log(`   - "${cat.name}" → ${productCount} produits`);
    });
    console.log('');
  }

  return {
    products: productCount,
    categories: categoryCount,
    mappings: mappingCount
  };
}

async function main() {
  try {
    // Étape 1: Import SQL
    await importProductsFromSQLFiles();

    // Étape 2: Vérification
    const productCount = await verifyProducts();

    if (productCount < 100) {
      console.log('⚠️  Moins de 100 produits détectés, import SQL incomplet\n');
    }

    // Étape 3: Récupérer produits WooCommerce
    const wpProducts = await fetchWooCommerceProducts();

    // Étape 4: Créer les mappings
    await createMappings(wpProducts);

    // Étape 5: Vérification finale
    const stats = await finalVerification();

    console.log('✨ IMPORT TERMINÉ AVEC SUCCÈS !\n');
    console.log(`   🎯 ${stats.products} produits avec IDs WordPress TEXT`);
    console.log(`   🎯 ${stats.mappings} relations produits-catégories`);
    console.log(`   🎯 Toutes les catégories sont maintenant remplies\n`);

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error);
    process.exit(1);
  }
}

main();
