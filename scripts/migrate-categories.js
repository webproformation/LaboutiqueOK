require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const sharp = require('sharp');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const wcConsumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
const wcConsumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
const wordpressUrl = process.env.WORDPRESS_URL;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function convertToWebP(imageBuffer) {
  try {
    return await sharp(imageBuffer)
      .webp({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.error('Error converting to WebP:', error);
    return imageBuffer;
  }
}

async function uploadImageToSupabase(imageBuffer, filename) {
  try {
    const webpBuffer = await convertToWebP(imageBuffer);
    const webpFilename = filename.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    const filePath = `categories/${Date.now()}-${webpFilename}`;

    const { data, error } = await supabase.storage
      .from('category-images')
      .upload(filePath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('category-images')
      .getPublicUrl(filePath);

    await supabase.from('media').insert({
      filename: webpFilename,
      file_path: filePath,
      url: publicUrl,
      bucket_name: 'category-images',
      file_size: webpBuffer.length,
      mime_type: 'image/webp',
      is_optimized: true,
      usage_count: 1,
      is_orphan: false,
    });

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

async function fetchWooCommerceCategories(page = 1, allCategories = []) {
  try {
    const auth = Buffer.from(`${wcConsumerKey}:${wcConsumerSecret}`).toString('base64');
    const url = `${wordpressUrl}/wp-json/wc/v3/products/categories?per_page=100&page=${page}`;

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
            const categories = JSON.parse(data);
            const totalPages = parseInt(res.headers['x-wp-totalpages'] || '1');

            allCategories = allCategories.concat(categories);

            if (page < totalPages) {
              const nextCategories = await fetchWooCommerceCategories(page + 1, allCategories);
              resolve(nextCategories);
            } else {
              resolve(allCategories);
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
    console.error('Error fetching categories:', error);
    throw error;
  }
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function migrateCategories() {
  console.log('\n🚀 Début de la migration des catégories...\n');

  try {
    console.log('📥 Récupération des catégories depuis WooCommerce...');
    const wpCategories = await fetchWooCommerceCategories();
    console.log(`✅ ${wpCategories.length} catégories récupérées\n`);

    const categoryMap = new Map();

    for (const wpCategory of wpCategories) {
      console.log(`\n📦 Traitement de la catégorie: ${wpCategory.name} (ID WordPress: ${wpCategory.id})`);

      let imageUrl = null;

      if (wpCategory.image && wpCategory.image.src) {
        console.log(`  📸 Téléchargement de l'image...`);
        try {
          const imageBuffer = await downloadImage(wpCategory.image.src);
          console.log(`  ✅ Image téléchargée (${imageBuffer.length} bytes)`);

          console.log(`  🔄 Conversion en WebP et upload vers Supabase...`);
          imageUrl = await uploadImageToSupabase(imageBuffer, wpCategory.image.name || `category-${wpCategory.id}.jpg`);

          if (imageUrl) {
            console.log(`  ✅ Image uploadée: ${imageUrl}`);
          }
        } catch (error) {
          console.error(`  ❌ Erreur lors du traitement de l'image:`, error.message);
        }
      }

      const slug = generateSlug(wpCategory.name);

      const categoryData = {
        id: wpCategory.id.toString(),
        name: wpCategory.name,
        slug: slug,
        description: wpCategory.description || '',
        parent_id: null,
        image_url: imageUrl,
        display_order: wpCategory.menu_order || 0,
      };

      console.log(`  💾 Insertion dans Supabase...`);
      const { data: insertedCategory, error } = await supabase
        .from('categories')
        .upsert(categoryData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Erreur lors de l'insertion:`, error);
      } else {
        console.log(`  ✅ Catégorie créée avec succès (ID Supabase: ${insertedCategory.id})`);
        categoryMap.set(wpCategory.id.toString(), insertedCategory.id);
      }
    }

    console.log('\n\n🔗 Mise à jour des relations parent-enfant...');
    for (const wpCategory of wpCategories) {
      if (wpCategory.parent > 0) {
        const categoryId = categoryMap.get(wpCategory.id.toString());
        const parentId = categoryMap.get(wpCategory.parent.toString());

        if (categoryId && parentId) {
          await supabase
            .from('categories')
            .update({ parent_id: parentId })
            .eq('id', categoryId);

          console.log(`  ✅ ${wpCategory.name} → parent: ${wpCategory.parent}`);
        }
      }
    }

    console.log('\n\n🔗 Réaffectation des catégories aux produits...');

    // Récupérer tous les produits existants
    const { data: products } = await supabase
      .from('products')
      .select('*');

    console.log(`   📦 ${products?.length || 0} produits trouvés`);

    if (products) {
      for (const product of products) {
        // Chercher les catégories dans différents champs possibles
        let categories = [];

        if (product.categories && Array.isArray(product.categories)) {
          categories = product.categories;
        } else if (typeof product.categories === 'string') {
          try {
            categories = JSON.parse(product.categories);
          } catch (e) {
            // Ignore parsing errors
          }
        }

        if (categories.length > 0) {
          const categoryIds = categories
            .map(cat => {
              const wpId = typeof cat === 'object' ? cat.id?.toString() : cat.toString();
              return wpId;
            })
            .filter(Boolean);

          if (categoryIds.length > 0) {
            const primaryCategoryId = categoryIds[0];

            // Créer les relations dans product_category_mapping
            for (const categoryId of categoryIds) {
              // Vérifier que la catégorie existe
              const { data: categoryExists } = await supabase
                .from('categories')
                .select('id')
                .eq('id', categoryId)
                .single();

              if (categoryExists) {
                const { error: mappingError } = await supabase
                  .from('product_category_mapping')
                  .upsert({
                    product_id: product.id,
                    category_id: categoryId
                  }, {
                    onConflict: 'product_id,category_id',
                    ignoreDuplicates: false
                  });

                if (mappingError) {
                  console.error(`  ⚠️ Erreur mapping produit ${product.id} → catégorie ${categoryId}:`, mappingError.message);
                }
              }
            }

            console.log(`  ✅ Produit ${product.id} (${product.name}) → ${categoryIds.length} catégorie(s)`);
          }
        }
      }
    }

    console.log('\n\n✅ Migration terminée avec succès!\n');

    const { data: stats, count } = await supabase
      .from('categories')
      .select('*', { count: 'exact' });

    const { data: mappings, count: mappingsCount } = await supabase
      .from('product_category_mapping')
      .select('*', { count: 'exact' });

    console.log(`📊 Résumé:`);
    console.log(`   - Catégories WordPress récupérées: ${wpCategories.length}`);
    console.log(`   - Catégories dans Supabase: ${count || 0}`);
    console.log(`   - Produits analysés: ${products?.length || 0}`);
    console.log(`   - Relations catégories-produits: ${mappingsCount || 0}`);

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  }
}

migrateCategories()
  .then(() => {
    console.log('\n✨ Script terminé!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
