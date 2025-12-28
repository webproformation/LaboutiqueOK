'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Gem, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Diamond {
  id: string;
  name: string;
  page_url: string;
  element_selector: string;
  reward_amount: number;
  week_start_date: string;
  week_end_date: string;
  is_active: boolean;
  created_at: string;
}

export default function HiddenDiamondsPage() {
  const [diamonds, setDiamonds] = useState<Diamond[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDiamond, setEditingDiamond] = useState<Diamond | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    page_url: '',
    element_selector: '',
    reward_amount: '0.10',
    week_start_date: '',
    week_end_date: '',
    is_active: true
  });

  useEffect(() => {
    loadDiamonds();
  }, []);

  const loadDiamonds = async () => {
    try {
      const { data, error } = await supabase
        .from('hidden_diamonds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiamonds(data || []);
    } catch (error) {
      console.error('Error loading diamonds:', error);
      toast.error('Erreur lors du chargement des diamants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDiamond) {
        const { error } = await supabase
          .from('hidden_diamonds')
          .update({
            name: formData.name,
            page_url: formData.page_url,
            element_selector: formData.element_selector,
            reward_amount: parseFloat(formData.reward_amount),
            week_start_date: formData.week_start_date,
            week_end_date: formData.week_end_date,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDiamond.id);

        if (error) throw error;
        toast.success('Diamant modifié avec succès');
      } else {
        const { error } = await supabase
          .from('hidden_diamonds')
          .insert({
            name: formData.name,
            page_url: formData.page_url,
            element_selector: formData.element_selector,
            reward_amount: parseFloat(formData.reward_amount),
            week_start_date: formData.week_start_date,
            week_end_date: formData.week_end_date,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success('Diamant créé avec succès');
      }

      setShowDialog(false);
      setEditingDiamond(null);
      setFormData({
        name: '',
        page_url: '',
        element_selector: '',
        reward_amount: '0.10',
        week_start_date: '',
        week_end_date: '',
        is_active: true
      });
      loadDiamonds();
    } catch (error) {
      console.error('Error saving diamond:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (diamond: Diamond) => {
    setEditingDiamond(diamond);
    setFormData({
      name: diamond.name,
      page_url: diamond.page_url,
      element_selector: diamond.element_selector,
      reward_amount: diamond.reward_amount.toString(),
      week_start_date: diamond.week_start_date,
      week_end_date: diamond.week_end_date,
      is_active: diamond.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce diamant ?')) return;

    try {
      const { error } = await supabase
        .from('hidden_diamonds')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Diamant supprimé');
      loadDiamonds();
    } catch (error) {
      console.error('Error deleting diamond:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (diamond: Diamond) => {
    try {
      const { error } = await supabase
        .from('hidden_diamonds')
        .update({ is_active: !diamond.is_active })
        .eq('id', diamond.id);

      if (error) throw error;
      toast.success(diamond.is_active ? 'Diamant désactivé' : 'Diamant activé');
      loadDiamonds();
    } catch (error) {
      console.error('Error toggling diamond:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gem className="w-8 h-8" />
            Diamants Cachés
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les diamants cachés pour la chasse au trésor hebdomadaire
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDiamond(null);
              setFormData({
                name: '',
                page_url: '',
                element_selector: '',
                reward_amount: '0.10',
                week_start_date: '',
                week_end_date: '',
                is_active: true
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Diamant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDiamond ? 'Modifier le Diamant' : 'Nouveau Diamant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du Diamant</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Diamant Nouvelle Collection"
                />
              </div>

              <div>
                <Label htmlFor="page_url">URL de la Page</Label>
                <Input
                  id="page_url"
                  value={formData.page_url}
                  onChange={(e) => setFormData({ ...formData, page_url: e.target.value })}
                  required
                  placeholder="/category/nouvelle-collection"
                />
              </div>

              <div>
                <Label htmlFor="element_selector">Sélecteur CSS</Label>
                <Input
                  id="element_selector"
                  value={formData.element_selector}
                  onChange={(e) => setFormData({ ...formData, element_selector: e.target.value })}
                  required
                  placeholder="#diamond-spot-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  L'élément où le diamant sera affiché
                </p>
              </div>

              <div>
                <Label htmlFor="reward_amount">Récompense (€)</Label>
                <Input
                  id="reward_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reward_amount}
                  onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="week_start_date">Date de Début</Label>
                  <Input
                    id="week_start_date"
                    type="date"
                    value={formData.week_start_date}
                    onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="week_end_date">Date de Fin</Label>
                  <Input
                    id="week_end_date"
                    type="date"
                    value={formData.week_end_date}
                    onChange={(e) => setFormData({ ...formData, week_end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Actif</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingDiamond ? 'Modifier' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingDiamond(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : diamonds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gem className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Aucun diamant caché pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {diamonds.map((diamond) => (
            <Card key={diamond.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Gem className="w-6 h-6 text-blue-500" />
                    <div>
                      <CardTitle>{diamond.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {diamond.page_url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      diamond.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {diamond.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Récompense</p>
                    <p className="font-semibold">{diamond.reward_amount} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de début</p>
                    <p className="font-semibold">
                      {new Date(diamond.week_start_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de fin</p>
                    <p className="font-semibold">
                      {new Date(diamond.week_end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sélecteur</p>
                    <p className="font-mono text-xs">{diamond.element_selector}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(diamond)}
                  >
                    {diamond.is_active ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(diamond)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(diamond.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}