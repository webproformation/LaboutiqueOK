require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

console.log('🔑 Configuration Supabase:');
console.log('   URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('   Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Présente' : '❌ Manquante');
console.log('');

// Essayer d'abord avec SERVICE_ROLE, sinon ANON
const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  apiKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const testProducts = [
  {
    name: 'T-shirt Premium Coton Bio',
    slug: 't-shirt-premium-coton-bio',
    description: '<p>T-shirt de qualité supérieure en coton biologique 100%. Coupe moderne et confortable, idéal pour toutes les occasions.</p>',
    regular_price: 29.99,
    sale_price: 24.99,
    stock_quantity: 100,
    status: 'publish',
    is_variable_product: true,
    is_featured: true,
    variations: [
      { color: 'Noir', color_code: '#000000', size: null, price: 24.99, regular_price: 29.99 },
      { color: 'Blanc', color_code: '#FFFFFF', size: null, price: 24.99, regular_price: 29.99 },
      { color: 'Bleu', color_code: '#2563EB', size: null, price: 24.99, regular_price: 29.99 },
    ]
  },
  {
    name: 'Jean Slim Fit Denim',
    slug: 'jean-slim-fit-denim',
    description: '<p>Jean slim fit en denim de qualité. Coupe ajustée et moderne avec une excellente tenue dans le temps.</p>',
    regular_price: 79.99,
    sale_price: 59.99,
    stock_quantity: 80,
    status: 'publish',
    is_variable_product: true,
    is_featured: false,
    variations: [
      { color: 'Bleu Foncé', color_code: '#1E3A8A', size: null, price: 59.99, regular_price: 79.99 },
      { color: 'Noir', color_code: '#000000', size: null, price: 59.99, regular_price: 79.99 },
    ]
  },
  {
    name: 'Robe d\'été Fleurie',
    slug: 'robe-ete-fleurie',
    description: '<p>Magnifique robe d\'été avec motif floral. Légère et confortable, parfaite pour les beaux jours.</p>',
    regular_price: 49.99,
    sale_price: null,
    stock_quantity: 60,
    status: 'publish',
    is_variable_product: true,
    is_featured: false,
    is_diamond: true,
    variations: [
      { color: 'Rose', color_code: '#EC4899', size: null, price: 49.99, regular_price: 49.99 },
      { color: 'Bleu Ciel', color_code: '#7DD3FC', size: null, price: 49.99, regular_price: 49.99 },
      { color: 'Beige', color_code: '#D4B896', size: null, price: 49.99, regular_price: 49.99 },
    ]
  },
  {
    name: 'Pull en Laine Mérinos',
    slug: 'pull-laine-merinos',
    description: '<p>Pull chaud et doux en laine mérinos de haute qualité. Parfait pour l\'hiver avec son design intemporel.</p>',
    regular_price: 89.99,
    sale_price: 69.99,
    stock_quantity: 50,
    status: 'publish',
    is_variable_product: true,
    is_featured: true,
    variations: [
      { color: 'Gris', color_code: '#6B7280', size: null, price: 69.99, regular_price: 89.99 },
      { color: 'Beige', color_code: '#D4B896', size: null, price: 69.99, regular_price: 89.99 },
      { color: 'Bordeaux', color_code: '#8B0E44', size: null, price: 69.99, regular_price: 89.99 },
    ]
  },
  {
    name: 'Veste en Cuir Véritable',
    slug: 'veste-cuir-veritable',
    description: '<p>Veste en cuir véritable de qualité premium. Style intemporel et durabilité exceptionnelle.</p>',
    regular_price: 299.99,
    sale_price: 249.99,
    stock_quantity: 30,
    status: 'publish',
    is_variable_product: true,
    is_featured: true,
    variations: [
      { color: 'Noir', color_code: '#000000', size: null, price: 249.99, regular_price: 299.99 },
      { color: 'Marron', color_code: '#92400E', size: null, price: 249.99, regular_price: 299.99 },
    ]
  }
];

async function main() {
  console.log('🚀 Création de 5 produits test...\n');

  // Récupérer toutes les catégories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name');

  if (catError) {
    console.error('❌ Erreur lors de la récupération des catégories:', catError);
    return;
  }

  if (!categories || categories.length === 0) {
    console.error('❌ Aucune catégorie trouvée dans la base de données');
    return;
  }

  console.log(`✅ ${categories.length} catégories trouvées\n`);

  // Récupérer les couleurs disponibles
  const { data: colorTerms, error: colorError } = await supabase
    .from('product_attribute_terms')
    .select('id, name, color_code')
    .eq('attribute_id', (await supabase
      .from('product_attributes')
      .select('id')
      .eq('slug', 'couleurs-principales')
      .single()
    ).data?.id);

  console.log(`✅ ${colorTerms?.length || 0} couleurs disponibles\n`);

  for (const productData of testProducts) {
    console.log(`\n📦 Création du produit: ${productData.name}`);

    try {
      // 1. Créer le produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          regular_price: productData.regular_price,
          sale_price: productData.sale_price,
          stock_quantity: productData.stock_quantity,
          status: productData.status,
          is_variable_product: productData.is_variable_product,
          is_featured: productData.is_featured || false,
          is_diamond: productData.is_diamond || false,
        })
        .select()
        .single();

      if (productError) {
        console.error(`   ❌ Erreur création produit:`, productError.message);
        continue;
      }

      console.log(`   ✅ Produit créé (ID: ${product.id})`);

      // 2. Associer à TOUTES les catégories
      const categoryMappings = categories.map((cat, index) => ({
        product_id: product.id,
        category_id: cat.id,
        is_primary: index === 0,
        display_order: index,
      }));

      const { error: mappingError } = await supabase
        .from('product_category_mapping')
        .insert(categoryMappings);

      if (mappingError) {
        console.error(`   ❌ Erreur association catégories:`, mappingError.message);
      } else {
        console.log(`   ✅ Associé à ${categories.length} catégories`);
      }

      // 3. Créer les variations de couleur
      if (productData.variations && productData.variations.length > 0) {
        const variations = productData.variations.map((v) => {
          // Trouver le terme de couleur correspondant
          const colorTerm = colorTerms?.find(
            (ct) => ct.name.toLowerCase() === v.color.toLowerCase()
          );

          return {
            product_id: product.id,
            sku: `${productData.slug}-${v.color.toLowerCase().replace(/\s+/g, '-')}`,
            attributes: {
              couleur: colorTerm?.id || v.color,
              couleur_name: v.color,
              color_code: v.color_code,
            },
            regular_price: v.regular_price,
            sale_price: v.price !== v.regular_price ? v.price : null,
            stock_quantity: Math.floor(productData.stock_quantity / productData.variations.length),
            stock_status: 'instock',
            is_active: true,
          };
        });

        const { error: variationsError } = await supabase
          .from('product_variations')
          .insert(variations);

        if (variationsError) {
          console.error(`   ❌ Erreur création variations:`, variationsError.message);
        } else {
          console.log(`   ✅ ${variations.length} variations de couleur créées`);
        }
      }

      // 4. Créer le SEO
      const { error: seoError } = await supabase
        .from('seo_metadata')
        .insert({
          entity_type: 'product',
          entity_identifier: productData.slug,
          product_id: product.id,
          seo_title: `${productData.name} - La Boutique de Morgane`,
          meta_description: `Découvrez ${productData.name.toLowerCase()} sur La Boutique de Morgane. Qualité premium et livraison rapide.`,
          is_active: true,
        });

      if (seoError) {
        console.error(`   ❌ Erreur création SEO:`, seoError.message);
      } else {
        console.log(`   ✅ Métadonnées SEO créées`);
      }

      console.log(`   ✨ Produit "${productData.name}" créé avec succès !`);

    } catch (error) {
      console.error(`   ❌ Erreur inattendue:`, error.message);
    }
  }

  console.log('\n\n🎉 Création terminée ! 5 produits test ont été ajoutés à la base de données.');
  console.log('📍 Tous les produits sont disponibles dans TOUTES les catégories.\n');
}

main().catch(console.error);
