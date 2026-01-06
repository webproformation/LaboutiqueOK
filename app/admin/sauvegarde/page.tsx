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
  User
} from 'lucide-react';
import { toast } from 'sonner';

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

      console.log('🔍 AUTH DIAGNOSTIC:', diagnostic);
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

  const handleBackupDatabase = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Lancement sauvegarde BDD...');
      console.log('👤 User ID:', user.id);
      console.log('🔑 Is Admin:', isAdmin);
      console.log('📊 Profile:', profile);

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

      console.log('✅ Sauvegarde créée avec succès');
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

      // Télécharger les images produits
      toast.info('Récupération des images produits...');
      const { data: productFiles, error: productError } = await supabase.storage
        .from('product-images')
        .list('products', {
          limit: 1000,
        });

      if (productError) {
        console.warn('Erreur images produits:', productError);
      } else if (productFiles) {
        const productFolder = zip.folder('product-images');
        for (const file of productFiles) {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            try {
              const { data: blob, error: downloadError } = await supabase.storage
                .from('product-images')
                .download(`products/${file.name}`);

              if (!downloadError && blob) {
                productFolder?.file(file.name, blob);
                totalFiles++;
              }
            } catch (err) {
              console.error('Download error:', file.name, err);
            }
          }
        }
      }

      // Télécharger les images catégories
      toast.info('Récupération des images catégories...');
      const { data: categoryFiles, error: categoryError } = await supabase.storage
        .from('category-images')
        .list('categories', {
          limit: 1000,
        });

      if (categoryError) {
        console.warn('Erreur images catégories:', categoryError);
      } else if (categoryFiles) {
        const categoryFolder = zip.folder('category-images');
        for (const file of categoryFiles) {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            try {
              const { data: blob, error: downloadError } = await supabase.storage
                .from('category-images')
                .download(`categories/${file.name}`);

              if (!downloadError && blob) {
                categoryFolder?.file(file.name, blob);
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#d4af37]">
              <FileArchive className="h-5 w-5" />
              Sauvegarde complète
            </CardTitle>
            <CardDescription>
              Base de données + Tous les fichiers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Sauvegarde totale :</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Toutes les données</li>
                <li>Toutes les images</li>
                <li>Tous les fichiers</li>
              </ul>
            </div>
            <Button
              onClick={handleBackupAll}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sauvegarde complète
            </Button>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
