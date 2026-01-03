import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  addLog('════════════════════════════════════════════════════════════════');
  addLog('[SYNC MEDIA] DÉMARRAGE DE LA SYNCHRONISATION MASSIVE');
  addLog('════════════════════════════════════════════════════════════════');

  try {
    const body = await request.json().catch(() => ({}));
    const targetBucket = body.bucket;

    const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    addLog(`📍 Supabase URL: ${supabaseUrl}`);
    addLog(`🔑 Service Key présente: ${supabaseServiceKey ? 'OUI' : 'NON'}`);

    if (!supabaseUrl || !supabaseServiceKey) {
      addLog('❌ ERREUR CRITIQUE: Configuration Supabase manquante');
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante', logs },
        { status: 500 }
      );
    }

    // FORCE SERVICE_ROLE CLIENT
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    addLog('✅ Client service_role créé avec succès');

    const buckets = targetBucket ? [targetBucket] : ['product-images', 'category-images'];
    addLog(`📦 Buckets à traiter: ${buckets.join(', ')}`);

    let totalSynced = 0;
    let totalErrors = 0;
    const errorDetails: any[] = [];

    for (const bucket of buckets) {
      addLog('');
      addLog('────────────────────────────────────────────────────────────────');
      addLog(`🪣 TRAITEMENT DU BUCKET: ${bucket}`);
      addLog('────────────────────────────────────────────────────────────────');

      // SCANNER PLUSIEURS EMPLACEMENTS
      const locationsToScan = [
        '', // RACINE du bucket
        bucket === 'product-images' ? 'products' : 'categories', // Sous-dossier
      ];

      let allFiles: any[] = [];

      for (const location of locationsToScan) {
        const displayPath = location || 'RACINE';
        addLog(`📁 Scan de: ${bucket}/${displayPath}`);
        addLog(`🔍 Appel Storage API: list('${location}', { limit: 1000 })`);

        const { data: storageFiles, error: storageError } = await supabase
          .storage
          .from(bucket)
          .list(location, {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (storageError) {
          addLog(`❌ ERREUR STORAGE pour ${displayPath}: ${JSON.stringify(storageError, null, 2)}`);
          errorDetails.push({ bucket, location: displayPath, error: 'Storage list failed', details: storageError });
          continue;
        }

        addLog(`📊 Résultat: ${storageFiles ? storageFiles.length : 0} fichiers dans ${displayPath}`);

        if (storageFiles && storageFiles.length > 0) {
          // Ajouter le préfixe de location pour les fichiers
          const filesWithPath = storageFiles.map(f => ({
            ...f,
            fullPath: location ? `${location}/${f.name}` : f.name
          }));
          allFiles.push(...filesWithPath);
        }
      }

      addLog('');
      addLog(`📊 TOTAL pour ${bucket}: ${allFiles.length} fichiers trouvés`);

      if (allFiles.length === 0) {
        addLog(`⚠️  AUCUN FICHIER dans ${bucket} (ni racine, ni sous-dossiers)`);
        addLog(`💡 Vérifiez que des fichiers existent dans ce bucket via le Supabase Dashboard`);
        continue;
      }

      addLog(`✅ ${allFiles.length} fichiers détectés dans ${bucket}`);
      addLog('');
      addLog('🔄 DÉBUT DE L\'INSERTION EN BASE...');

      // Pour chaque fichier, forcer l'insertion
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];

        addLog(`\n[${i + 1}/${allFiles.length}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        addLog(`📄 Fichier: ${file.name} (fullPath: ${file.fullPath})`);

        if (!file.name || file.name.endsWith('/') || file.name === '.emptyFolderPlaceholder') {
          addLog('⏭️  SKIP: Dossier ou fichier système');
          continue;
        }

        // Construire l'URL publique avec le chemin complet
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(file.fullPath);

        const publicUrl = urlData.publicUrl;
        addLog(`🔗 URL générée: ${publicUrl}`);

        // Préparer l'entrée media_library
        const mediaEntry = {
          filename: file.name,
          url: publicUrl,
          file_path: `${bucket}/${file.fullPath}`,
          bucket_name: bucket,
          file_size: file.metadata?.size || 0,
          mime_type: file.metadata?.mimetype || 'image/jpeg',
          usage_count: 0,
          is_orphan: true,
          uploaded_by: null
        };

        addLog(`📝 Données à insérer: ${JSON.stringify(mediaEntry, null, 2)}`);

        // INSERTION FORCÉE avec UPSERT
        const { data: insertedData, error: insertError } = await supabase
          .from('media_library')
          .upsert(mediaEntry, {
            onConflict: 'url',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (insertError) {
          addLog(`❌ ERREUR D'INSERTION: ${JSON.stringify(insertError, null, 2)}`);
          addLog(`   Code: ${insertError.code}`);
          addLog(`   Message: ${insertError.message}`);
          addLog(`   Détails: ${insertError.details}`);
          addLog(`   Hint: ${insertError.hint}`);
          errorDetails.push({
            file: file.name,
            error: insertError.message,
            code: insertError.code,
            details: insertError
          });
          totalErrors++;
        } else if (insertedData) {
          addLog(`✅ SUCCÈS: Fichier inséré avec ID ${insertedData.id}`);
          totalSynced++;
        } else {
          addLog(`⚠️  ANOMALIE: Pas d'erreur mais pas de données retournées`);
          totalErrors++;
        }
      }

      addLog('');
      addLog(`📊 BILAN BUCKET ${bucket}:`);
      addLog(`   ✅ Synchronisés: ${totalSynced}`);
      addLog(`   ❌ Erreurs: ${totalErrors}`);
    }

    addLog('');
    addLog('════════════════════════════════════════════════════════════════');
    addLog('📊 BILAN FINAL DE LA SYNCHRONISATION');
    addLog('════════════════════════════════════════════════════════════════');
    addLog(`✅ Total synchronisés: ${totalSynced}`);
    addLog(`❌ Total erreurs: ${totalErrors}`);
    addLog('════════════════════════════════════════════════════════════════');

    // Vérification finale en base
    const { data: finalCount } = await supabase
      .from('media_library')
      .select('id', { count: 'exact', head: true });

    addLog(`🔍 Vérification finale: ${(finalCount as any)?.count || 0} entrées dans media_library`);

    return NextResponse.json({
      success: totalSynced > 0,
      message: `${totalSynced} fichiers synchronisés dans media_library`,
      totalSynced,
      totalErrors,
      errorDetails,
      logs
    });

  } catch (error: any) {
    addLog('');
    addLog('═══════════════════════════════════════════════════════════════');
    addLog('❌ ERREUR CRITIQUE FATALE');
    addLog('═══════════════════════════════════════════════════════════════');
    addLog(`Message: ${error.message}`);
    addLog(`Stack: ${error.stack}`);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la synchronisation',
        logs
      },
      { status: 500 }
    );
  }
}
