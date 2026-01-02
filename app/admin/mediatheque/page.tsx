"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HardDrive,
  Database,
  RefreshCw,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import MediaLibrary from '@/components/MediaLibrary';
import { supabase } from '@/lib/supabase-client';

interface MigrationStatus {
  pendingMigration: {
    categories: number;
    products: number;
    total: number;
  };
  mediaLibrary: Array<{
    bucket_name: string;
    total_files: number;
    total_size: number;
    orphan_count: number;
    optimized_count: number;
    avg_usage: number;
  }>;
}

interface MigrationStats {
  totalProducts: number;
  totalCategories: number;
  migratedProducts: number;
  migratedCategories: number;
  errors: string[];
  migratedFiles: Array<{
    originalUrl: string;
    newUrl: string;
    entityType: string;
    entityId: number;
  }>;
}

interface MediaSyncResult {
  success: boolean;
  message?: string;
  error?: string;
  imagesProcessed: number;
  totalImages?: number;
  imagesDownloaded: number;
  imagesUploaded: number;
  productsUpdated: number;
  errors?: Array<{
    productId: number;
    productName: string;
    imageUrl: string;
    error: string;
  }>;
  debugInfo?: {
    mode: string;
    imagesPerBatch: number;
    totalBatches: number;
    rateLimiting: string;
    hasErrors: boolean;
    errorDetails: any[];
  };
}

export default function MediathequeAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<MigrationStats | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<'product-images' | 'category-images'>('product-images');
  const [dryRun, setDryRun] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<MediaSyncResult | null>(null);
  const [showSyncConfig, setShowSyncConfig] = useState(false);
  const [settingsExist, setSettingsExist] = useState<boolean>(true);
  const [wordpressUrl, setWordpressUrl] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    checkSettings();
    loadMigrationStatus();
  }, []);

  const checkSettings = async () => {
    try {
      const response = await fetch('/api/admin/maintenance');
      const data = await response.json();

      if (data.data) {
        setSettingsExist(true);
        setWordpressUrl(data.data.wordpress_url || '');
      } else {
        setSettingsExist(false);
      }
    } catch (error) {
      console.error('Error checking settings:', error);
      setSettingsExist(false);
    }
  };

  const saveSettings = async () => {
    if (!wordpressUrl) {
      toast.error('Veuillez saisir l\'URL WordPress');
      return;
    }

    setSavingSettings(true);
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordpress_url: wordpressUrl })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Réglages sauvegardés avec succès');
        setSettingsExist(true);
      } else {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingSettings(false);
    }
  };

  const loadMigrationStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/migrate-media');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Initialiser avec des valeurs par défaut si vide
      const safeData: MigrationStatus = {
        pendingMigration: {
          categories: data?.pendingMigration?.categories || 0,
          products: data?.pendingMigration?.products || 0,
          total: data?.pendingMigration?.total || 0
        },
        mediaLibrary: Array.isArray(data?.mediaLibrary) && data.mediaLibrary.length > 0
          ? data.mediaLibrary
          : []
      };

      setMigrationStatus(safeData);
    } catch (error) {
      console.error('Error loading migration status:', error);
      toast.error('Erreur lors du chargement du statut');

      // Initialiser avec des valeurs par défaut en cas d'erreur
      setMigrationStatus({
        pendingMigration: {
          categories: 0,
          products: 0,
          total: 0
        },
        mediaLibrary: []
      });
    } finally {
      setLoading(false);
    }
  };

  const startMigration = async (entityType: 'all' | 'categories' | 'products') => {
    if (!dryRun && !confirm('Êtes-vous sûr de vouloir lancer la migration réelle ? Cette action est irréversible.')) {
      return;
    }

    setMigrating(true);
    setMigrationResults(null);

    try {
      const response = await fetch('/api/admin/migrate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, entityType })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Migration failed');
      }

      setMigrationResults(data.stats);
      toast.success(
        dryRun
          ? 'Simulation terminée avec succès'
          : 'Migration terminée avec succès'
      );

      if (!dryRun) {
        loadMigrationStatus();
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error(error.message || 'Erreur lors de la migration');
    } finally {
      setMigrating(false);
    }
  };

  const handleUploadSuccess = () => {
    console.log('🔄 Upload réussi, rafraîchissement des stats...');
    loadMigrationStatus();
    router.refresh();
    setRefreshKey(prev => prev + 1);
  };

  const cleanupOrphans = async () => {
    if (!confirm('Supprimer toutes les images non utilisées de plus de 30 jours ?')) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('cleanup_orphan_media', { p_days_old: 30 });

      if (error) throw error;

      toast.success(`${data[0]?.deleted_count || 0} images supprimées`);
      loadMigrationStatus();
      router.refresh();
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Erreur lors du nettoyage');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSyncMedia = async () => {
    if (!confirm('Lancer la synchronisation des images de produits depuis WordPress vers Supabase ?')) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/sync-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: MediaSyncResult = await response.json();
      setSyncResult(result);

      if (result.success) {
        toast.success(`Synchronisation réussie ! ${result.productsUpdated} produits mis à jour`);
        await loadMigrationStatus();
        router.refresh();
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(result.error || 'Erreur lors de la synchronisation');
      }
    } catch (error: any) {
      console.error('Error syncing media:', error);
      setSyncResult({
        success: false,
        error: error.message || 'Erreur réseau',
        imagesProcessed: 0,
        imagesDownloaded: 0,
        imagesUploaded: 0,
        productsUpdated: 0,
      });
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Médiathèque</h1>
          <p className="text-gray-600 mt-1">
            Gestion centralisée des médias Supabase
          </p>
        </div>
        <Button onClick={loadMigrationStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Alerte si settings manquants */}
      {!settingsExist && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Configuration requise
            </CardTitle>
            <CardDescription className="text-red-700">
              Les réglages de site_settings sont manquants. Veuillez configurer l'URL WordPress pour continuer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL WordPress
              </label>
              <input
                type="url"
                value={wordpressUrl}
                onChange={(e) => setWordpressUrl(e.target.value)}
                placeholder="https://wp.laboutiquedemorgane.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Exemple : https://wp.laboutiquedemorgane.com
              </p>
            </div>
            <Button
              onClick={saveSettings}
              disabled={savingSettings || !wordpressUrl}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder les réglages'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {migrationStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Migration en attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {migrationStatus.pendingMigration.total}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {migrationStatus.pendingMigration.products} produits,{' '}
                {migrationStatus.pendingMigration.categories} catégories
              </p>
            </CardContent>
          </Card>

          {Array.isArray(migrationStatus.mediaLibrary) && migrationStatus.mediaLibrary.length > 0 ? (
            migrationStatus.mediaLibrary
              .filter(stat => stat && typeof stat === 'object')
              .map((stat, index) => (
              <Card key={stat?.bucket_name || `stat-${index}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    {stat?.bucket_name === 'product-images' ? 'Images Produits' : 'Images Catégories'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat?.total_files || 0}</div>
                  <div className="space-y-1 mt-2 text-xs text-gray-600">
                    <p>Taille: {formatBytes(stat?.total_size || 0)}</p>
                    <p>Non utilisées: {stat?.orphan_count || 0}</p>
                    <p>Utilisation moyenne: {(stat?.avg_usage || 0).toFixed(1)}x</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-2">
              <CardContent className="py-8 text-center text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Aucune image dans la médiathèque</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Migration WordPress */}
      {migrationStatus && migrationStatus.pendingMigration.total > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-amber-600" />
              Migration WordPress → Supabase
            </CardTitle>
            <CardDescription>
              {migrationStatus.pendingMigration.total} images doivent être migrées depuis WordPress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setDryRun(!dryRun)}
                variant={dryRun ? "outline" : "default"}
                size="sm"
              >
                {dryRun ? 'Mode Simulation' : 'Mode Réel'}
              </Button>
              {dryRun && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Aucune modification ne sera effectuée
                </Badge>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => startMigration('all')}
                disabled={migrating}
              >
                {migrating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Migration...</>
                ) : (
                  'Tout migrer'
                )}
              </Button>
              <Button
                onClick={() => startMigration('categories')}
                disabled={migrating}
                variant="outline"
              >
                Catégories uniquement
              </Button>
              <Button
                onClick={() => startMigration('products')}
                disabled={migrating}
                variant="outline"
              >
                Produits uniquement
              </Button>
            </div>

            {migrationResults && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-2">Résultats de la migration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Produits migrés</p>
                    <p className="font-bold">
                      {migrationResults.migratedProducts} / {migrationResults.totalProducts}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Catégories migrées</p>
                    <p className="font-bold">
                      {migrationResults.migratedCategories} / {migrationResults.totalCategories}
                    </p>
                  </div>
                </div>
                {migrationResults.errors.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="font-semibold text-red-800 text-sm">Erreurs:</p>
                    <ul className="text-xs text-red-700 list-disc list-inside">
                      {migrationResults.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {migrationResults.errors.length > 5 && (
                        <li>... et {migrationResults.errors.length - 5} autres</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Synchronisation Images Produits */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Synchronisation Images Produits
              </CardTitle>
              <CardDescription>
                Importer automatiquement les images WordPress vers Supabase Storage
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowSyncConfig(!showSyncConfig)}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800"
            >
              {showSyncConfig ? 'Masquer détails' : 'Voir détails'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSyncConfig && (
            <div className="p-4 bg-white rounded-lg border border-blue-200 space-y-3">
              <h4 className="font-semibold text-sm text-blue-900">Comment ça fonctionne ?</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Le système parcourt tous les produits avec des images WordPress</li>
                <li>Chaque image est téléchargée depuis WordPress</li>
                <li>L'image est uploadée dans Supabase Storage (bucket: product-images/products/)</li>
                <li>Une entrée est créée dans la table media_library</li>
                <li>Le produit est mis à jour avec la nouvelle URL Supabase</li>
              </ol>
              <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-semibold mb-1">Mode Sécurisé activé</p>
                  <ul className="space-y-1">
                    <li>• 10 images par batch pour éviter les timeouts</li>
                    <li>• 500ms de délai entre chaque batch</li>
                    <li>• Protection try/catch sur chaque opération</li>
                    <li>• Continue même si une image échoue</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSyncMedia}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Synchroniser les images
                </>
              )}
            </Button>
          </div>

          {syncResult && (
            <div className={`p-4 rounded-lg border ${
              syncResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {syncResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className={`font-semibold ${
                  syncResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {syncResult.success ? 'Synchronisation réussie' : 'Erreur de synchronisation'}
                </h3>
              </div>

              {syncResult.success && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-gray-600 text-xs">Traités</p>
                    <p className="font-bold text-lg text-green-700">
                      {syncResult.imagesProcessed}{syncResult.totalImages ? `/${syncResult.totalImages}` : ''}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-gray-600 text-xs">Téléchargés</p>
                    <p className="font-bold text-lg text-green-700">{syncResult.imagesDownloaded}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-gray-600 text-xs">Uploadés</p>
                    <p className="font-bold text-lg text-green-700">{syncResult.imagesUploaded}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-gray-600 text-xs">Produits MAJ</p>
                    <p className="font-bold text-lg text-green-700">{syncResult.productsUpdated}</p>
                  </div>
                </div>
              )}

              {syncResult.debugInfo && (
                <div className="mt-3 text-xs text-gray-700 bg-white/50 p-2 rounded">
                  <p>
                    <strong>Mode:</strong> {syncResult.debugInfo.mode} |
                    <strong> Batch:</strong> {syncResult.debugInfo.imagesPerBatch} images |
                    <strong> Délai:</strong> {syncResult.debugInfo.rateLimiting}
                  </p>
                </div>
              )}

              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                  <p className="font-semibold text-red-800 text-sm mb-2">
                    {syncResult.errors.length} erreur(s) détectée(s):
                  </p>
                  <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {syncResult.errors.slice(0, 10).map((error, i) => (
                      <li key={i} className="border-b border-red-200 pb-1">
                        <strong>Produit {error.productId}</strong> ({error.productName}): {error.error}
                      </li>
                    ))}
                    {syncResult.errors.length > 10 && (
                      <li className="text-red-800 font-semibold">
                        ... et {syncResult.errors.length - 10} autres erreurs
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {!syncResult.success && syncResult.error && (
                <p className="mt-2 text-sm text-red-700">
                  <strong>Erreur:</strong> {syncResult.error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Médiathèque */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bibliothèque de médias</CardTitle>
              <CardDescription>
                Parcourez et gérez vos images Supabase
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={cleanupOrphans}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Nettoyer les orphelins
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedBucket} onValueChange={(v) => setSelectedBucket(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="product-images">
                Images Produits
              </TabsTrigger>
              <TabsTrigger value="category-images">
                Images Catégories
              </TabsTrigger>
            </TabsList>
            <TabsContent value="product-images" className="mt-4">
              <MediaLibrary
                key={`products-${refreshKey}`}
                bucket="product-images"
                onSelect={(url) => console.log('Selected:', url)}
                onUploadSuccess={handleUploadSuccess}
              />
            </TabsContent>
            <TabsContent value="category-images" className="mt-4">
              <MediaLibrary
                key={`categories-${refreshKey}`}
                bucket="category-images"
                onSelect={(url) => console.log('Selected:', url)}
                onUploadSuccess={handleUploadSuccess}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
