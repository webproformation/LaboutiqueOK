require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 TEST HOME_CATEGORIES');
console.log('=====================\n');
console.log('Supabase URL:', supabaseUrl);
console.log('URL inclut qcqbtmv:', supabaseUrl?.includes('qcqbtmv') ? '✅' : '❌');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHomeCategories() {
  try {
    console.log('📊 Test 1: Récupération de toutes les catégories actives...');
    const { data, error } = await supabase
      .from('home_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ Erreur:', error);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
    } else {
      console.log('✅ Succès!');
      console.log(`Nombre de catégories: ${data?.length || 0}`);
      if (data && data.length > 0) {
        console.log('\nCatégories trouvées:');
        data.forEach((cat, i) => {
          console.log(`${i + 1}. ${cat.category_name} (${cat.category_slug})`);
          console.log(`   ID: ${cat.id}`);
          console.log(`   Ordre: ${cat.display_order}`);
          console.log(`   Active: ${cat.is_active}`);
        });
      }
    }

    console.log('\n📊 Test 2: Vérification structure table...');
    const { data: structData, error: structError } = await supabase
      .from('home_categories')
      .select('*')
      .limit(1);

    if (structError) {
      console.error('❌ Erreur structure:', structError.message);
    } else {
      console.log('✅ Structure OK');
      if (structData && structData.length > 0) {
        console.log('Colonnes disponibles:', Object.keys(structData[0]).join(', '));
      }
    }

    console.log('\n📊 Test 3: Comptage total...');
    const { count, error: countError } = await supabase
      .from('home_categories')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur comptage:', countError.message);
    } else {
      console.log(`✅ Total catégories dans la table: ${count}`);
    }

  } catch (err) {
    console.error('❌ Erreur générale:', err);
  }
}

testHomeCategories();
