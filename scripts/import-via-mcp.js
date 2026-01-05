require('dotenv').config();

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

      if (!response.ok) break;
      const products = await response.json();
      if (!Array.isArray(products) || products.length === 0) {
        hasMore = false;
      } else {
        console.log(`   Page ${page}: ${products.length} produits`);
        allProducts = allProducts.concat(products);
        page++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      hasMore = false;
    }
  }

  console.log(`✅ ${allProducts.length} produits récupérés\n`);
  return allProducts;
}

async function generateSQL(wpProducts) {
  console.log('📝 Génération des requêtes SQL...\n');

  const cleanInserts = [];
  const mappingInserts = [];

  for (const wpProduct of wpProducts) {
    const id = wpProduct.id.toString();
    const name = (wpProduct.name || '').replace(/'/g, "''").replace(/&amp;/g, '&');
    const slug = wpProduct.slug.replace(/'/g, "''");
    const description = (wpProduct.description || '').replace(/'/g, "''");
    const regularPrice = parseFloat(wpProduct.regular_price) || 0;
    const salePrice = wpProduct.sale_price ? parseFloat(wpProduct.sale_price) : null;
    const stockQty = wpProduct.stock_quantity || 0;
    const status = wpProduct.status || 'draft';
    const imageUrl = wpProduct.images?.[0]?.src || null;
    const images = JSON.stringify(wpProduct.images || []).replace(/'/g, "''");

    const insertValues = {
      id,
      name,
      slug,
      description,
      regular_price: regularPrice,
      sale_price: salePrice,
      stock_quantity: stockQty,
      status,
      image_url: imageUrl,
      images: images
    };

    // Générer l'INSERT avec les bonnes valeurs
    const values = [
      `'${id}'`,
      `'${name}'`,
      `'${slug}'`,
      `'${description}'`,
      regularPrice,
      salePrice !== null ? salePrice : 'NULL::numeric',
      stockQty,
      `'${status}'`,
      imageUrl ? `'${imageUrl}'` : 'NULL',
      `'${images}'::jsonb`
    ].join(', ');

    cleanInserts.push(`(${values})`);

    if (wpProduct.categories && wpProduct.categories.length > 0) {
      for (let i = 0; i < wpProduct.categories.length; i++) {
        const categoryId = wpProduct.categories[i].id.toString();
        mappingInserts.push(`('${id}', '${categoryId}', ${i === 0}, ${i})`);
      }
    }
  }

  const productSQL = `
INSERT INTO products (id, name, slug, description, regular_price, sale_price, stock_quantity, status, image_url, images)
VALUES ${cleanInserts.join(',\n')}
ON CONFLICT (id) DO NOTHING;
`;

  const mappingSQL = `
INSERT INTO product_category_mapping (product_id, category_id, is_primary, display_order)
VALUES ${mappingInserts.join(',\n')}
ON CONFLICT (product_id, category_id) DO NOTHING;
`;

  console.log('📊 SQL généré:');
  console.log(`   - ${cleanInserts.length} produits`);
  console.log(`   - ${mappingInserts.length} mappings\n`);

  // Sauvegarder dans des fichiers
  const fs = require('fs');
  fs.writeFileSync('/tmp/products-import.sql', productSQL);
  fs.writeFileSync('/tmp/mappings-import.sql', mappingSQL);

  console.log('✅ Fichiers SQL créés:');
  console.log('   - /tmp/products-import.sql');
  console.log('   - /tmp/mappings-import.sql\n');
}

async function main() {
  console.log('🚀 GÉNÉRATION SQL POUR IMPORT\n');

  try {
    const wpProducts = await fetchWooCommerceProducts();
    if (wpProducts.length === 0) {
      console.log('⚠️ Aucun produit trouvé');
      return;
    }

    await generateSQL(wpProducts);

    console.log('💡 Pour importer, exécutez:');
    console.log('   cat /tmp/products-import.sql | psql DATABASE_URL');
    console.log('   cat /tmp/mappings-import.sql | psql DATABASE_URL\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();
