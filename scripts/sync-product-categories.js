require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const wcConsumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
const wcConsumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
const wordpressUrl = process.env.WORDPRESS_URL;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchWooCommerceProducts(page = 1, allProducts = []) {
  try {
    const auth = Buffer.from(`${wcConsumerKey}:${wcConsumerSecret}`).toString('base64');
    const url = `${wordpressUrl}/wp-json/wc/v3/products?per_page=100&page=${page}`;

    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      };

      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', async () => {
          try {
            // Vérifier si la réponse est du HTML (erreur WordPress)
            if (data.trim().startsWith('<')) {
              console.error('❌ Réponse HTML reçue au lieu de JSON (probablement un rate limit)');
              console.log('   ⏳ Attente de 5 secondes...');
              await new Promise(resolve => setTimeout(resolve, 5000));
              const retryProducts = await fetchWooCommerceProducts(page, allProducts);
              resolve(retryProducts);
              return;
            }

            const products = JSON.parse(data);
            const totalPages = parseInt(res.headers['x-wp-totalpages'] || '1');

            allProducts = allProducts.concat(products);

            if (page < totalPages) {
              console.log(`   📄 Page ${page}/${totalPages} récupérée...`);
              // Attendre 1 seconde entre les pages
              await new Promise(resolve => setTimeout(resolve, 1000));
              const nextProducts = await fetchWooCommerceProducts(page + 1, allProducts);
              resolve(nextProducts);
            } else {
              resolve(allProducts);
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

async function syncProductCategories() {
  console.log('\n🔄 Début de la synchronisation des catégories produits...\n');

  try {
    // Récupérer tous les produits depuis WooCommerce
    console.log('📥 Récupération des produits depuis WooCommerce...');
    const wpProducts = await fetchWooCommerceProducts();
    console.log(`✅ ${wpProducts.length} produits récupérés\n`);

    // Récupérer tous les produits depuis Supabase
    const { data: supabaseProducts } = await supabase
      .from('products')
      .select('id');

    const supabaseProductIds = new Set(supabaseProducts?.map(p => p.id) || []);
    console.log(`📦 ${supabaseProductIds.size} produits dans Supabase`);

    // Débug: afficher quelques IDs
    const sampleSupabaseIds = Array.from(supabaseProductIds).slice(0, 5);
    console.log(`   Exemples IDs Supabase: ${sampleSupabaseIds.join(', ')}\n`);

    let mapped = 0;
    let skipped = 0;
    let errors = 0;

    // Débug: afficher quelques IDs WordPress
    const sampleWpIds = wpProducts.slice(0, 5).map(p => p.id.toString());
    console.log(`   Exemples IDs WordPress: ${sampleWpIds.join(', ')}\n`);

    for (const wpProduct of wpProducts) {
      const productId = wpProduct.id.toString();

      // Vérifier si le produit existe dans Supabase
      if (!supabaseProductIds.has(productId)) {
        if (skipped < 3) {
          console.log(`   ⚠️ Produit WP ${productId} (${wpProduct.name}) non trouvé dans Supabase`);
        }
        skipped++;
        continue;
      }

      if (!wpProduct.categories || wpProduct.categories.length === 0) {
        skipped++;
        continue;
      }

      console.log(`\n🔗 ${wpProduct.name} (ID: ${productId})`);
      console.log(`   ${wpProduct.categories.length} catégorie(s) à mapper`);

      for (const category of wpProduct.categories) {
        const categoryId = category.id.toString();

        // Vérifier que la catégorie existe dans Supabase
        const { data: categoryExists, error: checkError } = await supabase
          .from('categories')
          .select('id')
          .eq('id', categoryId)
          .maybeSingle();

        if (checkError) {
          console.error(`   ❌ Erreur vérification catégorie ${categoryId}:`, checkError.message);
          errors++;
          continue;
        }

        if (!categoryExists) {
          console.log(`   ⚠️ Catégorie ${category.name} (${categoryId}) n'existe pas dans Supabase`);
          continue;
        }

        // Créer le mapping
        const { error: mappingError } = await supabase
          .from('product_category_mapping')
          .upsert({
            product_id: productId,
            category_id: categoryId
          }, {
            onConflict: 'product_id,category_id',
            ignoreDuplicates: false
          });

        if (mappingError) {
          console.error(`   ❌ Erreur mapping:`, mappingError.message);
          errors++;
        } else {
          console.log(`   ✅ Mappé avec ${category.name}`);
          mapped++;
        }
      }
    }

    console.log('\n\n✅ Synchronisation terminée!\n');

    const { count: totalMappings } = await supabase
      .from('product_category_mapping')
      .select('*', { count: 'exact', head: true });

    const { count: productsWithCategories } = await supabase
      .from('product_category_mapping')
      .select('product_id', { count: 'exact', head: true });

    console.log(`📊 Résumé:`);
    console.log(`   - Produits WordPress: ${wpProducts.length}`);
    console.log(`   - Produits Supabase: ${supabaseProductIds.size}`);
    console.log(`   - Mappings créés: ${mapped}`);
    console.log(`   - Ignorés: ${skipped}`);
    console.log(`   - Erreurs: ${errors}`);
    console.log(`   - Total relations: ${totalMappings || 0}`);
    console.log(`   - Produits avec catégories: ${productsWithCategories || 0}`);

  } catch (error) {
    console.error('\n❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
}

syncProductCategories()
  .then(() => {
    console.log('\n✨ Script terminé!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
