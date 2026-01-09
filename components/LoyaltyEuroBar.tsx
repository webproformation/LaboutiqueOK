'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { Euro, TrendingUp, Crown, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LoyaltyTier {
  tier_number: number;
  min_amount: number;
  max_amount: number;
  multiplier: number;
  name: string;
}

interface LoyaltyData {
  loyalty_euros: number;
  current_tier: number;
  tier_multiplier: number;
}

export function LoyaltyEuroBar() {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLoyaltyData();
      loadTiers();
    }
  }, [user]);

  const loadLoyaltyData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('loyalty_euros, current_tier, tier_multiplier')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setLoyaltyData(data);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('tier_number');

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error loading tiers:', error);
    }
  };

  if (!user || loading || !loyaltyData) return null;

  const currentTier = tiers.find(t => t.tier_number === loyaltyData.current_tier);
  const nextTier = tiers.find(t => t.tier_number === loyaltyData.current_tier + 1);

  const currentAmount = loyaltyData.loyalty_euros;
  const tierMin = currentTier?.min_amount || 0;
  const tierMax = currentTier?.max_amount || 30;

  const progress = ((currentAmount - tierMin) / (tierMax - tierMin)) * 100;
  const remaining = tierMax - currentAmount;

  const getTierIcon = (tierNum: number) => {
    switch (tierNum) {
      case 1:
        return <TrendingUp className="h-5 w-5" />;
      case 2:
        return <Award className="h-5 w-5" />;
      case 3:
        return <Crown className="h-5 w-5" />;
      default:
        return <Euro className="h-5 w-5" />;
    }
  };

  const getTierColor = (tierNum: number) => {
    switch (tierNum) {
      case 1:
        return 'from-gray-400 to-gray-600';
      case 2:
        return 'from-[#C6A15B] to-[#D4AF37]';
      case 3:
        return 'from-[#D4AF37] to-[#FFD700]';
      default:
        return 'from-gray-300 to-gray-500';
    }
  };

  return (
    <Card className="border-2 border-[#D4AF37]/20 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getTierColor(loyaltyData.current_tier)} flex items-center justify-center text-white`}>
              {getTierIcon(loyaltyData.current_tier)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{currentTier?.name || 'Palier 1'}</h3>
              <p className="text-sm text-gray-600">
                Multiplicateur x{loyaltyData.tier_multiplier}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-2xl font-bold text-[#C6A15B]">
              <Euro className="h-6 w-6" />
              {currentAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">Ma cagnotte</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progression</span>
            {nextTier ? (
              <span className="font-semibold text-gray-700">
                Plus que {remaining.toFixed(2)}€ pour le {nextTier.name}
              </span>
            ) : (
              <span className="font-semibold text-[#D4AF37]">
                Palier maximum atteint !
              </span>
            )}
          </div>

          <div className="relative">
            <Progress
              value={Math.min(progress, 100)}
              className="h-3 bg-gray-200"
            />
            <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-bold text-white pointer-events-none">
              <span>{tierMin}€</span>
              <span>{tierMax}€</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {tiers.map((tier) => (
              <div
                key={tier.tier_number}
                className={`p-2 rounded-lg text-center transition-all ${
                  tier.tier_number === loyaltyData.current_tier
                    ? `bg-gradient-to-br ${getTierColor(tier.tier_number)} text-white scale-105 shadow-md`
                    : tier.tier_number < loyaltyData.current_tier
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gray-50 text-gray-500 border border-gray-200'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {getTierIcon(tier.tier_number)}
                </div>
                <div className="text-xs font-semibold">Palier {tier.tier_number}</div>
                <div className="text-xs">x{tier.multiplier}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-gradient-to-r from-[#C6A15B]/10 to-[#D4AF37]/10 rounded-lg">
          <p className="text-xs text-gray-700 text-center">
            <strong>Comment gagner :</strong> Connexion quotidienne (0,10€), Live 10min+ (0,20€),
            Commandes (2%), Diamants cachés (0,10€), Avis (0,20€)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
