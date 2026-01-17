'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import {
  Database,
  Image,
  FileArchive,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2
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
  const [scheduleForm, setScheduleForm] = useState<BackupSchedule>({
    type: 'all',
    frequency: 'weekly',
    time: '02:00',
  });

  const handleBackupDatabase = async () => {
    setLoading(true);
    try {
      toast.info('Préparation de l\'export de la base de données...');

      const { data, error } = await supabase.rpc('get_database_export');

      if (error) {
        console.error('RPC error:', error);
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
      console.error('Backup error:', error);
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
      const { data: files, error } = await supabase.storage
        .from('product-images')
        .list('products', {
          limit: 1000,
        });

      if (error) throw error;

      toast.success(`${files.length} images trouvées. Téléchargement en cours...`);

      for (const file of files) {
        const { data: blob, error: downloadError } = await supabase.storage
          .from('product-images')
          .download(`products/${file.name}`);

        if (downloadError) {
          console.error('Download error:', file.name, downloadError);
          continue;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success('Sauvegarde des images terminée');
    } catch (error) {
      console.error('Images backup error:', error);
      toast.error('Erreur lors de la sauvegarde des images');
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
              disabled={loading}
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
