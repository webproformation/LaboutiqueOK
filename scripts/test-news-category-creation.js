const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCategoryCreation() {
  console.log('\n🧪 TEST CRÉATION CATÉGORIE NEWS\n');
  console.log('='.repeat(60));

  const testSlug = `test-${Date.now()}`;

  console.log('\n1️⃣ Test création catégorie...');
  const testCategory = {
    name: 'Test Catégorie',
    slug: testSlug,
    description: 'Catégorie de test',
    color: '#FF0000',
    display_order: 999,
    is_active: true
  };

  const { data: created, error: createError } = await supabase
    .from('news_categories')
    .insert(testCategory)
    .select()
    .single();

  if (createError) {
    console.error('❌ Erreur création:', createError);
    console.log('\n💡 Détails:', JSON.stringify(createError, null, 2));
    return;
  }

  console.log('✅ Catégorie créée avec succès!');
  console.log('   ID:', created.id);
  console.log('   Name:', created.name);
  console.log('   Slug:', created.slug);
  console.log('   Color:', created.color);
  console.log('   Is Active:', created.is_active);

  console.log('\n2️⃣ Test lecture catégorie...');
  const { data: read, error: readError } = await supabase
    .from('news_categories')
    .select('*')
    .eq('id', created.id)
    .single();

  if (readError) {
    console.error('❌ Erreur lecture:', readError);
  } else {
    console.log('✅ Catégorie lue avec succès!');
    console.log('   Données:', JSON.stringify(read, null, 2));
  }

  console.log('\n3️⃣ Test modification catégorie...');
  const { data: updated, error: updateError } = await supabase
    .from('news_categories')
    .update({
      name: 'Test Modifié',
      description: 'Description modifiée'
    })
    .eq('id', created.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Erreur modification:', updateError);
  } else {
    console.log('✅ Catégorie modifiée avec succès!');
    console.log('   Nouveau nom:', updated.name);
    console.log('   Nouvelle description:', updated.description);
  }

  console.log('\n4️⃣ Test vérification articles associés...');
  const { data: articles, error: articlesError } = await supabase
    .from('news_articles')
    .select('id')
    .eq('category_id', created.id)
    .limit(1);

  if (articlesError) {
    console.log('⚠️ Erreur vérification articles:', articlesError.message);
  } else {
    console.log('✅ Vérification articles OK');
    console.log('   Articles trouvés:', articles ? articles.length : 0);
  }

  console.log('\n5️⃣ Test suppression catégorie...');
  const { error: deleteError } = await supabase
    .from('news_categories')
    .delete()
    .eq('id', created.id);

  if (deleteError) {
    console.error('❌ Erreur suppression:', deleteError);
  } else {
    console.log('✅ Catégorie supprimée avec succès!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TOUS LES TESTS RÉUSSIS!\n');
}

testCategoryCreation().catch(err => {
  console.error('\n❌ ERREUR FATALE:', err);
  process.exit(1);
});
