/**
 * TEST DIRECT DE LA TABLE MEDIA_LIBRARY
 *
 * Ce script vérifie les données réelles dans la table media_library
 * sans cache, sans optimisation, juste une requête SELECT directe.
 */

const { createClient } = require('@supabase/supabase-js');

// CONFIGURATION EXPLICITE DU BON PROJET
const SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.4RdXgF0F_cGY0X0gZ8wZ0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0';

console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST DIRECT DE LA TABLE MEDIA_LIBRARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Projet Supabase:', SUPABASE_URL);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMediaLibrary() {
  console.log('🔍 ÉTAPE 1: Compter le nombre d\'entrées dans media_library');
  console.log('──────────────────────────────────────────────────────────────');

  const { count, error: countError } = await supabase
    .from('media_library')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ ERREUR lors du count:', countError);
    return;
  }

  console.log(`✅ Nombre d'entrées: ${count}`);
  console.log('');

  if (count === 0) {
    console.log('⚠️  AUCUNE ENTRÉE TROUVÉE dans media_library');
    console.log('Vérifiez que vous êtes bien sur le bon projet Supabase.');
    return;
  }

  console.log('🔍 ÉTAPE 2: Récupérer les 10 premières entrées');
  console.log('──────────────────────────────────────────────────────────────');

  const { data, error } = await supabase
    .from('media_library')
    .select('id, filename, url, bucket_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ ERREUR lors du SELECT:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  AUCUNE DONNÉE RETOURNÉE (mais le count indiquait des entrées)');
    return;
  }

  console.log(`✅ ${data.length} entrées récupérées :\n`);

  data.forEach((entry, index) => {
    console.log(`[${index + 1}] ────────────────────────────────────────────────`);
    console.log(`  ID:       ${entry.id}`);
    console.log(`  Filename: ${entry.filename}`);
    console.log(`  Bucket:   ${entry.bucket_name}`);
    console.log(`  URL:      ${entry.url}`);
    console.log(`  Date:     ${entry.created_at}`);
    console.log('');
  });

  console.log('🔍 ÉTAPE 3: Tester le mapping sur un exemple');
  console.log('──────────────────────────────────────────────────────────────');

  if (data.length > 0) {
    const testFilename = data[0].filename;
    const baseFilename = testFilename.replace(/\.[^.]+$/, '').toLowerCase();

    console.log(`Fichier de test: ${testFilename}`);
    console.log(`Base du nom (sans extension): ${baseFilename}`);
    console.log('');
    console.log('🔎 Recherche dans la table (insensible à la casse)...');

    const { data: searchResult, error: searchError } = await supabase
      .from('media_library')
      .select('filename, url')
      .ilike('filename', `%${baseFilename}%`)
      .limit(1);

    if (searchError) {
      console.error('❌ ERREUR lors de la recherche:', searchError);
    } else if (searchResult && searchResult.length > 0) {
      console.log('✅ CORRESPONDANCE TROUVÉE:');
      console.log(`   Filename: ${searchResult[0].filename}`);
      console.log(`   URL:      ${searchResult[0].url}`);
    } else {
      console.log('❌ AUCUNE CORRESPONDANCE trouvée');
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TEST TERMINÉ');
  console.log('═══════════════════════════════════════════════════════════════');
}

testMediaLibrary()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ ERREUR FATALE:', err);
    process.exit(1);
  });
