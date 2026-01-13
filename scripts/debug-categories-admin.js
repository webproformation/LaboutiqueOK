const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCategoriesAdmin() {
  console.log('\n🔍 DIAGNOSTIC CATÉGORIES ADMIN - Projet qcqbtmv\n');
  console.log('=' .repeat(60));

  // Test 1: Vérifier les données brutes
  console.log('\n1️⃣ Vérification données brutes (categories):');
  const { data: allCategories, error: allError } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, is_visible')
    .order('display_order');

  if (allError) {
    console.error('❌ Erreur:', allError.message);
  } else {
    console.log(`✅ Total catégories trouvées: ${allCategories?.length || 0}`);
    if (allCategories && allCategories.length > 0) {
      console.log('\nPremières catégories:');
      allCategories.slice(0, 10).forEach(cat => {
        const parent = cat.parent_id ? `(parent: ${cat.parent_id})` : '(racine)';
        console.log(`  - ${cat.name} ${parent}`);
      });
    }
  }

  // Test 2: Statistiques
  console.log('\n\n2️⃣ Statistiques:');
  const rootCats = allCategories?.filter(c => !c.parent_id) || [];
  const subCats = allCategories?.filter(c => c.parent_id) || [];
  const visibleCats = allCategories?.filter(c => c.is_visible !== false) || [];

  console.log(`  📁 Catégories principales: ${rootCats.length}`);
  console.log(`  📂 Sous-catégories: ${subCats.length}`);
  console.log(`  👁️  Catégories visibles: ${visibleCats.length}`);

  // Test 3: Vérifier product_category_mapping
  console.log('\n\n3️⃣ Vérification mapping produits-catégories:');
  const { data: mappings, error: mappingError } = await supabase
    .from('product_category_mapping')
    .select('category_id, product_id');

  if (mappingError) {
    console.error('❌ Erreur:', mappingError.message);
  } else {
    console.log(`✅ Total mappings: ${mappings?.length || 0}`);

    if (mappings && mappings.length > 0) {
      const counts = {};
      mappings.forEach(m => {
        counts[m.category_id] = (counts[m.category_id] || 0) + 1;
      });
      const totalProducts = Object.values(counts).reduce((sum, count) => sum + count, 0);
      console.log(`  📦 Produits assignés: ${totalProducts}`);
      console.log(`  🔗 Catégories avec produits: ${Object.keys(counts).length}`);
    }
  }

  // Test 4: RLS Policies
  console.log('\n\n4️⃣ Vérification RLS Policies:');
  const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'categories'
      ORDER BY policyname;
    `
  }).single();

  if (policyError) {
    console.log('ℹ️  Impossible de récupérer les policies (fonction non disponible)');
  } else if (policies) {
    console.log('Policies RLS actives:');
    console.log(policies);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic terminé\n');
}

debugCategoriesAdmin().catch(console.error);
