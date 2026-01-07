/**
 * 🔒 SCRIPT DE VÉRIFICATION DIRECT DE LA BASE qcqbtmvbvipsxwjlgjvk
 * Table correcte : public.categories (PAS product_categories)
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const projectMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectId = projectMatch ? projectMatch[1] : 'INCONNU';

console.log('\n🔍 DIAGNOSTIC - CONNEXION DIRECTE\n');
console.log('═══════════════════════════════════════════════════════');
console.log(`📊 Projet : ${projectId}`);
console.log(`🔗 URL : ${SUPABASE_URL}`);
console.log('═══════════════════════════════════════════════════════\n');

if (projectId !== 'qcqbtmvbvipsxwjlgjvk') {
  console.error(`🚨 ERREUR : Projet incorrect (${projectId})`);
  process.exit(1);
}

console.log('✅ Verrouillage confirmé : qcqbtmvbvipsxwjlgjvk\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyDatabase() {
  try {
    // VÉRIFIER LA TABLE categories (la bonne table)
    console.log('🔎 VÉRIFICATION TABLE: public.categories\n');

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (catError) {
      console.error('❌ Erreur categories:', catError);
      return;
    }

    console.log(`📦 Catégories trouvées : ${categories?.length || 0}\n`);

    if (categories && categories.length > 0) {
      console.log('📋 LISTE DES CATÉGORIES :\n');
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name || cat.title || 'SANS NOM'}`);
        console.log(`   ID: ${cat.id}`);
        console.log(`   Slug: ${cat.slug || 'N/A'}`);
        const fields = Object.keys(cat).filter(k => !['id', 'name', 'slug', 'title'].includes(k));
        console.log(`   Autres champs: ${fields.join(', ')}`);
        console.log('');
      });
    }

    // VÉRIFIER LES PRODUITS
    console.log('\n🛍️  VÉRIFICATION DES PRODUITS\n');

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, category_id, woocommerce_category_id')
      .limit(10);

    if (prodError) {
      console.error('❌ Erreur produits:', prodError);
      return;
    }

    console.log(`📦 Produits (échantillon) : ${products?.length || 0}\n`);

    if (products && products.length > 0) {
      console.log('EXEMPLES DE PRODUITS :');
      products.slice(0, 3).forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   category_id: ${p.category_id || 'NULL'}`);
        console.log(`   woocommerce_category_id: ${p.woocommerce_category_id || 'NULL'}`);
      });
    }

    // COMPTER TOUS LES PRODUITS
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 TOTAL PRODUITS : ${count || 0}`);

    // ANALYSER LES CATÉGORIES RÉFÉRENCÉES
    console.log('\n\n🔍 ANALYSE DES category_id DANS LES PRODUITS\n');

    const { data: allProducts } = await supabase
      .from('products')
      .select('category_id, woocommerce_category_id, name');

    if (allProducts) {
      const uniqueCategoryIds = Array.from(new Set(allProducts.map(p => p.category_id).filter(Boolean)));
      console.log(`📊 category_id uniques : ${uniqueCategoryIds.length}\n`);

      uniqueCategoryIds.forEach((catId, index) => {
        const productsWithCat = allProducts.filter(p => p.category_id === catId);
        const wcIds = Array.from(new Set(productsWithCat.map(p => p.woocommerce_category_id)));
        const catExists = categories?.find(c => c.id === catId);

        console.log(`${index + 1}. UUID: ${catId}`);
        console.log(`   Existe dans categories: ${catExists ? '✅ OUI' : '❌ NON (ORPHELIN)'}`);
        if (catExists) {
          console.log(`   Nom: ${catExists.name || catExists.title}`);
        }
        console.log(`   Produits: ${productsWithCat.length}`);
        console.log(`   WooCommerce IDs: ${wcIds.join(', ')}`);
        console.log('');
      });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ DIAGNOSTIC TERMINÉ');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
    process.exit(1);
  }
}

verifyDatabase();
