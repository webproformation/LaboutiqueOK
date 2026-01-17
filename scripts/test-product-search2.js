const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSearch() {
  console.log('\n🔍 TESTS RECHERCHE PRODUITS\n');

  // Test avec status="publish"
  console.log('📦 Produits avec status="publish" (limite 10)');
  const { data: publishProducts, error: publishError } = await supabase
    .from('products')
    .select('id, name, slug, status')
    .eq('status', 'publish')
    .limit(10);

  if (publishError) {
    console.error('❌ Erreur:', publishError.message);
  } else {
    console.log(`✅ ${publishProducts.length} produits trouvés`);
    publishProducts.forEach(p => console.log(`   - ${p.name} (${p.slug})`));
  }

  // Recherche avec "chemise"
  console.log('\n🔍 Recherche "chemise" avec status="publish"');
  const { data: chemiseResults, error: chemiseError } = await supabase
    .from('products')
    .select('id, name, slug, image_url, regular_price, sale_price')
    .or(`name.ilike.%chemise%,slug.ilike.%chemise%`)
    .eq('status', 'publish')
    .limit(10);

  if (chemiseError) {
    console.error('❌ Erreur:', chemiseError.message);
  } else {
    console.log(`✅ ${chemiseResults.length} résultats trouvés`);
    chemiseResults.forEach(p => {
      console.log(`   - ${p.name}`);
      console.log(`     Prix: ${p.sale_price || p.regular_price}€`);
    });
  }

  // Recherche avec "spray"
  console.log('\n🔍 Recherche "spray" avec status="publish"');
  const { data: sprayResults, error: sprayError } = await supabase
    .from('products')
    .select('id, name, slug, image_url, regular_price, sale_price')
    .or(`name.ilike.%spray%,slug.ilike.%spray%`)
    .eq('status', 'publish')
    .limit(10);

  if (sprayError) {
    console.error('❌ Erreur:', sprayError.message);
  } else {
    console.log(`✅ ${sprayResults.length} résultats trouvés`);
    sprayResults.forEach(p => {
      console.log(`   - ${p.name}`);
      console.log(`     Prix: ${p.sale_price || p.regular_price}€`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés\n');
}

testSearch();
