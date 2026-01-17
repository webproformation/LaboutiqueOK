require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log('Colonnes de categories:');
    console.log(columns.join(', '));
    console.log('');
    console.log('is_visible existe:', columns.includes('is_visible') ? '✅' : '❌');
  }
}

check();
