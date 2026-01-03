/**
 * TEST DIRECT DE LA TABLE MEDIA_LIBRARY AVEC SERVICE_ROLE
 *
 * Utilise le service_role_key pour bypasser RLS et voir les vraies données.
 */

const { createClient } = require('@supabase/supabase-js');

// CONFIGURATION AVEC SERVICE_ROLE (bypass RLS)
const SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzMjM2MCwiZXhwIjoyMDgyNTA4MzYwfQ.mFJHZV-VdueE_okBTqkVh18tRvee94a5Z-k5TM4FQxM';

console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST DIRECT AVEC SERVICE_ROLE (BYPASS RLS)');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Projet Supabase:', SUPABASE_URL);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testMediaLibrary() {
  console.log('🔍 ÉTAPE 1: Compter le nombre d\'entrées dans media_library');
  console.log('──────────────────────────────────────────────────────────────');

  const { count, error: countError } = await supabase
    .from('media_library')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ ERREUR lors du count:', JSON.stringify(countError, null, 2));
    return;
  }

  console.log(`✅ Nombre d'entrées: ${count}`);
  console.log('');

  if (count === 0) {
    console.log('⚠️  AUCUNE ENTRÉE dans media_library sur ce projet');
    console.log('');
    console.log('Actions possibles:');
    console.log('1. Vérifier que c\'est bien le projet qcqbtmvbvipsxwjlgjvk');
    console.log('2. Synchroniser les images depuis Storage via /admin/mediatheque');
    return;
  }

  console.log('🔍 ÉTAPE 2: Récupérer les 10 premières entrées');
  console.log('──────────────────────────────────────────────────────────────');

  const { data, error } = await supabase
    .from('media_library')
    .select('id, filename, url, bucket_name, file_path, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ ERREUR lors du SELECT:', JSON.stringify(error, null, 2));
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  AUCUNE DONNÉE RETOURNÉE (mais le count indiquait des entrées)');
    return;
  }

  console.log(`✅ ${data.length} entrées récupérées :\n`);

  data.forEach((entry, index) => {
    console.log(`[${index + 1}] ────────────────────────────────────────────────`);
    console.log(`  ID:        ${entry.id}`);
    console.log(`  Filename:  ${entry.filename}`);
    console.log(`  Bucket:    ${entry.bucket_name}`);
    console.log(`  File Path: ${entry.file_path || 'N/A'}`);
    console.log(`  URL:       ${entry.url}`);
    console.log(`  Date:      ${entry.created_at}`);
    console.log('');
  });

  console.log('🔍 ÉTAPE 3: Simuler le mapping sur un produit WordPress');
  console.log('──────────────────────────────────────────────────────────────');

  // Exemple d'URL WordPress typique
  const wpExampleUrl = 'https://wp.laboutiquedemorgane.com/wp-content/uploads/2024/12/1000036586.jpg';
  const filename = wpExampleUrl.split('/').pop();
  const baseFilename = filename ? filename.replace(/\.[^.]+$/, '').toLowerCase() : '';

  console.log(`URL WordPress simulée: ${wpExampleUrl}`);
  console.log(`Nom de fichier extrait: ${filename}`);
  console.log(`Base (sans extension): ${baseFilename}`);
  console.log('');
  console.log('🔎 Recherche dans media_library...');

  const { data: searchResult, error: searchError } = await supabase
    .from('media_library')
    .select('filename, url')
    .ilike('filename', `%${baseFilename}%`)
    .limit(1);

  if (searchError) {
    console.error('❌ ERREUR lors de la recherche:', JSON.stringify(searchError, null, 2));
  } else if (searchResult && searchResult.length > 0) {
    console.log('✅ CORRESPONDANCE TROUVÉE:');
    console.log(`   Filename Supabase: ${searchResult[0].filename}`);
    console.log(`   URL Supabase:      ${searchResult[0].url}`);
    console.log('');
    console.log('🎯 MAPPER FONCTIONNERA: L\'image sera remplacée');
  } else {
    console.log('❌ AUCUNE CORRESPONDANCE trouvée');
    console.log('');
    console.log('Raisons possibles:');
    console.log('1. Le nom de fichier n\'existe pas dans media_library');
    console.log('2. Le format du nom est différent (ex: avec suffixes)');
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
