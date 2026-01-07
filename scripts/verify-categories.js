/**
 * VÉRIFICATION ET CRÉATION CATÉGORIES COMPLÈTES
 * Projet: qcqbtmvbvipsxwjlgjvk
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 VÉRIFICATION CATALOGUE COMPLET');
console.log('📍 Projet:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('');

// Structure complète attendue
const EXPECTED_STRUCTURE = [
  { name: 'Nouveautés', parent: null, order: 1 },
  { name: 'Mode', parent: null, order: 2, children: [
    { name: 'Hauts', children: [
      { name: 'Tops et t-shirts' },
      { name: 'Blouses et chemises' },
      { name: 'Pulls et mailles' },
      { name: 'Sweats et hoodies' },
      { name: 'Bodys et caracos' }
    ]},
    { name: 'Bas', children: [
      { name: 'Pantalons' },
      { name: 'Jeans' },
      { name: 'Jupes' },
      { name: 'Shorts' },
      { name: 'Leggings' }
    ]},
    { name: 'Robes et combinaisons', children: [
      { name: 'Robes' },
      { name: 'Combinaisons' },
      { name: 'Ensembles' },
      { name: 'Salopettes' }
    ]},
    { name: 'Vestes et manteaux', children: [
      { name: 'Blazers' },
      { name: 'Vestes' },
      { name: 'Manteaux' },
      { name: 'Doudounes' }
    ]},
    { name: 'Accessoires', children: [
      { name: 'Sacs' },
      { name: 'Ceintures' },
      { name: 'Bijoux' },
      { name: 'Foulards et écharpes' },
      { name: 'Casquettes' },
      { name: 'Bonnets' },
      { name: 'Gants' },
      { name: 'Chaussures' }
    ]}
  ]},
  { name: 'Les looks de Morgane', parent: null, order: 3 },
  { name: 'Maison', parent: null, order: 4, children: [
    { name: 'Bougies' },
    { name: 'Diffuseurs et mikados' },
    { name: 'Sprays et brumes' },
    { name: 'Coffrets' }
  ]},
  { name: 'Beauté et Senteurs', parent: null, order: 5, children: [
    { name: 'Parfums & Brumes', children: [
      { name: 'Parfums' },
      { name: 'Brumes Corporelles' }
    ]},
    { name: 'Maquillage', children: [
      { name: 'Teint (Fonds de teint, poudres...)' },
      { name: 'Yeux (Mascara, fards...)' },
      { name: 'Lèvres (Rouges à lèvres, gloss...)' },
      { name: 'Ongles (Vernis)' },
      { name: 'Accessoires (Pinceaux, éponges)' }
    ]},
    { name: 'Soins Corps & Bain', children: [
      { name: 'Gels douche & Bains' },
      { name: 'Hydratants Corps (Laits, crèmes)' },
      { name: 'Soins Mains & Pieds' }
    ]},
    { name: 'Soins Visage', children: [
      { name: 'Nettoyants & Démaquillants' },
      { name: 'Crèmes de Jour & Nuit' },
      { name: 'Masques & Gommages' }
    ]}
  ]},
  { name: 'Bonnes affaires', parent: null, order: 6 }
];

async function getAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ Erreur récupération catégories:', error);
    return [];
  }

  return data || [];
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function findOrCreateCategory(name, parentId = null, order = 0) {
  const slug = generateSlug(name);

  // Chercher si existe
  const { data: existing } = await supabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .maybeSingle();

  if (existing) {
    console.log(`  ✅ Existe: ${name}`);
    return existing;
  }

  // Créer
  const { data: created, error } = await supabase
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
    console.error(`  ❌ Erreur création ${name}:`, error.message);
    return null;
  }

  console.log(`  ✨ Créée: ${name}`);
  return created;
}

async function createCategoryTree(structure, parentId = null, baseOrder = 0) {
  for (let i = 0; i < structure.length; i++) {
    const item = structure[i];
    const order = item.order || (baseOrder + i);

    console.log(`\n📂 ${item.name}`);
    const category = await findOrCreateCategory(item.name, parentId, order);

    if (category && item.children) {
      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j];
        console.log(`  📁 ${child.name}`);
        const childCategory = await findOrCreateCategory(child.name, category.id, j);

        if (childCategory && child.children) {
          for (let k = 0; k < child.children.length; k++) {
            const grandchild = child.children[k];
            console.log(`    📄 ${grandchild.name}`);
            await findOrCreateCategory(grandchild.name, childCategory.id, k);
          }
        }
      }
    }
  }
}

async function displayCategoryTree() {
  const categories = await getAllCategories();

  console.log('\n📊 ARBRE COMPLET DES CATÉGORIES\n');

  const rootCategories = categories.filter(c => !c.parent_id);

  for (const root of rootCategories) {
    console.log(`\n${root.name} (ID: ${root.id})`);

    const level2 = categories.filter(c => c.parent_id === root.id);
    for (const l2 of level2) {
      console.log(`  └─ ${l2.name} (ID: ${l2.id})`);

      const level3 = categories.filter(c => c.parent_id === l2.id);
      for (const l3 of level3) {
        console.log(`     └─ ${l3.name} (ID: ${l3.id})`);
      }
    }
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔬 VÉRIFICATION & CRÉATION CATALOGUE COMPLET');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await createCategoryTree(EXPECTED_STRUCTURE);

  await displayCategoryTree();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ CATALOGUE VÉRIFIÉ ET COMPLÉTÉ');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

run();
