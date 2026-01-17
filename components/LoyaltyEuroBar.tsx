'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { Euro, Zap, Sparkles, Crown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LoyaltyData {
  loyalty_euros: number;
}

const TIERS = [
  { min: 0, max: 5, multiplier: 1, name: 'Débutant', icon: TrendingUp, color: 'from-gray-400 to-gray-600' },
  { min: 5, max: 15, multiplier: 2, name: 'Expert', icon: Sparkles, color: 'from-[#C6A15B] to-[#D4AF37]' },
  { min: 15, max: Infinity, multiplier: 3, name: 'Légende', icon: Crown, color: 'from-[#D4AF37] to-[#FFD700]' }
];

export function LoyaltyEuroBar() {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLoyaltyData();
    }
  }, [user]);

  const loadLoyaltyData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('loyalty_euros')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setLoyaltyData({ loyalty_euros: parseFloat(data.loyalty_euros || '0') });
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading || !loyaltyData) return null;

  const currentAmount = loyaltyData.loyalty_euros;

  const getCurrentTier = () => {
    return TIERS.find(tier => currentAmount >= tier.min && currentAmount < tier.max) || TIERS[TIERS.length - 1];
  };

  const currentTier = getCurrentTier();
  const nextTier = TIERS.find(t => t.min > currentAmount);

  const progress = nextTier
    ? ((currentAmount - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const remaining = nextTier ? nextTier.min - currentAmount : 0;

  const TierIcon = currentTier.icon;

  return (
    <Card className="border-2 border-[#D4AF37]/20 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${currentTier.color} flex items-center justify-center text-white shadow-lg`}>
              <TierIcon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{currentTier.name}</h3>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <p className="text-sm font-semibold text-gray-700">
                  Gains x{currentTier.multiplier}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-3xl font-bold text-[#C6A15B]">
              {currentAmount.toFixed(2)}
              <Euro className="h-7 w-7" />
            </div>
            <p className="text-xs text-gray-500">Ma cagnotte</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Progression</span>
            {nextTier ? (
              <span className="font-bold text-gray-900">
                Plus que <span className="text-[#D4AF37]">{remaining.toFixed(2)}€</span> pour {nextTier.name}
              </span>
            ) : (
              <span className="font-bold text-[#D4AF37] flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Palier maximum atteint !
              </span>
            )}
          </div>

          <div className="relative">
            <Progress
              value={Math.min(progress, 100)}
              className="h-4 bg-gray-200"
            />
            {nextTier && (
              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold pointer-events-none">
                <span className="text-white drop-shadow-md">{currentTier.min}€</span>
                <span className="text-white drop-shadow-md">{nextTier.min}€</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {TIERS.map((tier, index) => {
              const TierCardIcon = tier.icon;
              const isActive = tier.name === currentTier.name;
              const isPassed = currentAmount >= tier.min;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isActive
                      ? `bg-gradient-to-br ${tier.color} text-white scale-105 shadow-lg`
                      : isPassed
                      ? 'bg-gray-100 text-gray-400 opacity-60'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 border-2 border-gray-200'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <TierCardIcon className={`h-6 w-6 ${isActive ? '' : 'opacity-70'}`} />
                  </div>
                  <div className="text-xs font-bold mb-1">{tier.name}</div>
                  <div className={`text-sm font-bold flex items-center justify-center gap-0.5 ${isActive ? 'text-yellow-200' : ''}`}>
                    <Zap className={`h-3 w-3 ${isActive ? 'fill-yellow-200' : ''}`} />
                    x{tier.multiplier}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {tier.max === Infinity ? `${tier.min}€+` : `${tier.min}-${tier.max}€`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-[#C6A15B]/10 via-[#D4AF37]/10 to-[#FFD700]/10 rounded-xl border border-[#D4AF37]/20">
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            Le Secret du Multiplicateur
          </h4>
          <div className="text-xs text-gray-700 space-y-1">
            <p><strong>Comment gagner :</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Connexion quotidienne : <strong>+0,10€</strong></li>
              <li>Diamants cachés : <strong>+0,10€</strong> par diamant</li>
              <li>Live Shopping (10min+) : <strong>+0,20€</strong></li>
              <li>Avis client : <strong>+0,20€</strong></li>
              <li>Cashback commande : <strong>2%</strong> du montant</li>
            </ul>
            <p className="mt-2 text-[#C6A15B] font-semibold">
              Tous vos gains sont multipliés par x{currentTier.multiplier} !
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
