"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Plus, Trash2, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GameSettings {
  id: string;
  is_enabled: boolean;
  popup_delay_seconds: number;
  win_probability: number;
  max_plays_per_user: number;
  max_plays_per_day: number;
  updated_at: string;
}

interface CouponType {
  id: string;
  code: string;
  type: string;
  value: number;
  description: string;
  valid_until: string;
  is_active: boolean;
}

interface GamePrize {
  id: string;
  coupon_type_id: string;
  weight: number;
  is_active: boolean;
  coupon_types: CouponType;
}

export default function ScratchGameSettingsPage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const [popupDelay, setPopupDelay] = useState(30);
  const [winProbability, setWinProbability] = useState(30);
  const [maxPlays, setMaxPlays] = useState(1);
  const [maxPlaysPerDay, setMaxPlaysPerDay] = useState(0);

  const [prizes, setPrizes] = useState<GamePrize[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<CouponType[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [prizeWeight, setPrizeWeight] = useState(10);
  const [savingPrize, setSavingPrize] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchPrizes();
    fetchAvailableCoupons();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scratch_game_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setIsEnabled(data.is_enabled);
        setPopupDelay(data.popup_delay_seconds);
        setWinProbability(data.win_probability);
        setMaxPlays(data.max_plays_per_user);
        setMaxPlaysPerDay(data.max_plays_per_day || 0);
      } else {
        const { data: newSettings, error: createError } = await supabase
          .from('scratch_game_settings')
          .insert({
            is_enabled: false,
            popup_delay_seconds: 30,
            win_probability: 30,
            max_plays_per_user: 1,
            max_plays_per_day: 1,
          })
          .select()
          .single();

        if (createError) throw createError;

        setSettings(newSettings);
        setIsEnabled(newSettings.is_enabled);
        setPopupDelay(newSettings.popup_delay_seconds);
        setWinProbability(newSettings.win_probability);
        setMaxPlays(newSettings.max_plays_per_user);
        setMaxPlaysPerDay(newSettings.max_plays_per_day || 0);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrizes = async () => {
    setLoadingPrizes(true);
    try {
      const { data, error } = await supabase
        .from('scratch_game_prizes')
        .select('*, coupon_types(*)')
        .order('weight', { ascending: false });

      if (error) throw error;
      setPrizes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching prizes:', error);
      toast.error('Erreur lors du chargement des lots');
      setPrizes([]);
    } finally {
      setLoadingPrizes(false);
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupon_types')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableCoupons(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.error('Erreur lors du chargement des coupons');
      setAvailableCoupons([]);
    }
  };

  const handleAddPrize = async () => {
    if (!selectedCouponId) {
      toast.error('Veuillez sélectionner un coupon');
      return;
    }

    if (prizeWeight <= 0) {
      toast.error('Le poids doit être supérieur à 0');
      return;
    }

    setSavingPrize(true);
    try {
      const { error } = await supabase
        .from('scratch_game_prizes')
        .insert({
          coupon_type_id: selectedCouponId,
          weight: prizeWeight,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Lot ajouté avec succès');
      setIsAddDialogOpen(false);
      setSelectedCouponId('');
      setPrizeWeight(10);
      fetchPrizes();
    } catch (error: any) {
      console.error('Error adding prize:', error);
      if (error.code === '23505') {
        toast.error('Ce coupon est déjà utilisé comme lot');
      } else {
        toast.error('Erreur lors de l\'ajout du lot');
      }
    } finally {
      setSavingPrize(false);
    }
  };

  const handleTogglePrizeActive = async (prizeId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scratch_game_prizes')
        .update({ is_active: !currentActive })
        .eq('id', prizeId);

      if (error) throw error;

      toast.success(currentActive ? 'Lot désactivé' : 'Lot activé');
      fetchPrizes();
    } catch (error: any) {
      console.error('Error toggling prize:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleUpdatePrizeWeight = async (prizeId: string, newWeight: number) => {
    if (newWeight <= 0) {
      toast.error('Le poids doit être supérieur à 0');
      return;
    }

    try {
      const { error } = await supabase
        .from('scratch_game_prizes')
        .update({ weight: newWeight })
        .eq('id', prizeId);

      if (error) throw error;

      toast.success('Poids mis à jour');
      fetchPrizes();
    } catch (error: any) {
      console.error('Error updating weight:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scratch_game_prizes')
        .delete()
        .eq('id', prizeId);

      if (error) throw error;

      toast.success('Lot supprimé');
      fetchPrizes();
    } catch (error: any) {
      console.error('Error deleting prize:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getAvailableCouponsForAdd = () => {
    if (!Array.isArray(prizes) || !Array.isArray(availableCoupons)) {
      return [];
    }
    const usedCouponIds = prizes.map(p => p.coupon_type_id);
    return availableCoupons.filter(c => !usedCouponIds.includes(c.id));
  };

  const getCouponTypeLabel = (coupon: CouponType) => {
    let valueText = '';
    if (coupon.type === 'discount_amount') {
      valueText = `${coupon.value}€`;
    } else if (coupon.type === 'discount_percentage') {
      valueText = `${coupon.value}%`;
    } else if (coupon.type === 'free_delivery') {
      valueText = 'Livraison gratuite';
    }
    return `${coupon.code} - ${valueText} - ${coupon.description}`;
  };

  const handleSave = async () => {
    if (!settings) return;

    if (winProbability < 0 || winProbability > 100) {
      toast.error('La probabilité de gain doit être entre 0 et 100');
      return;
    }

    if (popupDelay < 0) {
      toast.error('Le délai doit être positif');
      return;
    }

    if (maxPlays < 0) {
      toast.error('Le nombre maximum de parties doit être positif ou 0 (illimité)');
      return;
    }

    if (maxPlaysPerDay < 0) {
      toast.error('Le nombre maximum de parties par jour doit être positif ou 0 (pas de limite journalière)');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('scratch_game_settings')
        .update({
          is_enabled: isEnabled,
          popup_delay_seconds: popupDelay,
          win_probability: winProbability,
          max_plays_per_user: maxPlays,
          max_plays_per_day: maxPlaysPerDay,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Paramètres enregistrés avec succès');
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Paramètres du Jeu à Gratter</h1>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Activation du jeu</CardTitle>
            <CardDescription>
              Activez ou désactivez l'affichage du popup de jeu sur la page d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                id="game-enabled"
              />
              <Label htmlFor="game-enabled" className="cursor-pointer">
                {isEnabled ? 'Jeu activé' : 'Jeu désactivé'}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Délai d'affichage</CardTitle>
            <CardDescription>
              Temps en secondes avant l'affichage du popup après l'arrivée sur la page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="popup-delay">Délai (secondes)</Label>
              <Input
                id="popup-delay"
                type="number"
                min="0"
                value={popupDelay}
                onChange={(e) => setPopupDelay(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">
                Délai actuel: {popupDelay} seconde{popupDelay > 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Probabilité de gain</CardTitle>
            <CardDescription>
              Pourcentage de chance qu'un joueur gagne un coupon (0-100%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="win-probability">Probabilité (%)</Label>
              <Input
                id="win-probability"
                type="number"
                min="0"
                max="100"
                value={winProbability}
                onChange={(e) => setWinProbability(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">
                Probabilité actuelle: {winProbability}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nombre maximum de parties (total)</CardTitle>
            <CardDescription>
              Nombre total de fois qu'un utilisateur peut jouer (0 = illimité)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="max-plays">Parties maximum (total)</Label>
              <Input
                id="max-plays"
                type="number"
                min="0"
                value={maxPlays}
                onChange={(e) => setMaxPlays(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">
                {maxPlays === 0
                  ? 'Parties illimitées'
                  : `Maximum: ${maxPlays} partie${maxPlays > 1 ? 's' : ''} au total par utilisateur`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nombre maximum de parties par jour</CardTitle>
            <CardDescription>
              Nombre de fois qu'un utilisateur peut jouer par jour (0 = pas de limite journalière)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="max-plays-per-day">Parties maximum par jour</Label>
              <Input
                id="max-plays-per-day"
                type="number"
                min="0"
                value={maxPlaysPerDay}
                onChange={(e) => setMaxPlaysPerDay(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">
                {maxPlaysPerDay === 0
                  ? 'Pas de limite journalière (utilise la limite totale)'
                  : `Maximum: ${maxPlaysPerDay} partie${maxPlaysPerDay > 1 ? 's' : ''} par jour`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les paramètres
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#b8933d]" />
                  Lots à gagner
                </CardTitle>
                <CardDescription>
                  Gérez les coupons qui peuvent être gagnés dans le jeu
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="outline"
                disabled={getAvailableCouponsForAdd().length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un lot
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPrizes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#b8933d]" />
              </div>
            ) : !Array.isArray(prizes) || prizes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun lot configuré</p>
                <p className="text-sm mt-1">Ajoutez des coupons que les joueurs peuvent gagner</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Coupon</TableHead>
                      <TableHead>Valeur</TableHead>
                      <TableHead>Poids</TableHead>
                      <TableHead>Probabilité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prizes.map((prize) => {
                      const activePrizes = Array.isArray(prizes) ? prizes.filter(p => p.is_active) : [];
                      const totalWeight = activePrizes.reduce((sum, p) => sum + p.weight, 0);
                      const probability = totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : '0';

                      return (
                        <TableRow key={prize.id}>
                          <TableCell className="font-medium">
                            {prize.coupon_types.code}
                          </TableCell>
                          <TableCell>
                            {prize.coupon_types.type === 'discount_amount' && `${prize.coupon_types.value}€`}
                            {prize.coupon_types.type === 'discount_percentage' && `${prize.coupon_types.value}%`}
                            {prize.coupon_types.type === 'free_delivery' && 'Livraison gratuite'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={prize.weight}
                              onChange={(e) => {
                                const newWeight = parseInt(e.target.value) || 1;
                                if (newWeight !== prize.weight) {
                                  handleUpdatePrizeWeight(prize.id, newWeight);
                                }
                              }}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            {prize.is_active ? `${probability}%` : '—'}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={prize.is_active}
                              onCheckedChange={() => handleTogglePrizeActive(prize.id, prize.is_active)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePrize(prize.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Comment ça marche :</strong> Le poids détermine la probabilité relative de gagner chaque lot.
                    Par exemple, un lot avec un poids de 20 a deux fois plus de chances d'être gagné qu'un lot avec un poids de 10.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {settings && (
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">
                Dernière modification: {new Date(settings.updated_at).toLocaleString('fr-FR')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un lot</DialogTitle>
            <DialogDescription>
              Sélectionnez un coupon à ajouter comme lot gagnant dans le jeu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Coupon</Label>
              <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un coupon" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCouponsForAdd().map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      {getCouponTypeLabel(coupon)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prize-weight">Poids (probabilité relative)</Label>
              <Input
                id="prize-weight"
                type="number"
                min="1"
                value={prizeWeight}
                onChange={(e) => setPrizeWeight(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Plus le poids est élevé, plus le lot a de chances d'être gagné
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setSelectedCouponId('');
                  setPrizeWeight(10);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleAddPrize} disabled={savingPrize}>
                {savingPrize ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
