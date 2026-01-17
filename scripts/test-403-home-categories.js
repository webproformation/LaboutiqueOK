/**
 * 🧪 TEST RÉSOLUTION ERREUR 403
 * Vérifier si les politiques RLS permettent l'accès public
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPublicAccess() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     TEST RÉSOLUTION ERREUR 403 - home_categories      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔗 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 Type: ANON KEY (accès public)\n');
  console.log('───────────────────────────────────────────────────────\n');

  // Test 1: Fetch sans authentification
  console.log('📝 TEST : Fetch public avec is_active=true\n');

  const { data, error } = await supabase
    .from('home_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ ERREUR:', error.code);
    console.error('   Message:', error.message);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    console.log('\n⚠️  Accès refusé ! Les politiques RLS bloquent la requête.\n');
    process.exit(1);
  }

  console.log('✅ SUCCÈS ! Connexion sécurisée établie');
  console.log(`\n📊 ${data.length} catégorie(s) active(s) récupérée(s):\n`);

  if (data.length === 0) {
    console.log('   ⚠️  Aucune catégorie active trouvée');
    console.log('   💡 Ajoutez des catégories via /admin/home-categories\n');
  } else {
    data.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat.category_name || cat.name}`);
      console.log(`      Slug: ${cat.category_slug || cat.slug}`);
      console.log(`      Ordre: ${cat.display_order}`);
      console.log(`      Image: ${cat.image_url ? '✓' : '✗'}`);
      console.log('');
    });
  }

  console.log('───────────────────────────────────────────────────────');
  console.log('🎉 Erreur 403 résolue ! Les données sont accessibles.');
  console.log('───────────────────────────────────────────────────────\n');
}

testPublicAccess();
