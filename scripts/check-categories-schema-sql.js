require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  // Utiliser une raw query pour vérifier le schéma
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.error('Erreur:', error.message);
  } else {
    console.log('Schéma de la table categories:');
    console.table(data);
  }
}

checkSchema();
