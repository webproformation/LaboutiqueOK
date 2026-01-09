'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Send, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GiftCard {
  id: string;
  code: string;
  initial_amount: number;
  current_balance: number;
  status: string;
  from_name: string;
  to_name: string;
  custom_message: string;
  delivery_method: string;
  recipient_email: string;
  purchaser_email: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
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

export default function GiftCardsPage() {
  const { profile, user } = useAuth();
  const [myGiftCards, setMyGiftCards] = useState<GiftCard[]>([]);
  const [receivedGiftCards, setReceivedGiftCards] = useState<GiftCard[]>([]);
  const [checkCode, setCheckCode] = useState('');
  const [checkedCard, setCheckedCard] = useState<GiftCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user) {
      loadGiftCards();
    }
  }, [user]);

  const loadGiftCards = async () => {
    try {
      const [purchasedResult, receivedResult] = await Promise.all([
        supabase
          .from('gift_cards')
          .select('*')
          .eq('purchaser_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('gift_cards')
          .select('*')
          .eq('recipient_email', profile?.email)
          .order('created_at', { ascending: false })
      ]);

      if (purchasedResult.data) setMyGiftCards(purchasedResult.data);
      if (receivedResult.data) setReceivedGiftCards(receivedResult.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des cartes cadeaux');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    if (!checkCode.trim()) {
      toast.error('Veuillez entrer un code');
      return;
    }

    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', checkCode.toUpperCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Code invalide');
        setCheckedCard(null);
      } else {
        setCheckedCard(data);
        toast.success('Carte trouvée');
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification');
    } finally {
      setChecking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      used: { label: 'Utilisée', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 },
      expired: { label: 'Expirée', color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
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
        <h1 className="text-3xl font-bold mb-2">Mes Cartes Cadeaux</h1>
        <p className="text-gray-600">Gérez vos cartes cadeaux achetées et reçues</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Vérifier le solde d'une carte
          </CardTitle>
          <CardDescription>
            Entrez le code de votre carte cadeau pour vérifier son solde
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="checkCode">Code de la carte</Label>
                <Input
                  id="checkCode"
                  placeholder="GC-XXXX-XXXX-XXXX"
                  value={checkCode}
                  onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckBalance()}
                />
              </div>
              <Button
                onClick={handleCheckBalance}
                disabled={checking}
                className="mt-auto bg-[#D4AF37] hover:bg-[#b8933d]"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier'}
              </Button>
            </div>

            {checkedCard && (
              <Card className="bg-gradient-to-br from-[#b8933d] to-[#8b6f2d] text-white">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm opacity-90">Code</p>
                        <p className="text-lg font-mono font-bold">{checkedCard.code}</p>
                      </div>
                      {getStatusBadge(checkedCard.status)}
                    </div>
                    <div className="border-t border-white/20 pt-3">
                      <p className="text-sm opacity-90">Solde disponible</p>
                      <p className="text-4xl font-bold">{Number(checkedCard.current_balance).toFixed(2)}€</p>
                      <p className="text-sm opacity-75 mt-1">
                        Montant initial: {Number(checkedCard.initial_amount).toFixed(2)}€
                      </p>
                    </div>
                    <div className="border-t border-white/20 pt-3 text-sm opacity-90">
                      <p>Valable jusqu'au {formatDate(checkedCard.valid_until)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#D4AF37]" />
              Cartes achetées ({myGiftCards.length})
            </CardTitle>
            <CardDescription>
              Les cartes cadeaux que vous avez achetées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myGiftCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune carte achetée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myGiftCards.map((card) => (
                  <Card key={card.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono font-bold text-lg">{card.code}</p>
                            <p className="text-sm text-gray-600">
                              {card.to_name && `Pour ${card.to_name}`}
                            </p>
                          </div>
                          {getStatusBadge(card.status)}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-gray-600">Solde</span>
                          <span className="text-2xl font-bold text-[#D4AF37]">
                            {Number(card.current_balance).toFixed(2)}€
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Créée le {formatDate(card.created_at)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#D4AF37]" />
              Cartes reçues ({receivedGiftCards.length})
            </CardTitle>
            <CardDescription>
              Les cartes cadeaux que vous avez reçues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {receivedGiftCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Send className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune carte reçue</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedGiftCards.map((card) => (
                  <Card key={card.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono font-bold text-lg">{card.code}</p>
                            <p className="text-sm text-gray-600">
                              {card.from_name && `De ${card.from_name}`}
                            </p>
                          </div>
                          {getStatusBadge(card.status)}
                        </div>
                        {card.custom_message && (
                          <p className="text-sm italic text-gray-600 bg-gray-50 p-2 rounded">
                            "{card.custom_message}"
                          </p>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-gray-600">Solde</span>
                          <span className="text-2xl font-bold text-[#D4AF37]">
                            {Number(card.current_balance).toFixed(2)}€
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Valable jusqu'au {formatDate(card.valid_until)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
