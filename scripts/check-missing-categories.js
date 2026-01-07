require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMissing() {
  const missing = [
    'Robes',
    'Combinaisons',
    'Ensembles',
    'Salopettes',
    'Blazers',
    'Vestes',
    'Manteaux',
    'Doudounes',
    'Parfums',
    'Brumes Corporelles',
    'Teint (Fonds de teint, poudres...)',
    'Yeux (Mascara, fards...)',
    'Lèvres (Rouges à lèvres, gloss...)',
    'Ongles (Vernis)',
    'Accessoires (Pinceaux, éponges)',
    'Gels douche & Bains',
    'Hydratants Corps (Laits, crèmes)',
    'Soins Mains & Pieds',
    'Nettoyants & Démaquillants',
    'Crèmes de Jour & Nuit',
    'Masques & Gommages'
  ];

  for (const name of missing) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (data) {
      console.log(`✅ ${name} (ID: ${data.id})`);
    } else {
      console.log(`❌ ${name} - MANQUANTE`);
    }
  }
}

checkMissing();
