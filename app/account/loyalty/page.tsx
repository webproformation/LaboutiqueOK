'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  TrendingUp,
  Calendar,
  Video,
  ShoppingBag,
  Gem,
  Gift,
  Star,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface TierInfo {
  tier: number;
  multiplier: number;
  tier_name: string;
  current_balance: number;
  next_tier_threshold: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  multiplier: number;
  base_amount: number;
}

export default function LoyaltyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [tierData, transactionsData] = await Promise.all([
        supabase.rpc('get_loyalty_tier', { p_user_id: user.id }),
        supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (tierData.error) throw tierData.error;
      if (transactionsData.error) throw transactionsData.error;

      if (tierData.data && tierData.data.length > 0) {
        setTierInfo(tierData.data[0]);
      }

      setTransactions(transactionsData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const claimDailyBonus = async () => {
    if (!user || claimingDaily) return;

    setClaimingDaily(true);
    try {
      const { data, error } = await supabase.rpc('award_daily_connection_bonus', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        loadData();
      } else {
        toast.info(data.message);
      }
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      toast.error('Erreur lors de la réclamation du bonus');
    } finally {
      setClaimingDaily(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p>Connecte-toi pour accéder à ton programme de fidélité</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = tierInfo && tierInfo.tier !== 3
    ? ((tierInfo.current_balance / tierInfo.next_tier_threshold) * 100)
    : 100;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily_connection':
        return <Calendar className="w-4 h-4" />;
      case 'live_presence':
        return <Video className="w-4 h-4" />;
      case 'order_reward':
        return <ShoppingBag className="w-4 h-4" />;
      case 'diamond_find':
        return <Gem className="w-4 h-4" />;
      case 'review_reward':
        return <Star className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily_connection':
        return 'Connexion quotidienne';
      case 'live_presence':
        return 'Présence en live';
      case 'order_reward':
        return 'Récompense commande';
      case 'diamond_find':
        return 'Diamant trouvé';
      case 'review_reward':
        return 'Avis produit';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Programme Fidélité</h1>
        <p className="text-lg text-white italic" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}>
          Ici, chaque visite, chaque échange en live et chaque coup de cœur te rapproche de ta prochaine pépite. Ta fidélité a de la valeur, et je suis ravie de la récompenser chaque jour.
        </p>
      </div>

      <Card className="bg-gradient-to-r from-[#b8933d] to-[#8b6f2f] text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Ma Cagnotte Fidélité
            </span>
            <Button
              onClick={claimDailyBonus}
              disabled={claimingDaily}
              variant="secondary"
              size="sm"
            >
              Bonus du jour
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold mb-4">
            {tierInfo?.current_balance.toFixed(2)} €
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {tierInfo?.tier_name}
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Multiplicateur x{tierInfo?.multiplier}
            </div>
          </div>
          {tierInfo && tierInfo.tier !== 3 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression vers {tierInfo.tier === 1 ? 'Palier 2' : 'Palier 3'}</span>
                <span>{tierInfo.next_tier_threshold} €</span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-white/20" />
              <p className="text-sm text-white/80">
                Plus que {(tierInfo.next_tier_threshold - tierInfo.current_balance).toFixed(2)} € pour débloquer le multiplicateur x{tierInfo.multiplier + 1}
              </p>
            </div>
          )}
          {tierInfo && tierInfo.tier === 3 && (
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Palier maximum atteint ! Toutes tes récompenses sont triplées</span>
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-white/20">
            <Button
              className="w-full bg-white text-[#b8933d] hover:bg-gray-50 font-semibold"
              size="lg"
              disabled={!tierInfo || tierInfo.current_balance < 1}
              onClick={() => {
                if (tierInfo && tierInfo.current_balance >= 1) {
                  router.push('/cart');
                  toast.success('Rendez-vous dans votre panier pour utiliser votre cagnotte !');
                }
              }}
            >
              <Gift className="w-5 h-5 mr-2" />
              Je me fais plaisir
            </Button>
            {tierInfo && tierInfo.current_balance < 1 && (
              <p className="text-sm text-white/80 text-center mt-2">
                Minimum 1 € pour utiliser ta cagnotte
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Les Paliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`p-3 rounded-lg ${tierInfo?.tier === 1 ? 'bg-[#b8933d]/10 border-2 border-[#b8933d]' : 'bg-gray-50'}`}>
                <div className="font-semibold text-sm flex items-center justify-between">
                  <span>Palier 1</span>
                  <span className="text-[#b8933d]">x1</span>
                </div>
                <div className="text-xs text-gray-600">0 € - 5 €</div>
              </div>
              <div className={`p-3 rounded-lg ${tierInfo?.tier === 2 ? 'bg-[#b8933d]/10 border-2 border-[#b8933d]' : 'bg-gray-50'}`}>
                <div className="font-semibold text-sm flex items-center justify-between">
                  <span>Palier 2</span>
                  <span className="text-[#b8933d]">x2</span>
                </div>
                <div className="text-xs text-gray-600">5 € - 15 €</div>
                <div className="text-xs text-[#b8933d] mt-1">Gains doublés !</div>
              </div>
              <div className={`p-3 rounded-lg ${tierInfo?.tier === 3 ? 'bg-[#b8933d]/10 border-2 border-[#b8933d]' : 'bg-gray-50'}`}>
                <div className="font-semibold text-sm flex items-center justify-between">
                  <span>Palier 3</span>
                  <span className="text-[#b8933d]">x3</span>
                </div>
                <div className="text-xs text-gray-600">15 € - 30 €</div>
                <div className="text-xs text-[#b8933d] mt-1">Gains triplés !</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Comment gagner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#b8933d] flex-shrink-0" />
                <span>0,10 € / jour (connexion)</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#b8933d] flex-shrink-0" />
                <span>0,20 € (10 min en live)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#b8933d] flex-shrink-0" />
                <span>2 % de tes commandes</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#b8933d] flex-shrink-0" />
                <span>0,10 € / diamant trouvé</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#b8933d] flex-shrink-0" />
                <span>0,20 € / avis produit</span>
              </div>
              <div className="pt-2 border-t text-xs text-gray-500">
                Tous les gains sont multipliés selon ton palier !
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Chasse aux Diamants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Gem className="w-12 h-12 mx-auto mb-2 text-[#b8933d]" />
              <p className="text-sm text-gray-600 mb-4">
                3 diamants cachés par semaine dans le site !
              </p>
              <div className="text-xs text-gray-500 bg-[#b8933d]/10 rounded p-2">
                Trouve-les pour gagner 0,10 € par diamant
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Historique des Gains
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Aucune transaction pour le moment</p>
              <p className="text-sm mt-2">Commence à gagner des euros en naviguant sur le site !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-white rounded-lg">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {getTypeLabel(transaction.type)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {transaction.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {transaction.multiplier > 1 && (
                        <div className="text-xs text-[#b8933d] mt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {transaction.base_amount.toFixed(2)} € × {transaction.multiplier} = {transaction.amount.toFixed(2)} €
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-green-600">
                      +{transaction.amount.toFixed(2)} €
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}