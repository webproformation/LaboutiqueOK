require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getSchema() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Colonnes de la table categories:');
    console.log(Object.keys(data[0]));
    console.log('\nExemple de données:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

getSchema();
