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
  console.log('📥 Récupération des produits depuis WooCommerce...');

  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${WORDPRESS_URL}/wp-json/wc/v3/products?per_page=100&page=${page}`;
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Erreur HTTP: ${response.status}`);
        break;
      }

      const products = await response.json();

      if (!Array.isArray(products) || products.length === 0) {
        hasMore = false;
      } else {
        console.log(`   📄 Page ${page}: ${products.length} produits`);
        allProducts = allProducts.concat(products);
        page++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Erreur: ${error.message}`);
      hasMore = false;
    }
  }

  console.log(`✅ ${allProducts.length} produits récupérés\n`);
  return allProducts;
}

async function importViaSQL(wpProducts) {
  console.log('💾 Import des produits via SQL...\n');

  const productInserts = [];
  const mappingInserts = [];

  // Récupérer les catégories existantes
  const { data: supabaseCategories } = await supabase
    .from('categories')
    .select('id');

  const categoryIds = new Set(supabaseCategories?.map(c => c.id) || []);

  for (const wpProduct of wpProducts) {
    const id = wpProduct.id.toString();
    const name = wpProduct.name.replace(/'/g, "''");
    const slug = wpProduct.slug.replace(/'/g, "''");
    const description = (wpProduct.description || '').replace(/'/g, "''");
    const regularPrice = parseFloat(wpProduct.regular_price) || 0;
    const salePrice = wpProduct.sale_price ? parseFloat(wpProduct.sale_price) : null;
    const stockQty = wpProduct.stock_quantity || 0;
    const status = wpProduct.status || 'draft';
    const imageUrl = wpProduct.images?.[0]?.src || null;
    const images = JSON.stringify(wpProduct.images || []).replace(/'/g, "''");

    productInserts.push(`
      ('${id}', '${name}', '${slug}', '${description}', ${regularPrice}, ${salePrice}, ${stockQty}, '${status}', ${imageUrl ? `'${imageUrl}'` : 'NULL'}, '${images}'::jsonb)
    `);

    // Mappings
    if (wpProduct.categories && wpProduct.categories.length > 0) {
      for (let i = 0; i < wpProduct.categories.length; i++) {
        const categoryId = wpProduct.categories[i].id.toString();
        if (categoryIds.has(categoryId)) {
          mappingInserts.push(`
            ('${id}', '${categoryId}', ${i === 0}, ${i})
          `);
        }
      }
    }
  }

  // Insert products un par un pour éviter les problèmes
  console.log(`Insertion de ${wpProducts.length} produits...`);

  let imported = 0;
  let errors = 0;

  for (const wpProduct of wpProducts) {
    const productData = {
      id: wpProduct.id.toString(),
      name: wpProduct.name,
      slug: wpProduct.slug,
      description: wpProduct.description || '',
      regular_price: parseFloat(wpProduct.regular_price) || 0,
      sale_price: wpProduct.sale_price ? parseFloat(wpProduct.sale_price) : null,
      stock_quantity: wpProduct.stock_quantity || 0,
      status: wpProduct.status || 'draft',
      image_url: wpProduct.images?.[0]?.src || null,
      images: wpProduct.images || []
    };

    const { error } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error(`   ❌ Produit ${wpProduct.id}: ${error.message}`);
      errors++;
    } else {
      imported++;
      if (imported % 20 === 0) {
        console.log(`   ✅ ${imported} produits importés...`);
      }
    }
  }

  console.log(`\nImport produits: ${imported} réussis, ${errors} erreurs`);

  // Insert mappings
  console.log(`\nInsertion de ${mappingInserts.length} mappings...`);

  for (let i = 0; i < mappingInserts.length; i += 100) {
    const batch = mappingInserts.slice(i, i + 100);

    const mappings = batch.map(m => {
      const match = m.match(/'([^']+)', '([^']+)', (true|false), (\d+)/);
      if (match) {
        return {
          product_id: match[1],
          category_id: match[2],
          is_primary: match[3] === 'true',
          display_order: parseInt(match[4])
        };
      }
      return null;
    }).filter(Boolean);

    const { error } = await supabase
      .from('product_category_mapping')
      .upsert(mappings, { onConflict: 'product_id,category_id' });

    if (error) {
      console.error(`   ❌ Erreur mappings ${i}-${i + 100}:`, error.message);
    } else {
      console.log(`   ✅ Mappings ${i}-${i + 100} créés`);
    }
  }

  console.log('\n✅ Import terminé!\n');
}

async function main() {
  console.log('🚀 IMPORT DIRECT VIA SQL\n');
  console.log(`📍 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  try {
    const wpProducts = await fetchWooCommerceProducts();
    if (wpProducts.length === 0) {
      console.log('⚠️ Aucun produit trouvé');
      return;
    }

    await importViaSQL(wpProducts);

    // Vérifier
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: mappingCount } = await supabase
      .from('product_category_mapping')
      .select('*', { count: 'exact', head: true });

    const { data: sampleProducts } = await supabase
      .from('products')
      .select('id, name')
      .limit(5);

    console.log('📊 RÉSULTAT FINAL:');
    console.log(`   ✅ Produits: ${productCount}`);
    console.log(`   ✅ Mappings: ${mappingCount}`);
    console.log('\n📦 Exemples d\'IDs:');
    sampleProducts?.forEach(p => {
      console.log(`   - ID: "${p.id}" → ${p.name}`);
    });

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }

  console.log('\n✨ Script terminé!\n');
}

main();
