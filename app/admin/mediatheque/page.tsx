"use client";

import { useState, useEffect } from 'react';
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

export default function MediathequeAdminPage() {
  const [loading, setLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<MigrationStats | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<'product-images' | 'category-images'>('product-images');
  const [dryRun, setDryRun] = useState(true);

  useEffect(() => {
    loadMigrationStatus();
  }, []);

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

  const cleanupOrphans = async () => {
    if (!confirm('Supprimer toutes les images non utilisées de plus de 30 jours ?')) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('cleanup_orphan_media', { p_days_old: 30 });

      if (error) throw error;

      toast.success(`${data[0]?.deleted_count || 0} images supprimées`);
      loadMigrationStatus();
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

          {migrationStatus.mediaLibrary.length > 0 ? (
            migrationStatus.mediaLibrary.map((stat) => (
              <Card key={stat?.bucket_name || 'unknown'}>
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
                bucket="product-images"
                onSelect={(url) => console.log('Selected:', url)}
              />
            </TabsContent>
            <TabsContent value="category-images" className="mt-4">
              <MediaLibrary
                bucket="category-images"
                onSelect={(url) => console.log('Selected:', url)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
