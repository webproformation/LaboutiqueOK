const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('\n🔍 VÉRIFICATION SCHÉMA news_categories\n');
  console.log('='.repeat(60));

  const { data, error } = await supabase
    .from('news_categories')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log('\n✅ Colonnes disponibles:');
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    columns.forEach(col => console.log(`  - ${col}`));
  } else {
    console.log('  (Table vide, impossible de détecter les colonnes)');
    console.log('\n📝 Essai de création pour détecter les colonnes...');

    const testData = {
      name: 'TEST',
      slug: 'test-' + Date.now(),
      description: 'Test',
      color: '#000000',
      display_order: 0
    };

    const { data: inserted, error: insertError } = await supabase
      .from('news_categories')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('\n❌ Erreur insertion test:', insertError);
      console.log('\n💡 Détails de l\'erreur:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('\n✅ Test réussi. Colonnes retournées:');
      Object.keys(inserted).forEach(col => console.log(`  - ${col}`));

      await supabase
        .from('news_categories')
        .delete()
        .eq('id', inserted.id);
      console.log('\n🗑️ Ligne de test supprimée');
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

checkSchema().catch(console.error);
