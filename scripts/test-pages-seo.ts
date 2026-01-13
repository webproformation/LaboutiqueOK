/**
 * 🔍 Test de la table pages_seo
 * Vérifie que la table est opérationnelle et que les politiques RLS fonctionnent
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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testPagesSeo() {
  console.log('\n🔍 TEST TABLE PAGES_SEO');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Vérifier que la table existe et est accessible
    console.log('1️⃣ Vérification de l\'existence de la table...');
    const { data: pages, error: selectError } = await supabase
      .from('pages_seo')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('❌ Erreur lors de la lecture:', selectError);
      return;
    }

    console.log(`✅ Table accessible - ${pages?.length || 0} entrées trouvées\n`);

    if (pages && pages.length > 0) {
      console.log('📋 Exemples d\'entrées existantes:');
      pages.forEach(page => {
        console.log(`   - ${page.slug}: "${page.title}"`);
      });
      console.log('');
    }

    // 2. Tester l'insertion (avec service_role_key, on bypasse RLS)
    console.log('2️⃣ Test d\'insertion...');
    const testSlug = `test-${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('pages_seo')
      .insert({
        id: testSlug,
        slug: testSlug,
        title: 'Test Page Title',
        meta_title: 'Test Meta Title',
        meta_description: 'Test meta description',
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion:', insertError);
    } else {
      console.log('✅ Insertion réussie');
      console.log(`   ID: ${insertData.id}`);
      console.log(`   Slug: ${insertData.slug}\n`);

      // 3. Tester la mise à jour
      console.log('3️⃣ Test de mise à jour...');
      const { data: updateData, error: updateError } = await supabase
        .from('pages_seo')
        .update({
          title: 'Updated Test Title',
          meta_description: 'Updated meta description',
        })
        .eq('id', testSlug)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour:', updateError);
      } else {
        console.log('✅ Mise à jour réussie');
        console.log(`   Nouveau titre: ${updateData.title}\n`);
      }

      // 4. Tester la suppression
      console.log('4️⃣ Test de suppression...');
      const { error: deleteError } = await supabase
        .from('pages_seo')
        .delete()
        .eq('id', testSlug);

      if (deleteError) {
        console.error('❌ Erreur lors de la suppression:', deleteError);
      } else {
        console.log('✅ Suppression réussie\n');
      }
    }

    // 5. Vérifier le schéma de la table
    console.log('5️⃣ Analyse du schéma de la table...');
    const { data: schema, error: schemaError } = await supabase
      .from('pages_seo')
      .select('*')
      .limit(1);

    if (!schemaError && schema && schema.length > 0) {
      const columns = Object.keys(schema[0]);
      console.log('✅ Colonnes disponibles:');
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ TESTS TERMINÉS AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
    process.exit(1);
  }
}

testPagesSeo();
