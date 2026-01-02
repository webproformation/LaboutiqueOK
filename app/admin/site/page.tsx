'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, BarChart, Activity, Wrench, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function SiteAdminPage() {
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState({
    is_maintenance_mode: false,
    maintenance_message: '',
    maintenance_start: '',
    maintenance_end: '',
  });

  const loadMaintenanceSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/maintenance');
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setMaintenanceData({
            is_maintenance_mode: result.data.is_maintenance_mode || false,
            maintenance_message: result.data.maintenance_message || '',
            maintenance_start: result.data.maintenance_start ? new Date(result.data.maintenance_start).toISOString().slice(0, 16) : '',
            maintenance_end: result.data.maintenance_end ? new Date(result.data.maintenance_end).toISOString().slice(0, 16) : '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading maintenance settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const saveMaintenanceSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_maintenance_mode: maintenanceData.is_maintenance_mode,
          maintenance_message: maintenanceData.maintenance_message,
          maintenance_start: maintenanceData.maintenance_start || null,
          maintenance_end: maintenanceData.maintenance_end || null,
        }),
      });

      if (response.ok) {
        toast.success('Paramètres de maintenance enregistrés');
        setMaintenanceOpen(false);
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving maintenance settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (maintenanceOpen) {
      loadMaintenanceSettings();
    }
  }, [maintenanceOpen]);

  const sections = [
    {
      title: 'Clients',
      description: 'Gérer les comptes et profils clients',
      icon: Users,
      href: '/admin/customers',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Médiathèque',
      description: 'Gérer les images et médias du site',
      icon: Image,
      href: '/admin/mediatheque',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Sauvegardes',
      description: 'Gérer les sauvegardes de la base de données',
      icon: Database,
      href: '/admin/backups',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Analytics',
      description: 'Consulter les statistiques du site',
      icon: BarChart,
      href: '/admin/analytics',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Diagnostic Système',
      description: 'Tester les connexions WordPress, WooCommerce et Supabase',
      icon: Activity,
      href: '/admin/diagnostic',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion du Site</h1>
        <p className="text-gray-600 mt-2">
          Gérez les paramètres et données globales du site
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
          <DialogTrigger asChild>
            <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-[#b8933d]">
              <CardHeader>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <Wrench className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Mode Maintenance</CardTitle>
                <CardDescription className="text-base">
                  Activer/désactiver le mode maintenance du site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-[#b8933d] font-medium hover:underline">
                  Gérer la maintenance →
                </span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestion du Mode Maintenance</DialogTitle>
            </DialogHeader>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode" className="text-base font-semibold">
                      Activer le mode maintenance
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Les visiteurs verront la page de maintenance (les admins ont toujours accès)
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={maintenanceData.is_maintenance_mode}
                    onCheckedChange={(checked) =>
                      setMaintenanceData({ ...maintenanceData, is_maintenance_mode: checked })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="maintenance-message">Message de maintenance</Label>
                  <Textarea
                    id="maintenance-message"
                    value={maintenanceData.maintenance_message}
                    onChange={(e) =>
                      setMaintenanceData({ ...maintenanceData, maintenance_message: e.target.value })
                    }
                    rows={4}
                    placeholder="Le site est actuellement en maintenance..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce message sera affiché aux visiteurs pendant la maintenance
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maintenance-start">Début (optionnel)</Label>
                    <Input
                      id="maintenance-start"
                      type="datetime-local"
                      value={maintenanceData.maintenance_start}
                      onChange={(e) =>
                        setMaintenanceData({ ...maintenanceData, maintenance_start: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenance-end">Fin (optionnel)</Label>
                    <Input
                      id="maintenance-end"
                      type="datetime-local"
                      value={maintenanceData.maintenance_end}
                      onChange={(e) =>
                        setMaintenanceData({ ...maintenanceData, maintenance_end: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setMaintenanceOpen(false)}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                  <Button onClick={saveMaintenanceSettings} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-[#b8933d]">
              <CardHeader>
                <div className={`w-12 h-12 ${section.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <section.icon className={`w-6 h-6 ${section.color}`} />
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription className="text-base">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-[#b8933d] font-medium hover:underline">
                  Accéder à la gestion →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
