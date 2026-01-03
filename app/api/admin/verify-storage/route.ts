import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  addLog('════════════════════════════════════════════════════════════════');
  addLog('VÉRIFICATION COMPLÈTE DU STORAGE SUPABASE');
  addLog('════════════════════════════════════════════════════════════════');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    addLog(`📍 Supabase URL: ${supabaseUrl}`);
    addLog(`🔑 Service Key: ${supabaseServiceKey ? '✅ Présente' : '❌ Manquante'}`);

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: 'Configuration manquante', logs }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    addLog('');
    addLog('🗄️  LISTE DES BUCKETS');
    addLog('────────────────────────────────────────────────────────────────');

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      addLog(`❌ Erreur listage buckets: ${JSON.stringify(bucketsError)}`);
      return NextResponse.json({ success: false, error: bucketsError.message, logs }, { status: 500 });
    }

    addLog(`✅ ${buckets?.length || 0} buckets trouvés`);
    buckets?.forEach(b => {
      addLog(`   - ${b.name} (public: ${b.public ? 'OUI' : 'NON'}, created: ${b.created_at})`);
    });

    const targetBuckets = ['product-images', 'category-images'];
    const results: any = {};

    for (const bucketName of targetBuckets) {
      addLog('');
      addLog(`🪣 BUCKET: ${bucketName}`);
      addLog('────────────────────────────────────────────────────────────────');

      const bucketExists = buckets?.some(b => b.name === bucketName);
      if (!bucketExists) {
        addLog(`❌ Le bucket ${bucketName} n'existe pas`);
        results[bucketName] = { exists: false, files: [] };
        continue;
      }

      addLog(`✅ Bucket ${bucketName} existe`);

      // Scanner la RACINE
      addLog(`\n📁 Scan RACINE du bucket...`);
      const { data: rootFiles, error: rootError } = await supabase
        .storage
        .from(bucketName)
        .list('', { limit: 1000 });

      if (rootError) {
        addLog(`❌ Erreur scan racine: ${JSON.stringify(rootError)}`);
      } else {
        addLog(`📊 ${rootFiles?.length || 0} éléments à la racine`);
        rootFiles?.forEach(f => {
          addLog(`   - ${f.name} (${f.metadata?.size || 0} bytes)`);
        });
      }

      // Scanner products/
      addLog(`\n📁 Scan dossier products/...`);
      const { data: productsFiles, error: productsError } = await supabase
        .storage
        .from(bucketName)
        .list('products', { limit: 1000 });

      if (productsError) {
        addLog(`❌ Erreur scan products/: ${JSON.stringify(productsError)}`);
      } else {
        addLog(`📊 ${productsFiles?.length || 0} éléments dans products/`);
        productsFiles?.forEach(f => {
          addLog(`   - ${f.name} (${f.metadata?.size || 0} bytes)`);
        });
      }

      // Scanner categories/
      addLog(`\n📁 Scan dossier categories/...`);
      const { data: categoriesFiles, error: categoriesError } = await supabase
        .storage
        .from(bucketName)
        .list('categories', { limit: 1000 });

      if (categoriesError) {
        addLog(`❌ Erreur scan categories/: ${JSON.stringify(categoriesError)}`);
      } else {
        addLog(`📊 ${categoriesFiles?.length || 0} éléments dans categories/`);
        categoriesFiles?.forEach(f => {
          addLog(`   - ${f.name} (${f.metadata?.size || 0} bytes)`);
        });
      }

      results[bucketName] = {
        exists: true,
        rootFiles: rootFiles?.length || 0,
        productsFiles: productsFiles?.length || 0,
        categoriesFiles: categoriesFiles?.length || 0,
        totalFiles: (rootFiles?.length || 0) + (productsFiles?.length || 0) + (categoriesFiles?.length || 0)
      };
    }

    addLog('');
    addLog('════════════════════════════════════════════════════════════════');
    addLog('📊 RÉSUMÉ');
    addLog('════════════════════════════════════════════════════════════════');

    let totalFiles = 0;
    for (const [bucket, data] of Object.entries(results)) {
      if ((data as any).totalFiles) {
        totalFiles += (data as any).totalFiles;
        addLog(`${bucket}: ${(data as any).totalFiles} fichiers`);
      }
    }

    addLog(`\n🔢 TOTAL: ${totalFiles} fichiers dans tous les buckets`);

    if (totalFiles === 0) {
      addLog('');
      addLog('⚠️  AUCUN FICHIER TROUVÉ');
      addLog('💡 Uploadez des images via:');
      addLog('   - L\'interface admin: /admin/mediatheque');
      addLog('   - Le Supabase Dashboard: Storage section');
      addLog('   - L\'API d\'upload');
    }

    addLog('════════════════════════════════════════════════════════════════');

    return NextResponse.json({
      success: true,
      totalFiles,
      results,
      logs
    });

  } catch (error: any) {
    addLog('');
    addLog('❌ ERREUR FATALE');
    addLog(`Message: ${error.message}`);
    addLog(`Stack: ${error.stack}`);

    return NextResponse.json({
      success: false,
      error: error.message,
      logs
    }, { status: 500 });
  }
}
