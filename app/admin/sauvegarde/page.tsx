'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import {
  Database,
  Image,
  FileArchive,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  User,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface BackupSchedule {
  type: 'database' | 'images' | 'all';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  lastBackup?: string;
  nextBackup?: string;
}

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [authDiagnostic, setAuthDiagnostic] = useState<any>(null);
  const { user, profile, isAdmin, isLoading: authLoading, initialize } = useAuthStore();
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');

  const [scheduleForm, setScheduleForm] = useState<BackupSchedule>({
    type: 'all',
    frequency: 'weekly',
    time: '02:00',
  });

  useEffect(() => {
    if (!authLoading && user) {
      runAuthDiagnostic();
    }
  }, [user, profile, authLoading]);

  const runAuthDiagnostic = async () => {
    if (!user) return;

    try {
      // Récupérer la session actuelle
      const { data: { session } } = await supabase.auth.getSession();

      // Récupérer le profil directement
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const diagnostic = {
        userId: user.id,
        userEmail: user.email,
        sessionValid: !!session,
        profileFound: !!profileData,
        isAdmin: profileData?.is_admin || false,
        profileData: profileData,
        timestamp: new Date().toISOString(),
      };

      setAuthDiagnostic(diagnostic);
    } catch (error: any) {
      console.error('Diagnostic error:', error);
      setAuthDiagnostic({ error: error?.message || 'Unknown error' });
    }
  };

  const handleForceSync = async () => {
    try {
      toast.info('Synchronisation du profil en cours...');

      // Forcer le rafraîchissement de la session
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

      if (sessionError) throw sessionError;

      if (session) {
        // Réinitialiser le store d'authentification
        await initialize();

        // Relancer le diagnostic
        await runAuthDiagnostic();

        toast.success('Profil synchronisé avec succès');
      } else {
        throw new Error('Aucune session active');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Erreur de synchronisation: ${error.message}`);
    }
  };

  const handleFullSystemBackup = async () => {
    if (!user) {
      toast.error('Vous devez être connecté', { position: 'bottom-right' });
      return;
    }

    setLoading(true);
    setExportProgress(0);

    try {
      // Étape 1 : Export de la base de données complète
      setExportStep('Export de la base de données...');
      setExportProgress(10);

      const { data: dbExport, error: dbError } = await supabase.rpc('get_full_database_export');

      if (dbError) {
        console.error('Database export error:', dbError);
        throw new Error(`Erreur base de données: ${dbError.message}`);
      }

      setExportProgress(30);

      // Étape 2 : Liste des fichiers du bucket media
      setExportStep('Récupération des médias...');
      const { data: mediaFiles, error: mediaError } = await supabase.storage
        .from('media')
        .list('', { limit: 5000 });

      const mediaManifest = mediaFiles
        ?.filter(file => file.name && file.name !== '.emptyFolderPlaceholder')
        .map(file => ({
          name: file.name,
          path: file.name,
          url: `${supabase.storage.from('media').getPublicUrl(file.name).data.publicUrl}`,
          size: file.metadata?.size || 0,
          last_modified: file.updated_at || file.created_at,
        })) || [];

      setExportProgress(60);

      // Étape 3 : Création du manifest storage
      setExportStep('Création du manifest storage...');
      const storageManifest = {
        'media': {
          bucket: 'media',
          path: '',
          count: mediaManifest.length,
          total_size: mediaManifest.reduce((sum, file) => sum + file.size, 0),
          files: mediaManifest,
        },
      };

      setExportProgress(70);

      // Étape 4 : Création de l'environment summary
      setExportStep('Génération du résumé d\'environnement...');
      const environmentSummary = {
        next_version: '13.5.1',
        node_version: typeof process !== 'undefined' ? process.version : 'unknown',
        project_url: 'https://qcqbtmvbvipsxwjlgjvk.supabase.co',
        project_id: 'qcqbtmvbvipsxwjlgjvk',
        deployment_platform: 'Netlify',
        framework: 'Next.js',
        database: 'Supabase PostgreSQL',
        storage_buckets: ['media'],
        key_routes: [
          '/',
          '/admin',
          '/admin/products',
          '/admin/categories-management',
          '/admin/actualites',
          '/admin/sauvegarde',
          '/product/[slug]',
          '/category/[slug]',
          '/cart',
          '/checkout',
        ],
        environment: {
          has_stripe: true,
          has_paypal: true,
          has_mondial_relay: true,
          has_maps_api: true,
        },
      };

      setExportProgress(80);

      // Étape 5 : Compilation du super JSON final
      setExportStep('Compilation du super JSON...');
      const superExport = {
        database: dbExport,
        storage_manifest: storageManifest,
        environment_summary: environmentSummary,
        _export_info: {
          export_type: 'FULL_SYSTEM_BACKUP',
          export_date: new Date().toISOString(),
          export_version: '2.0',
          project: 'qcqbtmvbvipsxwjlgjvk',
          exported_by: user.email,
          user_id: user.id,
          total_db_tables: Object.keys(dbExport).filter(k => !k.startsWith('_')).length,
          total_storage_files: mediaManifest.length,
          total_storage_size_bytes: storageManifest['media'].total_size,
          database_records: Object.values(dbExport)
            .filter(val => Array.isArray(val))
            .reduce((sum: number, arr: any) => sum + arr.length, 0),
        },
      };

      setExportProgress(90);

      // Étape 6 : Téléchargement du fichier
      setExportStep('Téléchargement du fichier...');
      const blob = new Blob([JSON.stringify(superExport, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-COMPLET-lbdm-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportProgress(100);
      setExportStep('Terminé !');

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Sauvegarde complète créée !</p>
          <p className="text-sm">{superExport._export_info.database_records} enregistrements</p>
          <p className="text-sm">{superExport._export_info.total_storage_files} fichiers média</p>
        </div>,
        { position: 'bottom-right', duration: 5000 }
      );

      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setExportProgress(0);
        setExportStep('');
      }, 2000);
    } catch (error: any) {
      console.error('Full backup error:', error);
      toast.error(
        error.message || 'Erreur lors de la sauvegarde complète',
        { position: 'bottom-right' }
      );
      setExportProgress(0);
      setExportStep('');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setLoading(true);
    try {
      toast.info('Préparation de l\'export de la base de données...');

      const { data, error } = await supabase.rpc('get_database_export');

      if (error) {
        console.error('❌ RPC error:', error);

        // Erreur de droits spécifique
        if (error.message.includes('Accès refusé') || error.message.includes('administrateur')) {
          toast.error(
            <div className="space-y-2">
              <p className="font-semibold">Erreur de droits administrateur</p>
              <p className="text-sm">User ID: {user.id}</p>
              <p className="text-sm">Admin Status: {isAdmin ? 'Oui' : 'Non'}</p>
            </div>
          );
          return;
        }

        throw new Error(`Erreur RPC: ${error.message}`);
      }

      if (!data) {
        throw new Error('Aucune donnée reçue de la base');
      }

      // Créer le fichier JSON
      const exportData = {
        ...data,
        _export_info: {
          date: new Date().toISOString(),
          version: '1.0',
          project: 'qcqbtmvbvipsxwjlgjvk',
          exported_by: user.email,
          user_id: user.id,
          tables: Object.keys(data).filter(k => !k.startsWith('_')),
          total_records: Object.values(data).reduce((sum: number, val: any) =>
            sum + (Array.isArray(val) ? val.length : 0), 0
          )
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-lbdm-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        `Sauvegarde créée avec succès ! ${exportData._export_info.total_records} enregistrements exportés.`
      );
    } catch (error: any) {
      console.error('❌ Backup error:', error);
      toast.error(
        error.message || 'Erreur lors de la sauvegarde. Vérifiez la console pour plus de détails.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackupImages = async () => {
    setLoading(true);
    try {
      // Dynamiquement importer JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      let totalFiles = 0;

      // Télécharger les médias
      toast.info('Récupération des médias...');
      const { data: mediaFiles, error: mediaError } = await supabase.storage
        .from('media')
        .list('', {
          limit: 5000,
        });

      if (mediaError) {
        console.warn('Erreur médias:', mediaError);
      } else if (mediaFiles) {
        const mediaFolder = zip.folder('media');
        for (const file of mediaFiles) {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            try {
              const { data: blob, error: downloadError } = await supabase.storage
                .from('media')
                .download(file.name);

              if (!downloadError && blob) {
                mediaFolder?.file(file.name, blob);
                totalFiles++;
              }
            } catch (err) {
              console.error('Download error:', file.name, err);
            }
          }
        }
      }

      if (totalFiles === 0) {
        toast.error('Aucune image trouvée');
        return;
      }

      // Générer le ZIP
      toast.info(`Création du fichier ZIP avec ${totalFiles} images...`);
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Télécharger le ZIP
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-images-lbdm-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Sauvegarde terminée : ${totalFiles} images téléchargées`);
    } catch (error: any) {
      console.error('Images backup error:', error);
      toast.error(`Erreur lors de la sauvegarde : ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupAll = async () => {
    setLoading(true);
    try {
      await handleBackupDatabase();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handleBackupImages();
      toast.success('Sauvegarde complète terminée');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde complète');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleBackup = async () => {
    try {
      localStorage.setItem('backup-schedule', JSON.stringify(scheduleForm));
      toast.success('Programmation de sauvegarde enregistrée');
    } catch (error) {
      toast.error('Erreur lors de la programmation');
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Veuillez sélectionner un fichier JSON');
      return;
    }

    const confirmed = confirm(
      '⚠️ ATTENTION : La restauration va ÉCRASER toutes les données actuelles.\n\n' +
      'Cette opération est IRRÉVERSIBLE.\n\n' +
      'Assurez-vous d\'avoir une sauvegarde récente avant de continuer.\n\n' +
      'Voulez-vous vraiment continuer ?'
    );

    if (!confirmed) {
      event.target.value = '';
      return;
    }

    setLoading(true);
    setExportProgress(0);
    setExportStep('Lecture du fichier...');

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      setExportProgress(10);

      if (!backup._export_info) {
        throw new Error('Format de sauvegarde invalide (pas de _export_info)');
      }

      const isFullBackup = backup.database && backup.storage_manifest;
      const dataToRestore = isFullBackup ? backup.database : backup;

      const tables = Object.keys(dataToRestore).filter(k => !k.startsWith('_'));
      const totalTables = tables.length;
      let restoredTables = 0;
      let totalRecords = 0;

      toast.info(`Restauration de ${totalTables} tables...`);

      for (const tableName of tables) {
        const records = dataToRestore[tableName];
        if (!Array.isArray(records) || records.length === 0) continue;

        setExportStep(`Restauration de ${tableName}...`);
        setExportProgress(10 + (restoredTables / totalTables) * 80);

        try {
          const { error } = await supabase
            .from(tableName)
            .upsert(records, { onConflict: 'id' });

          if (error) {
            console.error(`Erreur ${tableName}:`, error);
            toast.warning(`${tableName}: ${error.message}`, { duration: 2000 });
          } else {
            restoredTables++;
            totalRecords += records.length;
          }
        } catch (tableError: any) {
          console.error(`Erreur critique ${tableName}:`, tableError);
        }
      }

      setExportProgress(100);
      setExportStep('Terminé !');

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Restauration terminée !</p>
          <p className="text-sm">{restoredTables}/{totalTables} tables restaurées</p>
          <p className="text-sm">{totalRecords} enregistrements</p>
        </div>,
        { duration: 7000 }
      );

      setTimeout(() => {
        setExportProgress(0);
        setExportStep('');
      }, 3000);

    } catch (error: any) {
      console.error('Restore error:', error);
      toast.error(
        <div className="space-y-1">
          <p className="font-semibold">Erreur de restauration</p>
          <p className="text-sm">{error.message}</p>
        </div>,
        { duration: 7000 }
      );
      setExportProgress(0);
      setExportStep('');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleGenerateSitemap = async () => {
    setLoading(true);
    setExportStep('Génération du sitemap...');
    setExportProgress(0);

    try {
      const sitemap: any = {
        generated_at: new Date().toISOString(),
        base_url: typeof window !== 'undefined' ? window.location.origin : 'https://laboutiquedemorgane.com',
        pages: []
      };

      // Pages statiques
      setExportProgress(10);
      sitemap.pages.push(
        { url: '/', type: 'home', priority: 1.0 },
        { url: '/actualites', type: 'news', priority: 0.8 },
        { url: '/les-looks-de-morgane', type: 'looks', priority: 0.7 },
        { url: '/livre-dor', type: 'guestbook', priority: 0.6 },
        { url: '/contact', type: 'contact', priority: 0.7 },
        { url: '/qui-sommes-nous', type: 'about', priority: 0.6 },
        { url: '/cgv', type: 'legal', priority: 0.4 },
        { url: '/mentions-legales', type: 'legal', priority: 0.4 },
        { url: '/politique-confidentialite', type: 'legal', priority: 0.4 },
        { url: '/carte-cadeau', type: 'gift-card', priority: 0.8 }
      );

      // Produits
      setExportStep('Chargement des produits...');
      setExportProgress(20);
      const { data: products } = await supabase
        .from('products')
        .select('id, slug, name, updated_at')
        .eq('is_visible', true)
        .order('updated_at', { ascending: false });

      if (products) {
        products.forEach(product => {
          sitemap.pages.push({
            url: `/product/${product.slug}`,
            type: 'product',
            id: product.id,
            title: product.name,
            lastmod: product.updated_at,
            priority: 0.9
          });
        });
      }

      // Catégories
      setExportStep('Chargement des catégories...');
      setExportProgress(50);
      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug, name, updated_at')
        .eq('is_visible', true)
        .order('updated_at', { ascending: false });

      if (categories) {
        categories.forEach(category => {
          sitemap.pages.push({
            url: `/category/${category.slug}`,
            type: 'category',
            id: category.id,
            title: category.name,
            lastmod: category.updated_at,
            priority: 0.8
          });
        });
      }

      // Articles
      setExportStep('Chargement des actualités...');
      setExportProgress(70);
      const { data: news } = await supabase
        .from('news')
        .select('id, slug, title, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false });

      if (news) {
        news.forEach(article => {
          sitemap.pages.push({
            url: `/actualites/${article.slug}`,
            type: 'news-article',
            id: article.id,
            title: article.title,
            lastmod: article.updated_at,
            priority: 0.7
          });
        });
      }

      // Statistiques
      setExportProgress(90);
      sitemap.stats = {
        total_pages: sitemap.pages.length,
        total_products: products?.length || 0,
        total_categories: categories?.length || 0,
        total_news: news?.length || 0,
        static_pages: sitemap.pages.filter((p: any) => ['home', 'news', 'looks', 'guestbook', 'contact', 'about', 'legal', 'gift-card'].includes(p.type)).length
      };

      // Téléchargement
      setExportProgress(100);
      setExportStep('Téléchargement...');

      const blob = new Blob([JSON.stringify(sitemap, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitemap-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Sitemap généré !</p>
          <p className="text-sm">{sitemap.stats.total_pages} pages</p>
          <p className="text-sm">{sitemap.stats.total_products} produits</p>
          <p className="text-sm">{sitemap.stats.total_categories} catégories</p>
          <p className="text-sm">{sitemap.stats.total_news} articles</p>
        </div>,
        { duration: 5000 }
      );

      setTimeout(() => {
        setExportProgress(0);
        setExportStep('');
      }, 2000);

    } catch (error: any) {
      console.error('Sitemap generation error:', error);
      toast.error(`Erreur: ${error.message || 'Erreur inconnue'}`);
      setExportProgress(0);
      setExportStep('');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sauvegardes</h1>
          <p className="text-gray-600 mt-2">
            Gérez les sauvegardes de votre site web
          </p>
        </div>
      </div>

      {/* Diagnostic d'authentification */}
      {authDiagnostic && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Diagnostic d'authentification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">User ID:</span>
              <code className="bg-white px-2 py-1 rounded text-xs">{authDiagnostic.userId}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Email:</span>
              <span className="font-medium text-gray-900">{authDiagnostic.userEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Session valide:</span>
              <span className={authDiagnostic.sessionValid ? 'text-green-600 font-semibold' : 'text-red-600'}>
                {authDiagnostic.sessionValid ? '✓ Oui' : '✗ Non'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Profil trouvé:</span>
              <span className={authDiagnostic.profileFound ? 'text-green-600 font-semibold' : 'text-red-600'}>
                {authDiagnostic.profileFound ? '✓ Oui' : '✗ Non'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Statut Admin:</span>
              <span className={authDiagnostic.isAdmin ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                {authDiagnostic.isAdmin ? '✓ Administrateur' : '✗ Non admin'}
              </span>
            </div>

            {!authDiagnostic.isAdmin && (
              <div className="pt-4 border-t border-blue-200 mt-4">
                <Button
                  onClick={handleForceSync}
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Forcer la synchronisation du profil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Alert className="border-[#d4af37] bg-[#d4af37]/5">
        <AlertTriangle className="h-4 w-4 text-[#d4af37]" />
        <AlertDescription className="text-gray-700">
          <strong>Important :</strong> Les sauvegardes manuelles téléchargent les fichiers directement sur votre ordinateur.
          Conservez-les en lieu sûr.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#d4af37]">
              <Database className="h-5 w-5" />
              Base de données
            </CardTitle>
            <CardDescription>
              Sauvegarde complète de toutes les tables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Inclut :</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Produits</li>
                <li>Catégories</li>
                <li>Commandes</li>
                <li>Clients</li>
                <li>Actualités</li>
              </ul>
            </div>
            <Button
              onClick={handleBackupDatabase}
              disabled={loading || authLoading}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sauvegarder la BDD
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#d4af37]">
              <Image className="h-5 w-5" />
              Images & Médias
            </CardTitle>
            <CardDescription>
              Téléchargement de toutes les images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Inclut :</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Images produits</li>
                <li>Images catégories</li>
                <li>Images actualités</li>
                <li>Logos</li>
              </ul>
            </div>
            <Button
              onClick={handleBackupImages}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sauvegarder les images
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#d4af37]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#d4af37]">
              <Package className="h-5 w-5" />
              Sauvegarde Totale (DB + Media + Config)
            </CardTitle>
            <CardDescription>
              Export complet : Base de données, Manifest des médias et Configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-2">Super JSON inclut :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>TOUTES les tables de la base de données (47 tables)</li>
                <li>Manifest complet du storage avec URLs des photos</li>
                <li>Résumé de l'environnement et configuration</li>
                <li>Métadonnées complètes d'export</li>
              </ul>
            </div>
            <Button
              onClick={handleFullSystemBackup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] font-semibold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Sauvegarde Totale Système
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <FileArchive className="h-5 w-5" />
              Génération Sitemap
            </CardTitle>
            <CardDescription>
              Générer un fichier sitemap.json complet du site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-2">Le sitemap inclut :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Toutes les pages statiques du site</li>
                <li>Tous les produits visibles avec leurs URLs</li>
                <li>Toutes les catégories visibles</li>
                <li>Tous les articles d'actualités publiés</li>
                <li>Statistiques et métadonnées complètes</li>
              </ul>
            </div>
            <Button
              onClick={handleGenerateSitemap}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileArchive className="h-4 w-4 mr-2" />
              )}
              Générer Sitemap JSON
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-red-200 bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <RefreshCw className="h-5 w-5" />
            Restauration de Sauvegarde
          </CardTitle>
          <CardDescription className="text-red-600">
            ⚠️ ATTENTION : Cette opération écrase toutes les données actuelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-300 bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-700" />
            <AlertDescription className="text-red-800">
              <strong>DANGER :</strong> La restauration est IRRÉVERSIBLE. Assurez-vous d'avoir une sauvegarde récente avant de continuer.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Sélectionnez un fichier JSON de sauvegarde pour restaurer la base de données :
            </p>
            <div className="flex gap-3">
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                disabled={loading}
                className="flex-1 px-3 py-2 border-2 border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                id="restore-input"
              />
              <label
                htmlFor="restore-input"
                className="cursor-pointer"
              >
                <Button
                  type="button"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => document.getElementById('restore-input')?.click()}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Restaurer
                </Button>
              </label>
            </div>
            <p className="text-xs text-gray-600">
              Formats acceptés : backup-lbdm-*.json ou backup-COMPLET-lbdm-*.json
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Programmation automatique</CardTitle>
          <CardDescription>
            Planifiez des sauvegardes automatiques régulières
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={scheduleForm.type} onValueChange={(v) => setScheduleForm({ ...scheduleForm, type: v as any })}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="database">Base de données</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="all">Tout</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4" />
                Fréquence
              </Label>
              <select
                value={scheduleForm.frequency}
                onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-[#d4af37]/30 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              >
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4" />
                Heure de sauvegarde
              </Label>
              <input
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                className="w-full px-3 py-2 border border-[#d4af37]/30 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-gray-700">
              <strong>Récapitulatif :</strong> Sauvegarde {scheduleForm.type === 'database' ? 'de la base de données' : scheduleForm.type === 'images' ? 'des images' : 'complète'}
              {' '}{scheduleForm.frequency === 'daily' ? 'tous les jours' : scheduleForm.frequency === 'weekly' ? 'toutes les semaines' : 'tous les mois'}
              {' '}à {scheduleForm.time}
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button
              onClick={handleScheduleBackup}
              className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Programmer la sauvegarde
            </Button>
          </div>

          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-gray-700 text-sm">
              <strong>Note :</strong> La programmation automatique nécessite un service externe (cron job) pour fonctionner.
              La configuration enregistrée localement servira de référence pour la mise en place du système automatisé.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Barre de progression en bas à droite */}
      {exportProgress > 0 && exportProgress < 100 && (
        <div className="fixed bottom-4 right-4 w-96 bg-white border-2 border-[#d4af37] rounded-lg shadow-2xl p-4 z-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Export en cours...</span>
              <span className="text-sm font-medium text-[#d4af37]">{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
            {exportStep && (
              <p className="text-xs text-gray-600">{exportStep}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
