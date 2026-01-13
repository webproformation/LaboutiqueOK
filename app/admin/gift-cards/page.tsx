'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Gift, Search, Loader2, Eye, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GiftCard {
  id: string;
  code: string;
  initial_amount: number;
  current_balance: number;
  status: string;
  from_name: string;
  to_name: string;
  custom_message: string;
  purchaser_email: string;
  recipient_email: string;
  delivery_method: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
}

interface GiftCardTransaction {
  id: string;
  amount: number;
  type: string;
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<GiftCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadGiftCards();
  }, []);

  useEffect(() => {
    filterCards();
  }, [searchTerm, statusFilter, giftCards]);

  const loadGiftCards = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGiftCards(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des cartes cadeaux');
    } finally {
      setLoading(false);
    }
  };

  const filterCards = () => {
    let filtered = [...giftCards];

    if (searchTerm) {
      filtered = filtered.filter(
        (card) =>
          card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.purchaser_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (card.recipient_email && card.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((card) => card.status === statusFilter);
    }

    setFilteredCards(filtered);
  };

  const loadTransactions = async (cardId: string) => {
    try {
      const { data, error } = await supabase
        .from('gift_card_transactions')
        .select('*')
        .eq('gift_card_id', cardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des transactions');
    }
  };

  const handleViewDetails = async (card: GiftCard) => {
    setSelectedCard(card);
    await loadTransactions(card.id);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle2 },
      used: { label: 'Utilisée', variant: 'secondary' as const, icon: CheckCircle2 },
      expired: { label: 'Expirée', variant: 'destructive' as const, icon: XCircle },
      cancelled: { label: 'Annulée', variant: 'destructive' as const, icon: Ban }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const stats = {
    total: giftCards.length,
    active: giftCards.filter((c) => c.status === 'active').length,
    used: giftCards.filter((c) => c.status === 'used').length,
    expired: giftCards.filter((c) => c.status === 'expired').length,
    totalValue: giftCards.reduce((sum, c) => sum + Number(c.current_balance), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestion des Cartes Cadeaux</h1>
        <p className="text-gray-600">Gérez toutes les cartes cadeaux émises</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Gift className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actives</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisées</p>
                <p className="text-3xl font-bold text-gray-600">{stats.used}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valeur totale</p>
                <p className="text-2xl font-bold text-[#D4AF37]">
                  {stats.totalValue.toFixed(2)}€
                </p>
              </div>
              <Gift className="h-10 w-10 text-[#D4AF37]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des cartes cadeaux</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="used">Utilisées</option>
                <option value="expired">Expirées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant initial</TableHead>
                <TableHead>Solde actuel</TableHead>
                <TableHead>Acheteur</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Aucune carte trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-mono font-semibold">{card.code}</TableCell>
                    <TableCell>{getStatusBadge(card.status)}</TableCell>
                    <TableCell>{Number(card.initial_amount).toFixed(2)}€</TableCell>
                    <TableCell className="font-semibold">
                      {Number(card.current_balance).toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-sm">{card.purchaser_email}</TableCell>
                    <TableCell className="text-sm">
                      {card.recipient_email || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(card.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(card)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la carte cadeau</DialogTitle>
            <DialogDescription>
              Informations complètes et historique des transactions
            </DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#b8933d] to-[#8b6f2d] text-white">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm opacity-90">Code</p>
                      <p className="text-2xl font-mono font-bold">{selectedCard.code}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/20">
                      <div>
                        <p className="text-sm opacity-90">Montant initial</p>
                        <p className="text-xl font-bold">
                          {Number(selectedCard.initial_amount).toFixed(2)}€
                        </p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Solde actuel</p>
                        <p className="text-xl font-bold">
                          {Number(selectedCard.current_balance).toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Acheteur</p>
                  <p className="font-medium">{selectedCard.purchaser_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Destinataire</p>
                  <p className="font-medium">
                    {selectedCard.recipient_email || <span className="text-gray-400">-</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">De</p>
                  <p className="font-medium">
                    {selectedCard.from_name || <span className="text-gray-400">-</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pour</p>
                  <p className="font-medium">
                    {selectedCard.to_name || <span className="text-gray-400">-</span>}
                  </p>
                </div>
              </div>

              {selectedCard.custom_message && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Message personnalisé</p>
                  <p className="italic bg-gray-50 p-3 rounded">"{selectedCard.custom_message}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  {getStatusBadge(selectedCard.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mode d'envoi</p>
                  <p className="font-medium">
                    {selectedCard.delivery_method === 'my-email'
                      ? 'À mon adresse'
                      : 'Au destinataire'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium">{formatDate(selectedCard.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valable jusqu'au</p>
                  <p className="font-medium">{formatDate(selectedCard.valid_until)}</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historique des transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center py-6 text-gray-500">Aucune transaction</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Solde avant</TableHead>
                          <TableHead>Solde après</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="text-sm">
                              {formatDate(transaction.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.type}</Badge>
                            </TableCell>
                            <TableCell
                              className={`font-semibold ${
                                Number(transaction.amount) < 0
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {Number(transaction.amount) > 0 ? '+' : ''}
                              {Number(transaction.amount).toFixed(2)}€
                            </TableCell>
                            <TableCell>{Number(transaction.balance_before).toFixed(2)}€</TableCell>
                            <TableCell className="font-semibold">
                              {Number(transaction.balance_after).toFixed(2)}€
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
