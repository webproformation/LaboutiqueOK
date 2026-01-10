'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Sparkles, Calendar, Users } from 'lucide-react';

interface WheelGame {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  max_plays_per_user: number;
  wheel_design: {
    backgroundColor: string;
    wheelColors: string[];
    centerImage?: string;
  };
  segments: Array<{
    label: string;
    color: string;
    coupon_id: string;
    coupon_code: string;
    probability: number;
  }>;
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
}

export default function WheelPage() {
  const [games, setGames] = useState<WheelGame[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<WheelGame | null>(null);

  const defaultColors = ['#d4af37', '#f5d0a9', '#000000', '#ffc0cb', '#1a1a1a', '#ffffff'];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: false,
    start_date: '',
    end_date: '',
    max_plays_per_user: 1,
    backgroundColor: '#1a1a1a',
    segments: [] as Array<{ label: string; color: string; coupon_id: string; probability: number }>,
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [gamesResult, couponsResult] = await Promise.all([
          supabase
            .from('wheel_games')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('coupons')
            .select('id, code, discount_type, discount_value, is_active')
            .eq('is_active', true)
            .order('code')
        ]);

        if (isMounted) {
          if (gamesResult.error) {
            toast.error('Erreur lors du chargement des jeux');
          } else {
            setGames(gamesResult.data || []);
          }

          if (!couponsResult.error) {
            setCoupons(couponsResult.data || []);
          }

          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading data:', error);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('wheel_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
      toast.error('Erreur lors du chargement des jeux');
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('id, code, discount_type, discount_value, is_active')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.segments.length < 4) {
      toast.error('La roue doit avoir au minimum 4 segments');
      return;
    }

    const totalProbability = formData.segments.reduce((sum, s) => sum + s.probability, 0);
    if (totalProbability !== 100) {
      toast.error('La somme des probabilités doit être égale à 100%');
      return;
    }

    try {
      const gameData = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        max_plays_per_user: formData.max_plays_per_user,
        wheel_design: {
          backgroundColor: formData.backgroundColor,
          wheelColors: formData.segments.map(s => s.color),
        },
        segments: formData.segments.map(s => {
          const coupon = coupons.find(c => c.id === s.coupon_id);
          return {
            label: s.label,
            color: s.color,
            coupon_id: s.coupon_id,
            coupon_code: coupon?.code || '',
            probability: s.probability,
          };
        }),
      };

      if (editingGame) {
        const { error } = await supabase
          .from('wheel_games')
          .update(gameData)
          .eq('id', editingGame.id);

        if (error) throw error;
        toast.success('Jeu mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('wheel_games')
          .insert([gameData]);

        if (error) throw error;
        toast.success('Jeu créé avec succès');
      }

      setDialogOpen(false);
      resetForm();
      loadGames();
    } catch (error) {
      console.error('Error saving game:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (game: WheelGame) => {
    setEditingGame(game);
    setFormData({
      name: game.name,
      description: game.description || '',
      is_active: game.is_active,
      start_date: game.start_date ? game.start_date.split('T')[0] : '',
      end_date: game.end_date ? game.end_date.split('T')[0] : '',
      max_plays_per_user: game.max_plays_per_user,
      backgroundColor: game.wheel_design?.backgroundColor || '#1a1a1a',
      segments: game.segments || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) return;

    try {
      const { error } = await supabase
        .from('wheel_games')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Jeu supprimé avec succès');
      loadGames();
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (game: WheelGame) => {
    try {
      const { error } = await supabase
        .from('wheel_games')
        .update({ is_active: !game.is_active })
        .eq('id', game.id);

      if (error) throw error;
      toast.success(`Jeu ${!game.is_active ? 'activé' : 'désactivé'}`);
      loadGames();
    } catch (error) {
      console.error('Error toggling game:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: false,
      start_date: '',
      end_date: '',
      max_plays_per_user: 1,
      backgroundColor: '#1a1a1a',
      segments: [],
    });
    setEditingGame(null);
  };

  const addSegment = () => {
    if (coupons.length === 0) {
      toast.error('Aucun coupon disponible');
      return;
    }
    if (formData.segments.length >= 12) {
      toast.error('Maximum 12 segments autorisés');
      return;
    }
    const colorIndex = formData.segments.length % defaultColors.length;
    setFormData({
      ...formData,
      segments: [...formData.segments, {
        label: '',
        color: defaultColors[colorIndex],
        coupon_id: coupons[0].id,
        probability: 0,
      }],
    });
  };

  const removeSegment = (index: number) => {
    setFormData({
      ...formData,
      segments: formData.segments.filter((_, i) => i !== index),
    });
  };

  const updateSegment = (index: number, field: string, value: any) => {
    const newSegments = [...formData.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setFormData({ ...formData, segments: newSegments });
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roue de la fortune</h1>
          <p className="text-gray-600 mt-2">Gérez vos jeux de roue de la fortune</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#d4af37] hover:bg-[#b8933d]">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau jeu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGame ? 'Modifier le jeu' : 'Créer un jeu'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du jeu *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_plays">Nombre max de parties par utilisateur</Label>
                <Input
                  id="max_plays"
                  type="number"
                  min="1"
                  value={formData.max_plays_per_user}
                  onChange={(e) => setFormData({ ...formData, max_plays_per_user: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="bg_color">Couleur de fond</Label>
                <Input
                  id="bg_color"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Segments de la roue * (min 4, max 12)</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addSegment}
                    variant="outline"
                    disabled={formData.segments.length >= 12}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter un segment
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.segments.map((segment, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Libellé du segment"
                            value={segment.label}
                            onChange={(e) => updateSegment(index, 'label', e.target.value)}
                          />
                        </div>
                        <Input
                          type="color"
                          value={segment.color}
                          onChange={(e) => updateSegment(index, 'color', e.target.value)}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSegment(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={segment.coupon_id}
                          onValueChange={(value) => updateSegment(index, 'coupon_id', value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Sélectionner un coupon" />
                          </SelectTrigger>
                          <SelectContent>
                            {coupons.map((coupon) => (
                              <SelectItem key={coupon.id} value={coupon.id}>
                                {coupon.code} ({coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value}€`})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={segment.probability}
                            onChange={(e) => updateSegment(index, 'probability', parseFloat(e.target.value))}
                            placeholder="Probabilité %"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.segments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun segment configuré
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Activer le jeu</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-[#d4af37] hover:bg-[#b8933d]">
                  {editingGame ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card key={game.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#d4af37]" />
                    {game.name}
                  </CardTitle>
                  {game.description && (
                    <p className="text-sm text-gray-600 mt-1">{game.description}</p>
                  )}
                </div>
                <Badge variant={game.is_active ? 'default' : 'secondary'}>
                  {game.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                {game.start_date ? new Date(game.start_date).toLocaleDateString() : 'Sans début'} - {game.end_date ? new Date(game.end_date).toLocaleDateString() : 'Sans fin'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Max {game.max_plays_per_user} partie(s) par utilisateur
              </div>
              <div className="text-sm text-gray-600">
                {game.segments?.length || 0} segment(s) configuré(s)
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(game)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant={game.is_active ? 'secondary' : 'default'}
                  onClick={() => toggleActive(game)}
                >
                  {game.is_active ? 'Désactiver' : 'Activer'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(game.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {games.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun jeu configuré</p>
              <p className="text-sm mt-1">Créez votre premier jeu de roue de la fortune</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
