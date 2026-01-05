require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...\n');

  // Supprimer les mappings
  const { error: mappingError } = await supabase
    .from('product_category_mapping')
    .delete()
    .neq('product_id', '');

  if (mappingError) {
    console.error('❌ Erreur suppression mappings:', mappingError.message);
  } else {
    console.log('✅ Mappings supprimés');
  }

  // Supprimer les featured_products
  const { error: featuredError } = await supabase
    .from('featured_products')
    .delete()
    .neq('product_id', '');

  if (featuredError) {
    console.error('❌ Erreur suppression featured:', featuredError.message);
  } else {
    console.log('✅ Featured products supprimés');
  }

  // Supprimer les product_images
  const { error: imagesError } = await supabase
    .from('product_images')
    .delete()
    .neq('product_id', '');

  if (imagesError) {
    console.error('❌ Erreur suppression images:', imagesError.message);
  } else {
    console.log('✅ Product images supprimés');
  }

  // Supprimer les produits
  const { error: productsError } = await supabase
    .from('products')
    .delete()
    .neq('id', '');

  if (productsError) {
    console.error('❌ Erreur suppression produits:', productsError.message);
  } else {
    console.log('✅ Produits supprimés\n');
  }
}

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

async function importProductsToSupabase(wpProducts) {
  console.log('💾 Import des produits dans Supabase...\n');

  let imported = 0;
  let errors = 0;

  for (const wpProduct of wpProducts) {
    try {
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
        images: JSON.stringify(wpProduct.images || [])
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) {
        console.error(`   ❌ Produit ${wpProduct.id}: ${error.message}`);
        errors++;
      } else {
        imported++;
        if (imported % 10 === 0) {
          console.log(`   ✅ ${imported} produits importés...`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Produit ${wpProduct.id}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Import terminé: ${imported} produits, ${errors} erreurs\n`);
  return imported;
}

async function createCategoryMappings(wpProducts) {
  console.log('🔗 Création des mappings produits-catégories...\n');

  let mapped = 0;
  let skipped = 0;
  let errors = 0;

  const { data: supabaseCategories } = await supabase
    .from('categories')
    .select('id');

  const categoryIds = new Set(supabaseCategories?.map(c => c.id) || []);
  console.log(`   📁 ${categoryIds.size} catégories disponibles\n`);

  for (const wpProduct of wpProducts) {
    const productId = wpProduct.id.toString();

    if (!wpProduct.categories || wpProduct.categories.length === 0) {
      skipped++;
      continue;
    }

    for (let i = 0; i < wpProduct.categories.length; i++) {
      const category = wpProduct.categories[i];
      const categoryId = category.id.toString();

      if (!categoryIds.has(categoryId)) {
        continue;
      }

      try {
        const { error } = await supabase
          .from('product_category_mapping')
          .insert({
            product_id: productId,
            category_id: categoryId,
            is_primary: i === 0,
            display_order: i
          });

        if (error) {
          errors++;
        } else {
          mapped++;
        }
      } catch (error) {
        errors++;
      }
    }
  }

  console.log(`\n✅ Mappings créés: ${mapped}, ignorés: ${skipped}, erreurs: ${errors}\n`);
}

async function main() {
  console.log('🚀 NETTOYAGE ET RÉIMPORT COMPLET\n');
  console.log(`📍 WordPress: ${WORDPRESS_URL}`);
  console.log(`📍 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  try {
    // 1. Nettoyer
    await cleanDatabase();

    // 2. Récupérer
    const wpProducts = await fetchWooCommerceProducts();

    if (wpProducts.length === 0) {
      console.log('⚠️ Aucun produit trouvé');
      return;
    }

    // 3. Importer
    await importProductsToSupabase(wpProducts);

    // 4. Mapper
    await createCategoryMappings(wpProducts);

    // 5. Vérifier
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: mappingCount } = await supabase
      .from('product_category_mapping')
      .select('*', { count: 'exact', head: true });

    const { data: sampleProducts } = await supabase
      .from('products')
      .select('id, name')
      .limit(3);

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
