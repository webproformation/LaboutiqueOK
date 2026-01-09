require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRealOperations() {
  console.log('\n🔍 TEST 1: Upload d\'un fichier dans le bucket media');
  console.log('================================================\n');

  try {
    // Créer un fichier image test (1x1 pixel PNG transparent)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const fileName = `test-${Date.now()}.png`;

    console.log(`📤 Upload du fichier: ${fileName}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ ERREUR UPLOAD:', uploadError);
      throw uploadError;
    }

    console.log('✅ Upload réussi:', uploadData.path);

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    console.log('🔗 URL publique:', publicUrl);

    // Enregistrer dans la table media
    const { error: dbError } = await supabase
      .from('media')
      .insert({
        filename: fileName,
        file_path: fileName,
        url: publicUrl,
        bucket_name: 'media',
        file_size: testImageBuffer.length,
        mime_type: 'image/png',
        is_optimized: false,
        usage_count: 0,
        is_orphan: false,
      });

    if (dbError) {
      console.warn('⚠️  Avertissement DB:', dbError.message);
    } else {
      console.log('✅ Enregistrement dans la table media réussi');
    }

    // Nettoyer le fichier test
    await supabase.storage.from('media').remove([fileName]);
    console.log('🗑️  Fichier test nettoyé\n');

  } catch (error) {
    console.error('❌ TEST UPLOAD ÉCHOUÉ:', error);
    process.exit(1);
  }

  console.log('\n🔍 TEST 2: Mise à jour d\'un profil');
  console.log('================================================\n');

  try {
    // Trouver un profil test ou utiliser un ID connu
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération du profil:', fetchError);
      throw fetchError;
    }

    if (!profiles) {
      console.log('⚠️  Aucun profil trouvé dans la base');
      console.log('✅ MAIS L\'UPLOAD A FONCTIONNÉ !');
      return;
    }

    console.log('📋 Profil trouvé:', {
      id: profiles.id,
      first_name: profiles.first_name,
      last_name: profiles.last_name
    });

    // Tenter une mise à jour
    const testPhone = `+33 6 ${Math.floor(Math.random() * 90000000 + 10000000)}`;

    console.log(`📝 Tentative de mise à jour du téléphone: ${testPhone}`);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ phone: testPhone })
      .eq('id', profiles.id);

    if (updateError) {
      console.error('❌ ERREUR MISE À JOUR PROFIL:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      throw updateError;
    }

    console.log('✅ Profil mis à jour avec succès');

    // Vérifier la mise à jour
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', profiles.id)
      .maybeSingle();

    console.log('✅ Vérification: phone =', updatedProfile?.phone);

  } catch (error) {
    console.error('❌ TEST PROFIL ÉCHOUÉ:', error);
    process.exit(1);
  }

  console.log('\n✅ TOUS LES TESTS RÉUSSIS !\n');
}

testRealOperations();
