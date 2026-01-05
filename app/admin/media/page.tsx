'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import MediaLibrary from '@/components/MediaLibrary';
import { RefreshCw, Database, HardDrive, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BucketStats {
  totalFiles: number;
  totalSize: number;
  usedFiles: number;
  orphanFiles: number;
}

export default function MediaAdminPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, BucketStats>>({
    'product-images': { totalFiles: 0, totalSize: 0, usedFiles: 0, orphanFiles: 0 },
    'category-images': { totalFiles: 0, totalSize: 0, usedFiles: 0, orphanFiles: 0 },
  });
  const [selectedBucket, setSelectedBucket] = useState<'product-images' | 'category-images'>('product-images');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media')
        .select('bucket_name, file_size, is_orphan, usage_count');

      if (error) throw error;

      const calculatedStats: Record<string, BucketStats> = {
        'product-images': { totalFiles: 0, totalSize: 0, usedFiles: 0, orphanFiles: 0 },
        'category-images': { totalFiles: 0, totalSize: 0, usedFiles: 0, orphanFiles: 0 },
      };

      data?.forEach((file: any) => {
        const bucketName = file.bucket_name as string;
        if (calculatedStats[bucketName]) {
          calculatedStats[bucketName].totalFiles++;
          calculatedStats[bucketName].totalSize += file.file_size || 0;
          if (file.usage_count && file.usage_count > 0) {
            calculatedStats[bucketName].usedFiles++;
          }
          if (file.is_orphan) {
            calculatedStats[bucketName].orphanFiles++;
          }
        }
      });

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleRefresh = () => {
    loadStats();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#d4af37]">Médiathèque</h1>
          <p className="text-gray-400">Gérez vos images et médias</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" className="gap-2 border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black border-[#d4af37]/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#d4af37]">Images Produits</CardTitle>
              <ImageIcon className="h-4 w-4 text-[#d4af37]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats['product-images'].totalFiles}</div>
              <p className="text-xs text-gray-400">
                {formatSize(stats['product-images'].totalSize)}
              </p>
              <div className="mt-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Utilisées:</span>
                  <span className="font-medium text-white">{stats['product-images'].usedFiles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-400">Orphelines:</span>
                  <span className="font-medium text-white">{stats['product-images'].orphanFiles}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-[#d4af37]/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#d4af37]">Images Catégories</CardTitle>
              <Database className="h-4 w-4 text-[#d4af37]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats['category-images'].totalFiles}</div>
              <p className="text-xs text-gray-400">
                {formatSize(stats['category-images'].totalSize)}
              </p>
              <div className="mt-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Utilisées:</span>
                  <span className="font-medium text-white">{stats['category-images'].usedFiles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-400">Orphelines:</span>
                  <span className="font-medium text-white">{stats['category-images'].orphanFiles}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-[#d4af37]/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#d4af37]">Stockage Total</CardTitle>
              <HardDrive className="h-4 w-4 text-[#d4af37]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats['product-images'].totalFiles + stats['category-images'].totalFiles}
              </div>
              <p className="text-xs text-gray-400">
                {formatSize(stats['product-images'].totalSize + stats['category-images'].totalSize)}
              </p>
              <div className="mt-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Taux utilisation:</span>
                  <span className="font-medium text-[#d4af37]">
                    {stats['product-images'].totalFiles + stats['category-images'].totalFiles > 0
                      ? Math.round(((stats['product-images'].usedFiles + stats['category-images'].usedFiles) /
                          (stats['product-images'].totalFiles + stats['category-images'].totalFiles)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-black border-[#d4af37]/30">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Bibliothèque de médias</CardTitle>
          <CardDescription className="text-gray-400">Parcourez et gérez vos images par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedBucket} onValueChange={(v) => setSelectedBucket(v as any)}>
            <TabsList className="grid w-full grid-cols-2 bg-black border border-[#d4af37]/30">
              <TabsTrigger value="product-images" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-gray-400">
                Images Produits ({stats['product-images'].totalFiles})
              </TabsTrigger>
              <TabsTrigger value="category-images" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-gray-400">
                Images Catégories ({stats['category-images'].totalFiles})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="product-images" className="mt-4">
              <MediaLibrary
                key={`products-${refreshKey}`}
                bucket="product-images"
                onSelect={(url) => console.log('Selected:', url)}
                onUploadSuccess={() => {
                  loadStats();
                  setRefreshKey(prev => prev + 1);
                }}
              />
            </TabsContent>

            <TabsContent value="category-images" className="mt-4">
              <MediaLibrary
                key={`categories-${refreshKey}`}
                bucket="category-images"
                onSelect={(url) => console.log('Selected:', url)}
                onUploadSuccess={() => {
                  loadStats();
                  setRefreshKey(prev => prev + 1);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
