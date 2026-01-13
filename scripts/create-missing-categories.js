require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔧 CRÉATION CATÉGORIES MANQUANTES\n');

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function findCategoryByName(name) {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .maybeSingle();
  return data;
}

async function createCategory(name, parentId, order = 0) {
  const existing = await findCategoryByName(name);
  if (existing) {
    console.log(`  ✅ Existe: ${name}`);
    return existing;
  }

  const slug = generateSlug(name);
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      id: randomUUID(),
      name,
      slug,
      parent_id: parentId,
      display_order: order,
      description: `Catégorie ${name}`,
      meta_title: name,
      meta_description: `Découvrez notre sélection ${name}`
    }])
    .select()
    .single();

  if (error) {
    console.error(`  ❌ Erreur ${name}:`, error.message);
    return null;
  }

  console.log(`  ✨ Créée: ${name}`);
  return data;
}

async function run() {
  // Trouver les catégories parentes
  const robesCombi = await findCategoryByName('Robes & combinaisons');
  const vestesManteaux = await findCategoryByName('Vestes & manteaux');
  const parfumsBrumes = await findCategoryByName('Parfums & Brumes');
  const maquillage = await findCategoryByName('Maquillage');
  const soinsCorps = await findCategoryByName('Soins Corps & Bain');
  const soinsVisage = await findCategoryByName('Soins Visage');

  console.log('📂 Robes et combinaisons');
  if (robesCombi) {
    await createCategory('Robes', robesCombi.id, 0);
    await createCategory('Combinaisons', robesCombi.id, 1);
    await createCategory('Ensembles', robesCombi.id, 2);
    await createCategory('Salopettes', robesCombi.id, 3);
  }

  console.log('\n📂 Vestes et manteaux');
  if (vestesManteaux) {
    await createCategory('Blazers', vestesManteaux.id, 0);
    await createCategory('Vestes', vestesManteaux.id, 1);
    await createCategory('Manteaux', vestesManteaux.id, 2);
    await createCategory('Doudounes', vestesManteaux.id, 3);
  }

  console.log('\n📂 Parfums & Brumes');
  if (parfumsBrumes) {
    await createCategory('Parfums', parfumsBrumes.id, 0);
    await createCategory('Brumes Corporelles', parfumsBrumes.id, 1);
  }

  console.log('\n📂 Maquillage');
  if (maquillage) {
    await createCategory('Teint (Fonds de teint, poudres...)', maquillage.id, 0);
    await createCategory('Yeux (Mascara, fards...)', maquillage.id, 1);
    await createCategory('Lèvres (Rouges à lèvres, gloss...)', maquillage.id, 2);
    await createCategory('Ongles (Vernis)', maquillage.id, 3);
    await createCategory('Accessoires (Pinceaux, éponges)', maquillage.id, 4);
  }

  // Créer Soins Corps & Bain si n'existe pas
  console.log('\n📂 Soins Corps & Bain');
  let soinsCorpsReal = soinsCorps;
  if (!soinsCorpsReal) {
    const beaute = await findCategoryByName('Beauté et Senteurs');
    if (!beaute) {
      const beauteCreated = await createCategory('Beauté et Senteurs', null, 5);
      soinsCorpsReal = await createCategory('Soins Corps & Bain', beauteCreated?.id, 2);
    } else {
      soinsCorpsReal = await createCategory('Soins Corps & Bain', beaute.id, 2);
    }
  }

  if (soinsCorpsReal) {
    await createCategory('Gels douche & Bains', soinsCorpsReal.id, 0);
    await createCategory('Hydratants Corps (Laits, crèmes)', soinsCorpsReal.id, 1);
    await createCategory('Soins Mains & Pieds', soinsCorpsReal.id, 2);
  }

  console.log('\n📂 Soins Visage');
  if (soinsVisage) {
    await createCategory('Nettoyants & Démaquillants', soinsVisage.id, 0);
    await createCategory('Crèmes de Jour & Nuit', soinsVisage.id, 1);
    await createCategory('Masques & Gommages', soinsVisage.id, 2);
  }

  console.log('\n✅ TERMINÉ\n');
}

run();
