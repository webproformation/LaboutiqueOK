'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Euro, Package, CheckCircle, Clock, AlertCircle, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface WalletCredit {
  balance: number;
}

interface Return {
  id: string;
  return_number: string;
  woocommerce_order_id: string;
  return_type: 'credit' | 'refund';
  status: 'declared' | 'received' | 'finalized';
  total_amount: number;
  declared_at: string;
  received_at: string | null;
  finalized_at: string | null;
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function ReturnsManagementPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletCredit | null>(null);
  const [returns, setReturns] = useState<Return[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [walletRes, returnsRes, transactionsRes] = await Promise.all([
        supabase
          .from('wallet_credits')
          .select('balance')
          .eq('user_id', user!.id)
          .maybeSingle(),
        supabase
          .from('returns')
          .select('*')
          .eq('user_id', user!.id)
          .order('declared_at', { ascending: false }),
        supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', (await supabase
            .from('wallet_credits')
            .select('id')
            .eq('user_id', user!.id)
            .maybeSingle()).data?.id || '')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (walletRes.data) {
        setWallet(walletRes.data);
      }

      if (returnsRes.data) {
        setReturns(returnsRes.data);
      }

      if (transactionsRes.data) {
        setTransactions(transactionsRes.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReturnTypeBadge = (type: string) => {
    switch (type) {
      case 'credit':
        return <Badge variant="secondary" className="gap-1"><Euro className="w-3 h-3" /> Avoir</Badge>;
      case 'refund':
        return <Badge variant="outline" className="gap-1"><Euro className="w-3 h-3" /> Remboursement</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/account">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au compte
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Retours</h1>
        <p className="text-gray-600">Gérez vos retours et consultez votre solde d'avoir</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="border-2" style={{ borderColor: '#C6A15B' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="w-5 h-5" style={{ color: '#C6A15B' }} />
              Solde Avoir
            </CardTitle>
            <CardDescription>
              Votre porte-monnaie virtuel à utiliser sur vos prochaines commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" style={{ color: '#C6A15B' }}>
              {(wallet?.balance || 0).toFixed(2)} €
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Ce montant se déduira automatiquement lors de votre prochain achat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Déclarer un Retour
            </CardTitle>
            <CardDescription>
              Retournez vos articles dans les 14 jours suivant la livraison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/account/orders">
              <Button className="w-full gap-2" style={{ backgroundColor: '#C6A15B' }}>
                <Plus className="w-4 h-4" />
                Déclarer un retour
              </Button>
            </Link>
            <p className="text-xs text-gray-500 mt-3">
              Rendez-vous dans votre historique de commandes pour déclarer un retour
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Historique des Retours</CardTitle>
          <CardDescription>
            Suivez l'état de vos demandes de retour
          </CardDescription>
        </CardHeader>
        <CardContent>
          {returns.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun retour déclaré pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {returns.map((returnItem) => (
                <div key={returnItem.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">{returnItem.return_number}</div>
                      <div className="text-sm text-gray-500">
                        Commande #{returnItem.woocommerce_order_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{returnItem.total_amount.toFixed(2)} €</div>
                      <div className="flex gap-2 mt-1 justify-end">
                        {getStatusBadge(returnItem.status)}
                        {getReturnTypeBadge(returnItem.return_type)}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Déclaré le</div>
                      <div className="font-medium">
                        {new Date(returnItem.declared_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    {returnItem.received_at && (
                      <div>
                        <div className="text-gray-500">Reçu le</div>
                        <div className="font-medium">
                          {new Date(returnItem.received_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    )}
                    {returnItem.finalized_at && (
                      <div>
                        <div className="text-gray-500">Finalisé le</div>
                        <div className="font-medium">
                          {new Date(returnItem.finalized_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    )}
                  </div>

                  {returnItem.status === 'declared' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <div className="font-semibold mb-1">Adresse de retour :</div>
                          <div>1062 Rue d'Armentières</div>
                          <div>59850 Nieppe</div>
                          <div className="font-semibold text-red-600 mt-2">
                            ⚠️ Livraison directe uniquement - Pas de Points Relais
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des Mouvements</CardTitle>
            <CardDescription>
              Les 10 dernières transactions de votre porte-monnaie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
