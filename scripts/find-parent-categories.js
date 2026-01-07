require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function find() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .or('name.ilike.%robes%,name.ilike.%vestes%,name.ilike.%manteaux%');

  console.log('Catégories trouvées contenant "robes", "vestes" ou "manteaux":');
  data.forEach(cat => {
    console.log(`- ${cat.name} (ID: ${cat.id}, parent: ${cat.parent_id})`);
  });
}

find();
