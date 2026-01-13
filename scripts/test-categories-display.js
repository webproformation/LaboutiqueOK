const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCategoriesDisplay() {
  console.log('\n🔍 TEST AFFICHAGE CATÉGORIES - Projet qcqbtmv\n');
  console.log('=' .repeat(60));

  // Test 1: Vérifier home_categories
  console.log('\n📋 Home Categories:');
  const { data: homeCategories, error: homeCatError } = await supabase
    .from('home_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (homeCatError) {
    console.error('❌ Erreur:', homeCatError.message);
  } else {
    homeCategories.forEach(cat => {
      const hasAmp = cat.category_name?.includes('&amp;');
      const hasEntity = /&[a-z]+;/i.test(cat.category_name || '');
      const status = hasAmp || hasEntity ? '⚠️  ENTITÉ DÉTECTÉE' : '✅ OK';
      console.log(`  ${status} - ${cat.category_name}`);
    });
  }

  // Test 2: Vérifier categories
  console.log('\n📦 Categories (principales):');
  const { data: productCategories, error: prodCatError } = await supabase
    .from('categories')
    .select('name, slug')
    .is('parent_id', null)
    .eq('is_visible', true)
    .order('display_order')
    .limit(10);

  if (prodCatError) {
    console.error('❌ Erreur:', prodCatError.message);
  } else {
    if (productCategories && productCategories.length > 0) {
      productCategories.forEach(cat => {
        const hasAmp = cat.name?.includes('&amp;');
        const hasEntity = /&[a-z]+;/i.test(cat.name || '');
        const status = hasAmp || hasEntity ? '⚠️  ENTITÉ DÉTECTÉE' : '✅ OK';
        console.log(`  ${status} - ${cat.name}`);
      });
    } else {
      console.log('  ℹ️  Aucune catégorie trouvée');
    }
  }

  // Test 3: Statistiques globales
  console.log('\n📊 Statistiques:');

  const { count: totalHomeCategories } = await supabase
    .from('home_categories')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: totalProductCategories } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('is_visible', true);

  console.log(`  ✓ Home Categories actives: ${totalHomeCategories}`);
  console.log(`  ✓ Product Categories visibles: ${totalProductCategories}`);

  console.log('\n' + '='.repeat(60));
  console.log('✨ Affichage optimisé : caractères spéciaux nettoyés\n');
}

testCategoriesDisplay().catch(console.error);
