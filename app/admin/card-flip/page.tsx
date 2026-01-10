'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Edit, Trash2, Eye, PlayCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
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
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
}

export default function CardFlipAdminPage() {
  const [games, setGames] = useState<CardFlipGameData[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewGameId, setPreviewGameId] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<CardFlipGameData | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coupon_id: '',
    is_active: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    max_plays_per_user: 1,
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data: gamesData, error: gamesError } = await supabase
        .from('card_flip_games')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('id, code, discount_type, discount_value')
        .eq('is_active', true)
        .order('code');

      if (isMounted) {
        if (gamesError) {
          toast.error('Erreur lors du chargement des jeux');
        } else {
          setGames(gamesData || []);
        }

        if (!couponsError && couponsData) {
          setCoupons(couponsData);
        }

        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadGames = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('card_flip_games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erreur lors du chargement des jeux');
    } else {
      setGames(data || []);
    }

    setLoading(false);
  };

  const loadCoupons = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('coupons')
      .select('id, code, discount_type, discount_value')
      .eq('is_active', true)
      .order('code');

    if (!error && data) {
      setCoupons(data);
    }
  };

  const handleOpenDialog = (game?: CardFlipGameData) => {
    if (game) {
      setEditingGame(game);
      setFormData({
        name: game.name,
        description: game.description || '',
        coupon_id: game.coupon_id || '',
        is_active: game.is_active,
        start_date: game.start_date.split('T')[0],
        end_date: game.end_date ? game.end_date.split('T')[0] : '',
        max_plays_per_user: game.max_plays_per_user,
      });
    } else {
      setEditingGame(null);
      setFormData({
        name: '',
        description: '',
        coupon_id: '',
        is_active: false,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        max_plays_per_user: 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    if (!formData.coupon_id) {
      toast.error('Veuillez sélectionner un coupon');
      return;
    }

    const supabase = createClient();

    const gameData = {
      name: formData.name.trim() || null,
      description: formData.description.trim() || null,
      coupon_id: formData.coupon_id || null,
      is_active: formData.is_active,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      max_plays_per_user: formData.max_plays_per_user || 1,
    };

    if (editingGame) {
      const { error } = await supabase
        .from('card_flip_games')
        .update(gameData)
        .eq('id', editingGame.id);

      if (error) {
        console.error('Erreur de modification:', error);
        toast.error(`Erreur lors de la modification: ${error.message}`);
        return;
      }

      toast.success('Jeu modifié avec succès');
    } else {
      const { data, error } = await supabase.from('card_flip_games').insert(gameData).select();

      if (error) {
        console.error('Erreur de création:', error);
        toast.error(`Erreur lors de la création: ${error.message}`);
        return;
      }

      toast.success('Jeu créé avec succès');
    }

    setIsDialogOpen(false);
    loadGames();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) return;

    const supabase = createClient();

    const { error } = await supabase.from('card_flip_games').delete().eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
      return;
    }

    toast.success('Jeu supprimé avec succès');
    loadGames();
  };

  const handleToggleActive = async (game: CardFlipGameData) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('card_flip_games')
      .update({ is_active: !game.is_active })
      .eq('id', game.id);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
      return;
    }

    toast.success(game.is_active ? 'Jeu désactivé' : 'Jeu activé');
    loadGames();
  };

  const handlePreview = (gameId: string) => {
    setPreviewGameId(gameId);
    setIsPreviewOpen(true);
  };

  const getCouponLabel = (couponId: string) => {
    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon) return 'Aucun';
    if (coupon.discount_type === 'percentage') {
      return `${coupon.code} (-${coupon.discount_value}%)`;
    }
    return `${coupon.code} (-${(Number(coupon.discount_value) || 0).toFixed(2)}€)`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jeux de Cartes à Retourner</h1>
          <p className="text-gray-600 mt-2">
            Gérez les jeux de cartes où les utilisateurs peuvent gagner des coupons
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau jeu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des jeux</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun jeu créé pour le moment
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Coupon</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Parties max</TableHead>
                    <TableHead>Gagnants</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.name}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {getCouponLabel(game.coupon_id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={game.is_active ? 'default' : 'secondary'}
                          className={
                            game.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {game.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(game.start_date).toLocaleDateString('fr-FR')}
                        {game.end_date && ` - ${new Date(game.end_date).toLocaleDateString('fr-FR')}`}
                      </TableCell>
                      <TableCell>{game.max_plays_per_user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{game.total_winners || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(game.id)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(game)}
                            className="hover:bg-green-50 hover:text-green-600"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(game)}
                            className="hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(game.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGame ? 'Modifier le jeu' : 'Créer un nouveau jeu'}
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres du jeu de cartes à retourner
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom du jeu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Tentez votre chance !"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du jeu..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon_id">
                Coupon à gagner <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.coupon_id}
                onValueChange={(value) => setFormData({ ...formData, coupon_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un coupon" />
                </SelectTrigger>
                <SelectContent>
                  {coupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      {coupon.code} (
                      {coupon.discount_type === 'percentage'
                        ? `-${coupon.discount_value}%`
                        : `-${(Number(coupon.discount_value) || 0).toFixed(2)}€`}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin (optionnelle)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_plays_per_user">
                Nombre maximum de parties par utilisateur
              </Label>
              <Input
                id="max_plays_per_user"
                type="number"
                min="1"
                value={formData.max_plays_per_user}
                onChange={(e) =>
                  setFormData({ ...formData, max_plays_per_user: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="is_active" className="cursor-pointer">
                  Jeu actif
                </Label>
                <p className="text-sm text-gray-500">
                  Le jeu sera visible et jouable par les utilisateurs
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d]"
              >
                {editingGame ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isPreviewOpen && previewGameId && (
        <CardFlipGame gameId={previewGameId} onClose={() => setIsPreviewOpen(false)} />
      )}
    </div>
  );
}
