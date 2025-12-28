'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Loader2, Save, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  cost: number;
  is_relay: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function ShippingMethodsPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<ShippingMethod | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    cost: '',
    is_relay: false,
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadShippingMethods();
  }, []);

  const loadShippingMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      toast.error('Erreur lors du chargement des méthodes de livraison');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (method: ShippingMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description,
      cost: method.cost.toString(),
      is_relay: method.is_relay,
      is_active: method.is_active,
      sort_order: method.sort_order,
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim() || !formData.cost.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost < 0) {
      toast.error('Le prix doit être un nombre positif');
      return;
    }

    try {
      setIsSaving(true);

      const dataToSave = {
        name: formData.name.trim(),
        code: formData.code.trim().toLowerCase().replace(/\s+/g, '_'),
        description: formData.description.trim(),
        cost,
        is_relay: formData.is_relay,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      };

      if (editingMethod) {
        const { error } = await supabase
          .from('shipping_methods')
          .update(dataToSave)
          .eq('id', editingMethod.id);

        if (error) throw error;
        toast.success('Méthode de livraison mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('shipping_methods')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success('Méthode de livraison créée avec succès');
      }

      setShowEditDialog(false);
      setEditingMethod(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        cost: '',
        is_relay: false,
        is_active: true,
        sort_order: 0,
      });
      await loadShippingMethods();

      localStorage.removeItem('checkout_options_cache_v2');
      localStorage.removeItem('checkout_options_cache_time_v2');
    } catch (error: any) {
      console.error('Error saving shipping method:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMethod) return;

    try {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', deletingMethod.id);

      if (error) throw error;

      toast.success('Méthode de livraison supprimée avec succès');
      setShowDeleteDialog(false);
      setDeletingMethod(null);
      await loadShippingMethods();

      localStorage.removeItem('checkout_options_cache_v2');
      localStorage.removeItem('checkout_options_cache_time_v2');
    } catch (error: any) {
      console.error('Error deleting shipping method:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (method: ShippingMethod) => {
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;

      toast.success(method.is_active ? 'Méthode désactivée' : 'Méthode activée');
      await loadShippingMethods();

      localStorage.removeItem('checkout_options_cache_v2');
      localStorage.removeItem('checkout_options_cache_time_v2');
    } catch (error: any) {
      console.error('Error toggling active status:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8 text-[#b8933d]" />
            Méthodes de livraison
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les options et tarifs de livraison
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingMethod(null);
            setFormData({
              name: '',
              code: '',
              description: '',
              cost: '',
              is_relay: false,
              is_active: true,
              sort_order: methods.length,
            });
            setShowEditDialog(true);
          }}
          className="bg-[#b8933d] hover:bg-[#a07c2f]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une méthode
        </Button>
      </div>

      <div className="grid gap-6">
        {methods.map((method) => (
          <Card key={method.id} className={!method.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle>{method.name}</CardTitle>
                    {method.is_relay && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Point relais
                      </span>
                    )}
                    {!method.is_active && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Désactivée
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {method.description || 'Pas de description'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-4">
                    <Label htmlFor={`active-${method.id}`} className="text-sm text-gray-600">
                      {method.is_active ? 'Active' : 'Inactive'}
                    </Label>
                    <Switch
                      id={`active-${method.id}`}
                      checked={method.is_active}
                      onCheckedChange={() => handleToggleActive(method)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(method)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeletingMethod(method);
                      setShowDeleteDialog(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Code: <span className="font-mono">{method.code}</span></p>
                  <p className="text-sm text-gray-600">Ordre d&apos;affichage: {method.sort_order}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#b8933d]">
                    {method.cost.toFixed(2)} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Modifier la méthode de livraison' : 'Nouvelle méthode de livraison'}
            </DialogTitle>
            <DialogDescription>
              Configurez les détails de la méthode de livraison
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mondial Relay"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: mondial_relay"
                  disabled={!!editingMethod}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez la méthode de livraison..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Prix (€) *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordre d&apos;affichage</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="is_relay" className="font-semibold">Livraison en point relais</Label>
                <p className="text-sm text-gray-600">
                  Active le sélecteur de point relais au checkout
                </p>
              </div>
              <Switch
                id="is_relay"
                checked={formData.is_relay}
                onCheckedChange={(checked) => setFormData({ ...formData, is_relay: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="is_active" className="font-semibold">Méthode active</Label>
                <p className="text-sm text-gray-600">
                  Afficher cette méthode sur le site
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingMethod(null);
              }}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#b8933d] hover:bg-[#a07c2f]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette méthode ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deletingMethod?.name}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
