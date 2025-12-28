"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Trash2, RefreshCw, Database, Image, HardDrive, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { useAdmin } from '@/hooks/use-admin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Backup {
  id: string;
  backup_type: 'database' | 'media' | 'full';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_path: string | null;
  file_size: number;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export default function BackupsPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupType, setBackupType] = useState<'database' | 'media' | 'full'>('database');
  const [description, setDescription] = useState('');
  const [clearExisting, setClearExisting] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, adminLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadBackups();
    }
  }, [isAdmin]);

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBackups(data || []);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Erreur lors du chargement des sauvegardes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace('/graphql', '');

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupType,
          description: description || null,
          wpUrl: wpUrl || null,
          wpUsername: null,
          wpPassword: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la sauvegarde');
      }

      const result = await response.json();

      toast.success('Sauvegarde créée avec succès');
      setCreateDialogOpen(false);
      setDescription('');
      loadBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de la sauvegarde');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (backup: Backup) => {
    if (!backup.file_path) {
      toast.error('Aucun fichier disponible pour cette sauvegarde');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .download(backup.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.file_path;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Erreur lors du téléchargement de la sauvegarde');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/restore-backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupId: selectedBackup.id,
          clearExisting,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la restauration');
      }

      const result = await response.json();

      toast.success('Sauvegarde restaurée avec succès');
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
      setClearExisting(false);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la restauration');
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupId: selectedBackup.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      toast.success('Sauvegarde supprimée avec succès');
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
      loadBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getNextAutomatedBackup = () => {
    const now = new Date();
    const next = new Date();
    next.setUTCHours(3, 0, 0, 0);

    if (now.getUTCHours() >= 3) {
      next.setUTCDate(next.getUTCDate() + 1);
    }

    return next;
  };

  const getLastAutomatedBackup = () => {
    return backups.find(b =>
      b.description?.toLowerCase().includes('automatique') &&
      b.status === 'completed'
    );
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'media':
        return <Image className="w-4 h-4" />;
      case 'full':
        return <HardDrive className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Complété</Badge>;
      case 'processing':
        return <Badge className="bg-blue-600">En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion des sauvegardes</h1>
        <p className="text-gray-600">
          Créez, restaurez et gérez les sauvegardes de votre application
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Les sauvegardes incluent toutes les données de la base de données. Les sauvegardes complètes incluent également la liste des médias WordPress.
          La restauration remplacera ou fusionnera les données existantes.
        </AlertDescription>
      </Alert>

      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Sauvegardes automatiques
          </CardTitle>
          <CardDescription>
            Les sauvegardes automatiques sont programmées tous les jours à 3h00 (UTC)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-700 mb-1">Prochaine sauvegarde</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatDate(getNextAutomatedBackup().toISOString())}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-700 mb-1">Dernière sauvegarde automatique</p>
                {getLastAutomatedBackup() ? (
                  <p className="text-lg font-semibold text-green-600">
                    {formatDate(getLastAutomatedBackup()!.created_at)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Aucune encore effectuée</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Rétention :</strong> Les sauvegardes automatiques de plus de 7 jours sont automatiquement supprimées pour économiser l'espace de stockage.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Nouvelle sauvegarde</CardTitle>
          <CardDescription>
            Créer une sauvegarde de vos données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setCreateDialogOpen(true)}>
            Créer une sauvegarde
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sauvegardes existantes</CardTitle>
          <CardDescription>
            Liste de toutes les sauvegardes disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucune sauvegarde disponible
            </p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getBackupTypeIcon(backup.backup_type)}
                        <span className="capitalize">{backup.backup_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>{backup.description || '-'}</TableCell>
                    <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                    <TableCell>{formatDate(backup.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadBackup(backup)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setRestoreDialogOpen(true);
                              }}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une sauvegarde</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de sauvegarde à créer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de sauvegarde</Label>
              <Select value={backupType} onValueChange={(value: any) => setBackupType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">Base de données uniquement</SelectItem>
                  <SelectItem value="media">Médias uniquement</SelectItem>
                  <SelectItem value="full">Sauvegarde complète</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Input
                placeholder="Ex: Sauvegarde avant mise à jour..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateBackup} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer la sauvegarde</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Cette action fusionnera ou remplacera les données existantes.
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Supprimer les données existantes avant restauration</span>
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedBackup(null);
              setClearExisting(false);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreBackup}>
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la sauvegarde</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette sauvegarde ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBackup(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBackup}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
