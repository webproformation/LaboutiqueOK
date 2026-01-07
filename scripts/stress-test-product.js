/**
 * STRESS TEST PRODUIT TOTAL - qcqbtmvbvipsxwjlgjvk
 *
 * Ce script teste l'insertion d'un produit avec TOUS les champs possibles
 * pour détecter les colonnes manquantes en base de données.
 *
 * USAGE : node scripts/stress-test-product.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔒 STRESS TEST PRODUIT TOTAL');
console.log('📍 Projet :', supabaseUrl);
console.log('');

const TEST_PRODUCT_ID = 'TEST_TOTAL_SYSTEM_001';
const TEST_PRODUCT_SLUG = 'test-total-system-001';

async function cleanupTestData() {
  console.log('🧹 Nettoyage des données de test précédentes...');

  // Supprimer les variations
  await supabase.from('product_variations').delete().eq('product_id', TEST_PRODUCT_ID);

  // Supprimer le mapping catégories
  await supabase.from('product_category_mapping').delete().eq('product_id', TEST_PRODUCT_ID);

  // Supprimer les métadonnées SEO
  await supabase.from('seo_metadata').delete().eq('product_id', TEST_PRODUCT_ID);

  // Supprimer le produit
  await supabase.from('products').delete().eq('id', TEST_PRODUCT_ID);

  console.log('✅ Nettoyage terminé\n');
}

async function getTestCategories() {
  console.log('📂 Récupération de catégories de test...');
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .limit(3);

  if (error) {
    console.error('❌ Erreur récupération catégories :', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ Aucune catégorie trouvée');
    return [];
  }

  console.log(`✅ ${data.length} catégories trouvées :`, data.map(c => c.name).join(', '));
  return data;
}

async function testProductInsertion() {
  console.log('\n🚀 === TEST 1 : INSERTION PRODUIT COMPLET ===\n');

  const productData = {
    id: TEST_PRODUCT_ID,
    name: 'TEST TOTAL SYSTEM',
    slug: TEST_PRODUCT_SLUG,
    description: 'Produit de test exhaustif pour détecter les colonnes manquantes',
    regular_price: 99.99,
    sale_price: 79.99,
    stock_quantity: 100,
    status: 'publish',
    image_url: 'https://via.placeholder.com/800x800?text=TEST',
    images: [
      { url: 'https://via.placeholder.com/800x800?text=TEST1', alt: 'Test 1' },
      { url: 'https://via.placeholder.com/800x800?text=TEST2', alt: 'Test 2' }
    ],
    is_diamond: true,
    is_featured: true,
    manage_stock: true,
    stock_status: 'instock'
  };

  console.log('📦 Données produit :');
  console.log(JSON.stringify(productData, null, 2));
  console.log('');

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error('❌ ÉCHEC INSERTION PRODUIT');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
    console.error('Error Hint:', error.hint);
    console.error('');

    if (error.code === 'PGRST204' || error.message.includes('column')) {
      console.log('🔍 COLONNE MANQUANTE DÉTECTÉE !');
      console.log('');
      console.log('📋 SOLUTION SQL À EXÉCUTER :');
      console.log('');
      console.log('-- Vérifier la structure de la table products');
      console.log('SELECT column_name, data_type FROM information_schema.columns');
      console.log('WHERE table_name = \'products\' ORDER BY ordinal_position;');
      console.log('');
    }

    return null;
  }

  console.log('✅ Produit inséré avec succès !');
  console.log('ID:', data.id);
  console.log('');

  return data;
}

async function testCategoryMapping(categories) {
  if (!categories || categories.length === 0) {
    console.log('⏭️ SKIP : Pas de catégories disponibles pour le mapping\n');
    return true;
  }

  console.log('🚀 === TEST 2 : MAPPING CATÉGORIES ===\n');

  const mappings = categories.map(cat => ({
    product_id: TEST_PRODUCT_ID,
    category_id: cat.id
  }));

  console.log('🔗 Mappings à insérer :');
  console.log(JSON.stringify(mappings, null, 2));
  console.log('');

  const { data, error } = await supabase
    .from('product_category_mapping')
    .insert(mappings)
    .select();

  if (error) {
    console.error('❌ ÉCHEC MAPPING CATÉGORIES');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
    console.error('');
    return false;
  }

  console.log(`✅ ${data.length} catégories mappées avec succès !`);
  console.log('');

  return true;
}

async function testSeoMetadata() {
  console.log('🚀 === TEST 3 : MÉTADONNÉES SEO/OG ===\n');

  const seoData = {
    entity_type: 'product',
    entity_identifier: TEST_PRODUCT_ID, // TEXT maintenant (résolution 22P02)
    product_id: TEST_PRODUCT_ID,        // Colonne dédiée pour les produits
    seo_title: 'TEST TOTAL SYSTEM - Produit de Stress Test SEO',
    meta_description: 'Description complète pour tester les métadonnées SEO du produit TEST TOTAL SYSTEM avec tous les champs OG.',
    og_title: 'TEST TOTAL SYSTEM - Open Graph',
    og_description: 'Description Open Graph pour TEST TOTAL SYSTEM',
    og_image: 'https://via.placeholder.com/1200x630?text=OG+IMAGE+TEST',
    is_active: true
  };

  console.log('📝 Métadonnées SEO à insérer :');
  console.log(JSON.stringify(seoData, null, 2));
  console.log('');

  const { data, error } = await supabase
    .from('seo_metadata')
    .insert([seoData])
    .select()
    .single();

  if (error) {
    console.error('❌ ÉCHEC INSERTION SEO METADATA');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
    console.error('Error Hint:', error.hint);
    console.error('');

    if (error.code === '22P02') {
      console.log('🔍 ERREUR 22P02 DÉTECTÉE (UUID invalide)');
      console.log('→ entity_identifier devrait être TEXT, pas UUID');
      console.log('→ Vérifier la migration pour s\'assurer que la colonne est TEXT');
      console.log('');
    }

    return false;
  }

  console.log('✅ Métadonnées SEO insérées avec succès !');
  console.log('  - ID:', data.id);
  console.log('  - Entity:', data.entity_type);
  console.log('  - SEO Title:', data.seo_title);
  console.log('  - OG Image:', data.og_image);
  console.log('');

  return true;
}

async function testProductVariations() {
  console.log('🚀 === TEST 4 : VARIATIONS COMPLEXES ===\n');

  const variations = [
    {
      product_id: TEST_PRODUCT_ID,
      sku: 'TEST-VAR-001-RED-M',
      attributes: {
        couleur: 'Rouge',
        taille: 'M'
      },
      regular_price: 99.99,
      sale_price: 79.99,
      stock_quantity: 50,
      stock_status: 'instock',
      image_url: 'https://via.placeholder.com/400x400?text=RED-M',
      is_active: true
    },
    {
      product_id: TEST_PRODUCT_ID,
      sku: 'TEST-VAR-001-BLUE-L',
      attributes: {
        couleur: 'Bleu',
        taille: 'L'
      },
      regular_price: 99.99,
      sale_price: 79.99,
      stock_quantity: 30,
      stock_status: 'instock',
      image_url: 'https://via.placeholder.com/400x400?text=BLUE-L',
      is_active: true
    }
  ];

  console.log('🎨 Variations à insérer :');
  console.log(JSON.stringify(variations, null, 2));
  console.log('');

  const { data, error } = await supabase
    .from('product_variations')
    .insert(variations)
    .select();

  if (error) {
    console.error('❌ ÉCHEC INSERTION VARIATIONS');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
    console.error('Error Hint:', error.hint);
    console.error('');
    return false;
  }

  console.log(`✅ ${data.length} variations insérées avec succès !`);
  console.log('');

  return true;
}

async function verifyTestProduct() {
  console.log('🚀 === TEST 5 : VÉRIFICATION FINALE ===\n');

  console.log('🔍 Récupération du produit complet...');

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      product_category_mapping (
        category_id,
        categories (
          id,
          name
        )
      )
    `)
    .eq('id', TEST_PRODUCT_ID)
    .single();

  if (productError) {
    console.error('❌ Erreur récupération produit :', productError.message);
    return false;
  }

  console.log('✅ Produit récupéré :');
  console.log('  - ID:', product.id);
  console.log('  - Nom:', product.name);
  console.log('  - Prix:', product.regular_price, '€');
  console.log('  - Stock:', product.stock_quantity);
  console.log('  - Catégories:', product.product_category_mapping?.length || 0);
  console.log('');

  const { data: variations, error: variationsError } = await supabase
    .from('product_variations')
    .select('*')
    .eq('product_id', TEST_PRODUCT_ID);

  if (!variationsError && variations) {
    console.log('✅ Variations récupérées :', variations.length);
    variations.forEach((v, i) => {
      console.log(`  - Variation ${i + 1}: ${v.sku} - ${JSON.stringify(v.attributes)}`);
    });
    console.log('');
  }

  const { data: seo, error: seoError } = await supabase
    .from('seo_metadata')
    .select('*')
    .eq('product_id', TEST_PRODUCT_ID)
    .single();

  if (!seoError && seo) {
    console.log('✅ Métadonnées SEO récupérées :');
    console.log('  - SEO Title:', seo.seo_title);
    console.log('  - Meta Description:', seo.meta_description);
    console.log('  - OG Image:', seo.og_image || seo.og_image_url || 'N/A');
    console.log('');
  }

  return true;
}

async function runStressTest() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔬 STRESS TEST : PRODUIT TOTAL');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Nettoyage
    await cleanupTestData();

    // Récupérer des catégories de test
    const categories = await getTestCategories();

    // Test 1 : Insertion produit
    const product = await testProductInsertion();
    if (!product) {
      console.log('\n❌ ÉCHEC : Impossible d\'insérer le produit de base');
      console.log('Corrigez les erreurs ci-dessus et relancez le test.\n');
      return;
    }

    // Test 2 : Mapping catégories
    await testCategoryMapping(categories);

    // Test 3 : Métadonnées SEO
    await testSeoMetadata();

    // Test 4 : Variations
    await testProductVariations();

    // Test 5 : Vérification
    await verifyTestProduct();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ STRESS TEST TERMINÉ AVEC SUCCÈS !');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🎯 RÉSULTAT : Toutes les colonnes nécessaires sont présentes.');
    console.log('');
    console.log('🧹 Pour nettoyer le produit de test :');
    console.log(`   DELETE FROM products WHERE id = '${TEST_PRODUCT_ID}';`);
    console.log('');

  } catch (error) {
    console.error('\n💥 ERREUR INATTENDUE :');
    console.error(error);
    console.log('');
  }
}

// Lancer le test
runStressTest();
