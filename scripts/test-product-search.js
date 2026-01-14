const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 TEST RECHERCHE PRODUITS (comme le frontend)\n');
console.log('URL:', supabaseUrl);
console.log('Project:', supabaseUrl?.split('//')[1]?.split('.')[0]);
console.log('\n' + '='.repeat(60) + '\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSearch() {
  // Test 1: Lister tous les produits
  console.log('📦 TEST 1: Lister tous les produits (limite 5)');
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('id, name, slug, status')
    .limit(5);

  if (allError) {
    console.error('❌ Erreur:', allError.message);
  } else {
    console.log(`✅ ${allProducts.length} produits trouvés`);
    allProducts.forEach(p => console.log(`   - [${p.status}] ${p.name}`));
  }

  // Test 2: Produits publiés
  console.log('\n📢 TEST 2: Produits avec status="published"');
  const { data: published, error: pubError } = await supabase
    .from('products')
    .select('id, name, status')
    .eq('status', 'published')
    .limit(5);

  if (pubError) {
    console.error('❌ Erreur:', pubError.message);
  } else {
    console.log(`✅ ${published.length} produits publiés trouvés`);
    published.forEach(p => console.log(`   - ${p.name}`));
  }

  // Test 3: Recherche comme dans le composant
  console.log('\n🔍 TEST 3: Recherche "robe" (comme le composant)');
  const { data: searchResults, error: searchError } = await supabase
    .from('products')
    .select('id, name, slug, image_url, regular_price, sale_price')
    .or(`name.ilike.%robe%,slug.ilike.%robe%`)
    .eq('status', 'published')
    .limit(10);

  if (searchError) {
    console.error('❌ Erreur:', searchError.message);
    console.error('   Details:', searchError.details);
    console.error('   Hint:', searchError.hint);
    console.error('   Code:', searchError.code);
  } else {
    console.log(`✅ ${searchResults.length} résultats trouvés`);
    searchResults.forEach(p => {
      console.log(`   - ${p.name}`);
      console.log(`     Slug: ${p.slug}`);
      console.log(`     Prix: ${p.sale_price || p.regular_price}€`);
    });
  }

  // Test 4: Recherche large sans filtre status
  console.log('\n🔍 TEST 4: Recherche "robe" SANS filtre status');
  const { data: allRobes, error: allRobesError } = await supabase
    .from('products')
    .select('id, name, slug, status')
    .or(`name.ilike.%robe%,slug.ilike.%robe%`)
    .limit(10);

  if (allRobesError) {
    console.error('❌ Erreur:', allRobesError.message);
  } else {
    console.log(`✅ ${allRobes.length} résultats trouvés`);
    allRobes.forEach(p => console.log(`   - [${p.status}] ${p.name}`));
  }

  // Test 5: Count total produits
  console.log('\n📊 TEST 5: Comptage total');
  const { count: totalCount, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Erreur:', countError.message);
  } else {
    console.log(`✅ Total produits: ${totalCount}`);
  }

  const { count: publishedCount, error: pubCountError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  if (pubCountError) {
    console.error('❌ Erreur published count:', pubCountError.message);
  } else {
    console.log(`✅ Total publiés: ${publishedCount}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés\n');
}

testSearch();
