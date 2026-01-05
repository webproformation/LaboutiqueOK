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

async function main() {
  console.log('🚀 IMPORT PAR LOTS VIA MCP\n');
  console.log(`📍 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  const wpProducts = await fetchWooCommerceProducts();
  if (wpProducts.length === 0) {
    console.log('⚠️ Aucun produit trouvé');
    return;
  }

  console.log('💾 Génération des commandes MCP...\n');
  console.log('Exécutez les commandes suivantes une par une:\n');

  // Générer par lots de 10
  for (let i = 0; i < wpProducts.length; i += 10) {
    const batch = wpProducts.slice(i, i + 10);

    const values = batch.map(p => {
      const id = p.id.toString();
      const name = (p.name || '').replace(/'/g, "''").replace(/&amp;/g, '&');
      const slug = p.slug.replace(/'/g, "''");
      const desc = (p.description || '').replace(/'/g, "''").substring(0, 500); // Tronquer
      const regPrice = parseFloat(p.regular_price) || 0;
      const salePrice = p.sale_price ? parseFloat(p.sale_price) : 'NULL::numeric';
      const stock = p.stock_quantity || 0;
      const status = p.status || 'draft';
      const imgUrl = p.images?.[0]?.src || null;

      return `('${id}', '${name}', '${slug}', '${desc}', ${regPrice}, ${salePrice}, ${stock}, '${status}', ${imgUrl ? `'${imgUrl}'` : 'NULL'}, '[]'::jsonb)`;
    }).join(',\n');

    console.log(`-- Lot ${Math.floor(i/10) + 1} (produits ${i+1} à ${Math.min(i+10, wpProducts.length)})`);
    console.log(`INSERT INTO products (id, name, slug, description, regular_price, sale_price, stock_quantity, status, image_url, images)`);
    console.log(`VALUES ${values}`);
    console.log(`ON CONFLICT (id) DO NOTHING;\n`);
  }

  console.log('\n✨ Après l\'import des produits, importez les mappings:\n');

  // Mappings
  const allMappings = [];
  wpProducts.forEach(p => {
    if (p.categories && p.categories.length > 0) {
      p.categories.forEach((cat, idx) => {
        allMappings.push(`('${p.id}', '${cat.id}', ${idx === 0}, ${idx})`);
      });
    }
  });

  for (let i = 0; i < allMappings.length; i += 50) {
    const batch = allMappings.slice(i, i + 50);
    console.log(`-- Mappings ${i+1} à ${Math.min(i+50, allMappings.length)}`);
    console.log(`INSERT INTO product_category_mapping (product_id, category_id, is_primary, display_order)`);
    console.log(`VALUES ${batch.join(',\n')}`);
    console.log(`ON CONFLICT (product_id, category_id) DO NOTHING;\n`);
  }
}

main().catch(console.error);
