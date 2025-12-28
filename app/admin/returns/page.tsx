'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, CheckCircle, Clock, Euro, AlertTriangle, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface Return {
  id: string;
  return_number: string;
  user_id: string;
  woocommerce_order_id: string;
  return_type: 'credit' | 'refund';
  status: 'declared' | 'received' | 'finalized';
  total_amount: number;
  loyalty_points_to_deduct: number;
  gift_value_deducted: number;
  gift_returned: boolean;
  notes: string | null;
  declared_at: string;
  received_at: string | null;
  finalized_at: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface ReturnItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  net_amount: number;
  loyalty_points_generated: number;
}

interface GiftSettings {
  id: string;
  minimum_order_amount: number;
  gift_value: number;
  is_active: boolean;
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [giftSettings, setGiftSettings] = useState<GiftSettings | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [managementNotes, setManagementNotes] = useState('');
  const [giftReturnedCheck, setGiftReturnedCheck] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadReturns();
    loadGiftSettings();
  }, []);

  const loadReturns = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .order('declared_at', { ascending: false });

      if (error) throw error;

      setReturns(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des retours');
    } finally {
      setLoading(false);
    }
  };

  const loadGiftSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setGiftSettings(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadReturnItems = async (returnId: string) => {
    try {
      const { data, error } = await supabase
        .from('return_items')
        .select('*')
        .eq('return_id', returnId);

      if (error) throw error;
      setReturnItems(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des articles');
    }
  };

  const handleOpenManage = async (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setManagementNotes(returnItem.notes || '');
    setGiftReturnedCheck(returnItem.gift_returned);
    await loadReturnItems(returnItem.id);
    setShowManageDialog(true);
  };

  const handleValidateReception = async () => {
    if (!selectedReturn) return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('returns')
        .update({
          status: 'received',
          received_at: new Date().toISOString(),
          notes: managementNotes,
          gift_returned: giftReturnedCheck,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReturn.id);

      if (error) throw error;

      toast.success('Réception validée avec succès');
      setShowManageDialog(false);
      loadReturns();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreditWallet = async () => {
    if (!selectedReturn || selectedReturn.return_type !== 'credit') return;

    try {
      setProcessing(true);

      const { data: wallet, error: walletError } = await supabase
        .from('wallet_credits')
        .select('id, balance')
        .eq('user_id', selectedReturn.user_id)
        .maybeSingle();

      if (walletError) throw walletError;

      if (!wallet) {
        toast.error('Porte-monnaie introuvable');
        return;
      }

      const newBalance = wallet.balance + selectedReturn.total_amount;

      const { error: updateError } = await supabase
        .from('wallet_credits')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          amount: selectedReturn.total_amount,
          type: 'credit_return',
          reference_id: selectedReturn.return_number,
          description: `Avoir pour retour ${selectedReturn.return_number}`,
          created_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

      if (selectedReturn.loyalty_points_to_deduct > 0) {
        const { data: loyaltyData, error: loyaltyError } = await supabase
          .from('loyalty_accounts')
          .select('points')
          .eq('user_id', selectedReturn.user_id)
          .maybeSingle();

        if (!loyaltyError && loyaltyData) {
          const newPoints = Math.max(0, loyaltyData.points - selectedReturn.loyalty_points_to_deduct);

          await supabase
            .from('loyalty_accounts')
            .update({ points: newPoints })
            .eq('user_id', selectedReturn.user_id);

          await supabase
            .from('loyalty_transactions')
            .insert({
              user_id: selectedReturn.user_id,
              points: -selectedReturn.loyalty_points_to_deduct,
              type: 'return_deduction',
              description: `Déduction pour retour ${selectedReturn.return_number}`,
              reference_id: selectedReturn.return_number
            });
        }
      }

      const { error: finalizeError } = await supabase
        .from('returns')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString(),
          notes: managementNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReturn.id);

      if (finalizeError) throw finalizeError;

      toast.success('Avoir crédité avec succès');
      setShowManageDialog(false);
      loadReturns();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du crédit');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkRefunded = async () => {
    if (!selectedReturn || selectedReturn.return_type !== 'refund') return;

    try {
      setProcessing(true);

      if (selectedReturn.loyalty_points_to_deduct > 0) {
        const { data: loyaltyData, error: loyaltyError } = await supabase
          .from('loyalty_accounts')
          .select('points')
          .eq('user_id', selectedReturn.user_id)
          .maybeSingle();

        if (!loyaltyError && loyaltyData) {
          const newPoints = Math.max(0, loyaltyData.points - selectedReturn.loyalty_points_to_deduct);

          await supabase
            .from('loyalty_accounts')
            .update({ points: newPoints })
            .eq('user_id', selectedReturn.user_id);

          await supabase
            .from('loyalty_transactions')
            .insert({
              user_id: selectedReturn.user_id,
              points: -selectedReturn.loyalty_points_to_deduct,
              type: 'return_deduction',
              description: `Déduction pour retour ${selectedReturn.return_number}`,
              reference_id: selectedReturn.return_number
            });
        }
      }

      const { error } = await supabase
        .from('returns')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString(),
          notes: managementNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReturn.id);

      if (error) throw error;

      toast.success('Remboursement marqué comme effectué');
      setShowManageDialog(false);
      loadReturns();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la finalisation');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateGiftSettings = async () => {
    if (!giftSettings) return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('gift_settings')
        .update({
          minimum_order_amount: giftSettings.minimum_order_amount,
          gift_value: giftSettings.gift_value,
          is_active: giftSettings.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', giftSettings.id);

      if (error) throw error;

      toast.success('Paramètres mis à jour');
      setShowSettingsDialog(false);
      loadGiftSettings();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'declared':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Déclaré</Badge>;
      case 'received':
        return <Badge variant="secondary" className="gap-1"><Package className="w-3 h-3" /> Reçu</Badge>;
      case 'finalized':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="w-3 h-3" /> Finalisé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Retours</h1>
          <p className="text-gray-600">Gérez les demandes de retour et les avoirs clients</p>
        </div>
        <Button
          onClick={() => setShowSettingsDialog(true)}
          variant="outline"
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Paramètres Cadeau
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes de Retour</CardTitle>
          <CardDescription>
            {returns.length} retour{returns.length > 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Retour</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">{returnItem.return_number}</TableCell>
                  <TableCell>
                    {returnItem.profiles?.first_name} {returnItem.profiles?.last_name}
                  </TableCell>
                  <TableCell>#{returnItem.woocommerce_order_id}</TableCell>
                  <TableCell>
                    <Badge variant={returnItem.return_type === 'credit' ? 'secondary' : 'outline'}>
                      {returnItem.return_type === 'credit' ? 'Avoir' : 'Remboursement'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{returnItem.total_amount.toFixed(2)} €</TableCell>
                  <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                  <TableCell>
                    {new Date(returnItem.declared_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenManage(returnItem)}
                    >
                      Gérer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gérer le retour {selectedReturn?.return_number}</DialogTitle>
            <DialogDescription>
              Client: {selectedReturn?.profiles?.first_name} {selectedReturn?.profiles?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Statut actuel</Label>
                <div className="mt-2">{selectedReturn && getStatusBadge(selectedReturn.status)}</div>
              </div>
              <div>
                <Label>Type</Label>
                <div className="mt-2">
                  <Badge variant={selectedReturn?.return_type === 'credit' ? 'secondary' : 'outline'}>
                    {selectedReturn?.return_type === 'credit' ? 'Avoir' : 'Remboursement'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Montant total</Label>
                <div className="mt-2 text-lg font-bold" style={{ color: '#C6A15B' }}>
                  {selectedReturn?.total_amount.toFixed(2)} €
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-semibold">Articles retournés</Label>
              <div className="mt-2 space-y-2">
                {returnItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-500">
                          Quantité: {item.quantity} × {item.unit_price.toFixed(2)} €
                        </div>
                        {item.discount_amount > 0 && (
                          <div className="text-sm text-red-600">
                            Remise proratisée: -{item.discount_amount.toFixed(2)} €
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{item.net_amount.toFixed(2)} €</div>
                        {item.loyalty_points_generated > 0 && (
                          <div className="text-xs text-orange-600">
                            Points à récupérer: {item.loyalty_points_generated.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedReturn?.loyalty_points_to_deduct && selectedReturn.loyalty_points_to_deduct > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">
                    Points fidélité à récupérer: {selectedReturn.loyalty_points_to_deduct.toFixed(2)} points
                  </span>
                </div>
              </div>
            )}

            {selectedReturn?.gift_value_deducted && selectedReturn.gift_value_deducted > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">
                      Valeur cadeau déduite: {selectedReturn.gift_value_deducted.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="gift-returned"
                      checked={giftReturnedCheck}
                      onCheckedChange={(checked) => setGiftReturnedCheck(checked as boolean)}
                      disabled={selectedReturn.status === 'finalized'}
                    />
                    <Label htmlFor="gift-returned" className="text-sm">
                      Cadeau retourné
                    </Label>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes de gestion</Label>
              <Textarea
                id="notes"
                value={managementNotes}
                onChange={(e) => setManagementNotes(e.target.value)}
                placeholder="Ajoutez des notes sur ce retour..."
                rows={3}
                disabled={selectedReturn?.status === 'finalized'}
              />
            </div>
          </div>

          <DialogFooter>
            {selectedReturn?.status === 'declared' && (
              <Button
                onClick={handleValidateReception}
                disabled={processing}
                className="gap-2"
                style={{ backgroundColor: '#C6A15B' }}
              >
                <CheckCircle className="w-4 h-4" />
                Valider la réception
              </Button>
            )}

            {selectedReturn?.status === 'received' && selectedReturn.return_type === 'credit' && (
              <Button
                onClick={handleCreditWallet}
                disabled={processing}
                className="gap-2"
                style={{ backgroundColor: '#C6A15B' }}
              >
                <Euro className="w-4 h-4" />
                Créditer l'Avoir
              </Button>
            )}

            {selectedReturn?.status === 'received' && selectedReturn.return_type === 'refund' && (
              <Button
                onClick={handleMarkRefunded}
                disabled={processing}
                className="gap-2"
                style={{ backgroundColor: '#C6A15B' }}
              >
                <CheckCircle className="w-4 h-4" />
                Marquer comme remboursé
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres des Cadeaux</DialogTitle>
            <DialogDescription>
              Configuration pour la déduction des cadeaux lors des retours
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="min-amount">Montant minimum pour cadeau (€)</Label>
              <Input
                id="min-amount"
                type="number"
                step="0.01"
                value={giftSettings?.minimum_order_amount || 0}
                onChange={(e) => setGiftSettings(prev => prev ? {
                  ...prev,
                  minimum_order_amount: parseFloat(e.target.value)
                } : null)}
              />
            </div>

            <div>
              <Label htmlFor="gift-value">Valeur du cadeau pour déduction (€)</Label>
              <Input
                id="gift-value"
                type="number"
                step="0.01"
                value={giftSettings?.gift_value || 0}
                onChange={(e) => setGiftSettings(prev => prev ? {
                  ...prev,
                  gift_value: parseFloat(e.target.value)
                } : null)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is-active"
                checked={giftSettings?.is_active || false}
                onCheckedChange={(checked) => setGiftSettings(prev => prev ? {
                  ...prev,
                  is_active: checked as boolean
                } : null)}
              />
              <Label htmlFor="is-active">Système de cadeaux actif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleUpdateGiftSettings} disabled={processing}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
