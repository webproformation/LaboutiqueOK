require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

async function fetchWooCommerceCategories() {
  console.log('📁 Récupération des catégories WooCommerce...\n');

  let allCategories = [];
  let page = 1;

  while (true) {
    const url = `${WORDPRESS_URL}/wp-json/wc/v3/products/categories?per_page=100&page=${page}`;
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      if (!response.ok) break;

      const categories = await response.json();
      if (!Array.isArray(categories) || categories.length === 0) break;

      console.log(`   Page ${page}: ${categories.length} catégories`);
      allCategories = allCategories.concat(categories);
      page++;
    } catch (error) {
      break;
    }
  }

  console.log(`✅ ${allCategories.length} catégories récupérées\n`);
  return allCategories;
}

async function importCategories(wpCategories) {
  console.log('💾 Import des catégories...\n');

  let imported = 0;
  let errors = 0;

  for (const cat of wpCategories) {
    const categoryData = {
      id: cat.id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parent_id: cat.parent ? cat.parent.toString() : null,
      image_url: cat.image?.src || null,
      display_order: cat.menu_order || 0
    };

    const { error } = await supabase
      .from('categories')
      .upsert(categoryData, { onConflict: 'id' });

    if (error) {
      console.error(`   ❌ ${cat.name}: ${error.message}`);
      errors++;
    } else {
      imported++;
      if (imported % 10 === 0) {
        console.log(`   ✅ ${imported} catégories importées...`);
      }
    }
  }

  console.log(`\n✅ Import catégories: ${imported} réussis, ${errors} erreurs\n`);
  return imported;
}

async function main() {
  console.log('🚀 IMPORT DES CATÉGORIES WORDPRESS\n');

  try {
    const wpCategories = await fetchWooCommerceCategories();
    await importCategories(wpCategories);

    const { count } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    const { data: sample } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(10);

    console.log('📊 RÉSULTAT:');
    console.log(`   ✅ ${count} catégories dans Supabase\n`);

    if (sample && sample.length > 0) {
      console.log('   Exemples:');
      sample.forEach(c => {
        console.log(`   - ID: "${c.id}" → ${c.name} (/${c.slug})`);
      });
    }

    console.log('\n✨ Import catégories terminé!\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();
