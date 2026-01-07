'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Percent,
  Euro,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  Gift,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_purchase: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Erreur lors du chargement des coupons', { position: 'bottom-right' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.discount_value) {
      toast.error('Le code et la valeur de réduction sont requis', { position: 'bottom-right' });
      return;
    }

    const discountValue = parseFloat(formData.discount_value);
    const minPurchase = formData.min_purchase ? parseFloat(formData.min_purchase) : 0;
    const maxUses = formData.max_uses ? parseInt(formData.max_uses) : null;

    if (isNaN(discountValue) || discountValue <= 0) {
      toast.error('La valeur de réduction doit être un nombre valide supérieur à 0', { position: 'bottom-right' });
      return;
    }

    if (formData.discount_type === 'percentage' && discountValue > 100) {
      toast.error('Le pourcentage ne peut pas dépasser 100%', { position: 'bottom-right' });
      return;
    }

    if (formData.min_purchase && isNaN(minPurchase)) {
      toast.error('Le montant minimum d\'achat doit être un nombre valide', { position: 'bottom-right' });
      return;
    }

    if (formData.max_uses && (maxUses === null || isNaN(maxUses))) {
      toast.error('Le nombre maximum d\'utilisations doit être un nombre valide', { position: 'bottom-right' });
      return;
    }

    try {
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: discountValue,
        min_purchase: minPurchase,
        max_uses: maxUses,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        const { data, error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id)
          .select()
          .single();

        if (error) throw error;
        toast.success('Coupon modifié avec succès', { position: 'bottom-right' });
      } else {
        const { data, error } = await supabase
          .from('coupons')
          .insert([couponData])
          .select()
          .single();

        if (error) throw error;
        toast.success('Coupon créé avec succès', { position: 'bottom-right' });
      }

      resetForm();
      loadCoupons();
    } catch (error: any) {
      console.error('=== COUPON SAVE ERROR ===');
      console.error('Error Object:', JSON.stringify(error, null, 2));
      console.error('Error Message:', error?.message);
      console.error('Error Code:', error?.code);
      console.error('Error Details:', error?.details);
      console.error('Error Hint:', error?.hint);
      console.error('========================');

      if (error.code === '23505') {
        toast.error('Ce code promo existe déjà', { position: 'bottom-right' });
      } else {
        const errorMessage = error?.message || error?.details || 'Erreur inconnue';
        toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`, { position: 'bottom-right', duration: 8000 });
      }
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase: coupon.min_purchase?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      valid_from: coupon.valid_from ? format(new Date(coupon.valid_from), 'yyyy-MM-dd') : '',
      valid_until: coupon.valid_until ? format(new Date(coupon.valid_until), 'yyyy-MM-dd') : '',
      is_active: coupon.is_active,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string, code: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(`Coupon "${code}" supprimé`, { position: 'bottom-right' });
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Erreur lors de la suppression', { position: 'bottom-right' });
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      toast.success(coupon.is_active ? 'Coupon désactivé' : 'Coupon activé', { position: 'bottom-right' });
      loadCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('Erreur lors de la modification', { position: 'bottom-right' });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
    });
    setEditingCoupon(null);
    setIsCreateDialogOpen(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copié !', { position: 'bottom-right' });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isUpcoming = (coupon: Coupon) => {
    if (!coupon.valid_from) return false;
    return new Date(coupon.valid_from) > new Date();
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'active') return matchesSearch && coupon.is_active && !isExpired(coupon);
    if (activeTab === 'inactive') return matchesSearch && (!coupon.is_active || isExpired(coupon));

    return matchesSearch;
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.is_active && !isExpired(c)).length,
    expired: coupons.filter(c => isExpired(c)).length,
    totalUses: coupons.reduce((sum, c) => sum + c.uses_count, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons de Réduction</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos codes promo et offres spéciales
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d] hover:from-[#b8933d] hover:to-[#a88230] text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Modifier le coupon' : 'Créer un nouveau coupon'}
              </DialogTitle>
              <DialogDescription>
                Configurez les paramètres de votre code promo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="code">Code Promo *</Label>
                  <Input
                    id="code"
                    placeholder="PROMO2024"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="uppercase"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="discount_type">Type de réduction *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discount_value">
                    Valeur *
                    {formData.discount_type === 'percentage' ? ' (%)' : ' (€)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    placeholder={formData.discount_type === 'percentage' ? '20' : '10'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="min_purchase">Achat minimum (€)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="max_uses">Utilisations maximum</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    placeholder="Illimité"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="valid_from">Date de début</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="valid_until">Date de fin</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Activer ce coupon immédiatement</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-[#C6A15B] hover:bg-[#b8933d]">
                  {editingCoupon ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.total}</div>
              <Gift className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Expirés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
              <Calendar className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Utilisations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">{stats.totalUses}</div>
              <BarChart3 className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un code promo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="all">Tous ({coupons.length})</TabsTrigger>
                <TabsTrigger value="active">Actifs ({stats.active})</TabsTrigger>
                <TabsTrigger value="inactive">Inactifs ({coupons.length - stats.active})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Aucun coupon trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Essayez de modifier votre recherche' : 'Créez votre premier coupon'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Réduction</TableHead>
                    <TableHead className="font-semibold">Conditions</TableHead>
                    <TableHead className="font-semibold">Validité</TableHead>
                    <TableHead className="font-semibold">Utilisations</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-gradient-to-r from-[#C6A15B] to-[#b8933d] text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <Percent className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-blue-600">
                                {coupon.discount_value}%
                              </span>
                            </>
                          ) : (
                            <>
                              <Euro className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                {(coupon.discount_value || 0).toFixed(2)}€
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.min_purchase > 0 && (
                          <div className="text-sm text-gray-600">
                            Min. {(coupon.min_purchase || 0).toFixed(2)}€
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {coupon.valid_from && (
                            <div className="text-gray-600">
                              Du {format(new Date(coupon.valid_from), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          )}
                          {coupon.valid_until && (
                            <div className={isExpired(coupon) ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              Au {format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          )}
                          {!coupon.valid_from && !coupon.valid_until && (
                            <span className="text-gray-400">Toujours valide</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{coupon.uses_count}</span>
                          {coupon.max_uses && (
                            <span className="text-gray-500">/ {coupon.max_uses}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isExpired(coupon) ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Expiré
                          </Badge>
                        ) : isUpcoming(coupon) ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            À venir
                          </Badge>
                        ) : coupon.is_active ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={coupon.is_active}
                            onCheckedChange={() => toggleActive(coupon)}
                            disabled={isExpired(coupon)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(coupon)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le coupon</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Voulez-vous vraiment supprimer le coupon "{coupon.code}" ?
                                  {coupon.uses_count > 0 && (
                                    <span className="block mt-2 text-orange-600 font-medium">
                                      Ce coupon a été utilisé {coupon.uses_count} fois.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(coupon.id, coupon.code)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}
