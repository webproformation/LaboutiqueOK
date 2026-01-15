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
import { Plus, Edit, Trash2, Sparkles, Calendar, Users, Eye, Percent } from 'lucide-react';
import { CardFlipGame } from '@/components/CardFlipGame';

interface CardFlipGameData {
  id: string;
  name: string;
  description: string;
  coupon_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  max_plays_per_user: number;
  total_winners: number;
  win_probability: number;
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
}

export default function CardFlipAdminPage() {
  const [games, setGames] = useState<CardFlipGameData[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<CardFlipGameData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewGameId, setPreviewGameId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coupon_id: '',
    is_active: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    max_plays_per_user: 1,
    win_probability: 33.33,
  });

  useEffect(() => {
    loadGames();
    loadCoupons();
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('card_flip_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des jeux');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('id, code, name, discount_type, discount_value, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des coupons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGame) {
        const { error } = await supabase
          .from('card_flip_games')
          .update(formData)
          .eq('id', editingGame.id);

        if (error) throw error;
        toast.success('Jeu modifié avec succès');
      } else {
        const { error } = await supabase
          .from('card_flip_games')
          .insert([formData]);

        if (error) throw error;
        toast.success('Jeu créé avec succès');
      }

      setDialogOpen(false);
      resetForm();
      loadGames();
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
  };

  const handleEdit = (game: CardFlipGameData) => {
    setEditingGame(game);
    setFormData({
      name: game.name,
      description: game.description || '',
      coupon_id: game.coupon_id,
      is_active: game.is_active,
      start_date: game.start_date.split('T')[0],
      end_date: game.end_date ? game.end_date.split('T')[0] : '',
      max_plays_per_user: game.max_plays_per_user,
      win_probability: game.win_probability || 33.33,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) return;

    try {
      const { error } = await supabase
        .from('card_flip_games')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Jeu supprimé avec succès');
      loadGames();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      coupon_id: '',
      is_active: false,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      max_plays_per_user: 1,
      win_probability: 33.33,
    });
    setEditingGame(null);
  };

  const getCouponInfo = (coupon_id: string) => {
    const coupon = coupons.find(c => c.id === coupon_id);
    if (!coupon) return { name: 'Coupon supprimé', badge: 'gray' };

    const value = coupon.discount_type === 'percentage'
      ? `-${coupon.discount_value}%`
      : `-${Number(coupon.discount_value).toFixed(2)}€`;

    return { name: `${coupon.name} (${value})`, badge: 'green' };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Gestion Card Flip Game</h1>
          <p className="text-gray-600 mt-1">Créez et gérez vos jeux de cartes à retourner avec probabilités personnalisables</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-[#D4AF37] hover:bg-[#B8933D]">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Jeu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGame ? 'Modifier le jeu' : 'Créer un nouveau jeu'}
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
                  placeholder="Ex: Gagnez jusqu'à -30%"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du jeu..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="coupon">Coupon à gagner *</Label>
                <Select
                  value={formData.coupon_id}
                  onValueChange={(value) => setFormData({ ...formData, coupon_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un coupon" />
                  </SelectTrigger>
                  <SelectContent>
                    {coupons.map((coupon) => (
                      <SelectItem key={coupon.id} value={coupon.id}>
                        {coupon.name} - {coupon.discount_type === 'percentage'
                          ? `-${coupon.discount_value}%`
                          : `-${Number(coupon.discount_value).toFixed(2)}€`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_plays">Parties max par utilisateur *</Label>
                  <Input
                    id="max_plays"
                    type="number"
                    min="1"
                    value={formData.max_plays_per_user}
                    onChange={(e) => setFormData({ ...formData, max_plays_per_user: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="win_probability" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Probabilité de gain (%) *
                  </Label>
                  <Input
                    id="win_probability"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.win_probability}
                    onChange={(e) => setFormData({ ...formData, win_probability: parseFloat(e.target.value) })}
                    required
                    placeholder="33.33"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    33.33% = 1 chance sur 3 | 50% = 1 chance sur 2
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="text-base font-medium">Jeu actif</Label>
                  <p className="text-sm text-gray-500">Le jeu sera visible et jouable par les utilisateurs</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-[#D4AF37] hover:bg-[#B8933D]">
                  {editingGame ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {games.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun jeu créé pour le moment</p>
            <p className="text-sm text-gray-500 mt-2">Cliquez sur "Nouveau Jeu" pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => {
            const couponInfo = getCouponInfo(game.coupon_id);
            return (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{game.name}</CardTitle>
                        {game.is_active ? (
                          <Badge className="bg-green-500">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </div>
                      {game.description && (
                        <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                          <span className="font-medium">Coupon:</span>
                          <Badge variant="outline" className={`bg-${couponInfo.badge}-50`}>
                            {couponInfo.name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-[#D4AF37]" />
                          <span className="font-medium">Probabilité:</span>
                          <Badge className="bg-blue-500">{game.win_probability}%</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#D4AF37]" />
                          <span className="font-medium">Max parties:</span>
                          <span>{game.max_plays_per_user}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#D4AF37]" />
                          <span className="font-medium">Du:</span>
                          <span>{new Date(game.start_date).toLocaleDateString('fr-FR')}</span>
                          {game.end_date && (
                            <>
                              <span>au</span>
                              <span>{new Date(game.end_date).toLocaleDateString('fr-FR')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPreviewGameId(game.id);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(game)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(game.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {isPreviewOpen && previewGameId && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Aperçu du jeu</DialogTitle>
            </DialogHeader>
            <CardFlipGame gameId={previewGameId} onClose={() => setIsPreviewOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
