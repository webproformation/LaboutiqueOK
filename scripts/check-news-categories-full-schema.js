const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFullSchema() {
  console.log('\n🔍 SCHÉMA COMPLET news_categories\n');
  console.log('='.repeat(60));

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        column_name,
        data_type,
        column_default,
        is_nullable,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'news_categories'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.log('⚠️ Impossible de récupérer le schéma via RPC');
    console.log('   Essai méthode alternative...\n');

    const { data: alternativeData, error: altError } = await supabase
      .from('news_categories')
      .select('*')
      .limit(1);

    if (altError) {
      console.error('❌ Erreur:', altError);
      return;
    }

    if (alternativeData && alternativeData.length > 0) {
      console.log('✅ Colonnes détectées:');
      Object.entries(alternativeData[0]).forEach(([key, value]) => {
        console.log(`  - ${key}: ${typeof value} (exemple: ${value})`);
      });
    } else {
      console.log('⚠️ Table vide, colonnes détectées via schéma précédent');
    }
  } else {
    console.log('✅ Schéma complet:');
    console.log(JSON.stringify(data, null, 2));
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

checkFullSchema().catch(console.error);
