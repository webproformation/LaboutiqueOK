'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Gift } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CouponType {
  id: string;
  code: string;
  description: string;
  type: string;
  value: number;
}

interface WinningZone {
  coupon_type_id: string;
  probability: number;
}

interface LosingZone {
  message: string;
  probability: number;
}

export default function WheelGameSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [requireNewsletter, setRequireNewsletter] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);
  const [popupDelaySeconds, setPopupDelaySeconds] = useState(5);
  const [maxPlaysPerDay, setMaxPlaysPerDay] = useState(1);
  const [maxPlaysPerUser, setMaxPlaysPerUser] = useState(0);
  const [winningZones, setWinningZones] = useState<WinningZone[]>([]);
  const [losingZones, setLosingZones] = useState<LosingZone[]>([
    { message: 'Dommage ! Retentez votre chance demain', probability: 20 }
  ]);
  const [couponTypes, setCouponTypes] = useState<CouponType[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, couponsRes] = await Promise.all([
        supabase.from('wheel_game_settings').select('*').maybeSingle(),
        supabase.from('coupon_types').select('*').eq('is_active', true)
      ]);

      if (couponsRes.data) {
        setCouponTypes(couponsRes.data);
      }

      if (settingsRes.data) {
        setSettingsId(settingsRes.data.id);
        setIsEnabled(settingsRes.data.is_enabled);
        setRequireNewsletter(settingsRes.data.require_newsletter);
        setRequireAuth(settingsRes.data.require_authentication);
        setPopupDelaySeconds(settingsRes.data.popup_delay_seconds || 5);
        setMaxPlaysPerDay(settingsRes.data.max_plays_per_day);
        setMaxPlaysPerUser(settingsRes.data.max_plays_per_user || 0);
        setWinningZones(settingsRes.data.winning_zones || []);
        setLosingZones(settingsRes.data.losing_zones || []);
      } else {
        const { data: newSettings, error: createError } = await supabase
          .from('wheel_game_settings')
          .insert({
            is_enabled: false,
            require_newsletter: true,
            require_authentication: false,
            popup_delay_seconds: 5,
            max_plays_per_day: 1,
            max_plays_per_user: 0,
            winning_zones: [],
            losing_zones: [{ message: 'Dommage ! Retentez votre chance demain', probability: 20 }]
          })
          .select()
          .single();

        if (createError) throw createError;

        if (newSettings) {
          setSettingsId(newSettings.id);
          setIsEnabled(newSettings.is_enabled);
          setRequireNewsletter(newSettings.require_newsletter);
          setRequireAuth(newSettings.require_authentication);
          setPopupDelaySeconds(newSettings.popup_delay_seconds || 5);
          setMaxPlaysPerDay(newSettings.max_plays_per_day);
          setMaxPlaysPerUser(newSettings.max_plays_per_user || 0);
          setWinningZones(newSettings.winning_zones || []);
          setLosingZones(newSettings.losing_zones || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const addWinningZone = () => {
    if (winningZones.length >= 10) {
      toast.error('Maximum 10 zones gagnantes');
      return;
    }
    if (couponTypes.length === 0) {
      toast.error('Aucun coupon disponible');
      return;
    }
    setWinningZones([...winningZones, { coupon_type_id: couponTypes[0].id, probability: 5 }]);
  };

  const removeWinningZone = (index: number) => {
    setWinningZones(winningZones.filter((_, i) => i !== index));
  };

  const updateWinningZone = (index: number, field: keyof WinningZone, value: any) => {
    const updated = [...winningZones];
    updated[index] = { ...updated[index], [field]: value };
    setWinningZones(updated);
  };

  const addLosingZone = () => {
    if (losingZones.length >= 10) {
      toast.error('Maximum 10 zones perdantes');
      return;
    }
    setLosingZones([...losingZones, { message: 'Perdu !', probability: 10 }]);
  };

  const removeLosingZone = (index: number) => {
    setLosingZones(losingZones.filter((_, i) => i !== index));
  };

  const updateLosingZone = (index: number, field: keyof LosingZone, value: any) => {
    const updated = [...losingZones];
    updated[index] = { ...updated[index], [field]: value };
    setLosingZones(updated);
  };

  const calculateTotalProbability = () => {
    const winTotal = winningZones.reduce((sum, zone) => sum + (zone.probability || 0), 0);
    const loseTotal = losingZones.reduce((sum, zone) => sum + (zone.probability || 0), 0);
    return winTotal + loseTotal;
  };

  const saveSettings = async () => {
    const totalProb = calculateTotalProbability();
    if (totalProb !== 100) {
      toast.error(`La somme des probabilités doit être 100% (actuellement ${totalProb}%)`);
      return;
    }

    if (winningZones.length === 0 && losingZones.length === 0) {
      toast.error('Vous devez configurer au moins une zone');
      return;
    }

    setSaving(true);
    try {
      const settingsData = {
        is_enabled: isEnabled,
        require_newsletter: requireNewsletter,
        require_authentication: requireAuth,
        popup_delay_seconds: popupDelaySeconds,
        max_plays_per_day: maxPlaysPerDay,
        max_plays_per_user: maxPlaysPerUser,
        winning_zones: winningZones,
        losing_zones: losingZones
      };

      if (settingsId) {
        const { error } = await supabase
          .from('wheel_game_settings')
          .update(settingsData)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('wheel_game_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  const totalProb = calculateTotalProbability();
  const probColor = totalProb === 100 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Configuration Roue de la Fortune
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurez les zones gagnantes et perdantes de la roue
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres Généraux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer le jeu de la roue</Label>
              <p className="text-sm text-muted-foreground">
                Le jeu sera visible sur la page d&apos;accueil
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Inscription newsletter obligatoire</Label>
              <p className="text-sm text-muted-foreground">
                L&apos;utilisateur doit s&apos;inscrire à la newsletter pour jouer
              </p>
            </div>
            <Switch checked={requireNewsletter} onCheckedChange={setRequireNewsletter} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Connexion obligatoire</Label>
              <p className="text-sm text-muted-foreground">
                L&apos;utilisateur doit être connecté pour jouer
              </p>
            </div>
            <Switch checked={requireAuth} onCheckedChange={setRequireAuth} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="popupDelay">Délai avant affichage du popup (secondes)</Label>
            <Input
              id="popupDelay"
              type="number"
              min="0"
              value={popupDelaySeconds}
              onChange={(e) => setPopupDelaySeconds(parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              Nombre de secondes avant l&apos;apparition du popup
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="maxPlaysPerUser">Nombre maximum de parties par utilisateur</Label>
            <Input
              id="maxPlaysPerUser"
              type="number"
              min="0"
              value={maxPlaysPerUser}
              onChange={(e) => setMaxPlaysPerUser(parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              0 = illimité (total de parties pour l&apos;utilisateur)
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="maxPlays">Nombre maximum de parties par jour</Label>
            <Input
              id="maxPlays"
              type="number"
              min="0"
              value={maxPlaysPerDay}
              onChange={(e) => setMaxPlaysPerDay(parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              0 = illimité (par jour)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Zones Gagnantes</CardTitle>
              <CardDescription>Maximum 10 zones</CardDescription>
            </div>
            <Button onClick={addWinningZone} disabled={winningZones.length >= 10}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une zone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {winningZones.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune zone gagnante configurée
            </p>
          ) : (
            winningZones.map((zone, index) => (
              <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>Coupon</Label>
                  <Select
                    value={zone.coupon_type_id}
                    onValueChange={(value) => updateWinningZone(index, 'coupon_type_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {couponTypes.map((coupon) => (
                        <SelectItem key={coupon.id} value={coupon.id}>
                          {coupon.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <Label>Probabilité (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={zone.probability}
                    onChange={(e) =>
                      updateWinningZone(index, 'probability', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeWinningZone(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Zones Perdantes</CardTitle>
              <CardDescription>Maximum 10 zones</CardDescription>
            </div>
            <Button onClick={addLosingZone} disabled={losingZones.length >= 10}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une zone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {losingZones.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune zone perdante configurée
            </p>
          ) : (
            losingZones.map((zone, index) => (
              <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>Message</Label>
                  <Input
                    value={zone.message}
                    onChange={(e) => updateLosingZone(index, 'message', e.target.value)}
                    placeholder="Message affiché quand l'utilisateur perd"
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label>Probabilité (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={zone.probability}
                    onChange={(e) =>
                      updateLosingZone(index, 'probability', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeLosingZone(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total des probabilités :</span>
              <span className={probColor}>{totalProb}%</span>
            </div>
            {totalProb !== 100 && (
              <p className="text-sm text-red-600">
                ⚠️ La somme des probabilités doit être égale à 100%
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}