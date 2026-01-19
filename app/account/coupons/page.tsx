'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Gift, Calendar, CheckCircle, XCircle, Clock, Copy, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number | null;
  max_uses: number | null;
  uses_count: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  description?: string;
}

interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  code: string;
  source: string;
  is_used: boolean;
  used_at: string | null;
  order_id: string | null;
  obtained_at: string;
  valid_until: string;
  coupon?: Coupon;
}

export default function CouponsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [usedUserCoupons, setUsedUserCoupons] = useState<UserCoupon[]>([]);
  const [expiringSoonCoupons, setExpiringSoonCoupons] = useState<UserCoupon[]>([]);

  useEffect(() => {
    if (user) {
      loadCoupons();
    }
  }, [user]);

  async function loadCoupons() {
    setLoading(true);
    try {
      if (!user) return;

      // 1. Charger les coupons "gagnés" (Jeux, etc) qui ne sont PAS encore utilisés
      const { data: myWalletCoupons, error: walletError } = await supabase
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', user.id)
        .eq('is_used', false) // On ne prend que les non utilisés ici
        .order('obtained_at', { ascending: false });

      if (walletError) throw walletError;

      // 2. Charger l'historique d'utilisation REEL (table coupon_usage)
      const { data: usageHistory, error: usageError } = await supabase
        .from('coupon_usage')
        .select('*, coupon:coupons(*)')
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      if (usageError) throw usageError;

      // --- TRAITEMENT DES DONNEES ---

      // Liste des disponibles (ceux du wallet)
      const availableList = (myWalletCoupons as any) || [];
      setUserCoupons(availableList);

      // Liste des utilisés (on transforme usageHistory pour qu'il ressemble à UserCoupon)
      const usedList = (usageHistory || []).map((usage: any) => ({
        id: usage.id,
        user_id: usage.user_id,
        coupon_id: usage.coupon_id,
        code: usage.coupon?.code || 'CODE',
        source: 'Commande', // Source par défaut pour l'historique
        is_used: true,
        used_at: usage.used_at,
        order_id: usage.order_id,
        obtained_at: usage.used_at, // Date approx
        valid_until: usage.coupon?.valid_until,
        coupon: usage.coupon
      }));
      setUsedUserCoupons(usedList);

      // Liste "Expire Bientôt" (uniquement sur les disponibles)
      const now = new Date();
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const expiring = availableList.filter((c: UserCoupon) => {
        if (!c.valid_until) return false;
        const validUntil = new Date(c.valid_until);
        return validUntil >= now && validUntil <= in7Days;
      });
      setExpiringSoonCoupons(expiring);

    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Erreur lors du chargement des coupons');
    } finally {
      setLoading(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  }

  function formatDiscount(coupon?: Coupon) {
    if (!coupon) return '';
    if (coupon.discount_type === 'percentage') {
      return `-${coupon.discount_value}%`;
    }
    return `-${Number(coupon.discount_value).toFixed(2)}€`;
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Illimité';
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  }

  function isExpiringSoon(validUntil: string | null) {
    if (!validUntil) return false;
    const daysUntilExpiry = Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  // ... (Le reste de vos fonctions CouponCard, etc. restent identiques, 
  // assurez-vous juste d'utiliser coupon?. propriété avec le ? car parfois coupon peut être null)

  function CouponCard({ coupon, isUsed = false, usageInfo }: { coupon?: Coupon; isUsed?: boolean; usageInfo?: UserCoupon }) {
    if (!coupon) return null; // Sécurité

    return (
      <Card className={`relative overflow-hidden ${isUsed ? 'opacity-60' : 'border-[#D4AF37]/30'}`}>
        {/* ... Gardez votre JSX existant ici ... */}
        {/* Juste une correction dans l'affichage du titre pour utiliser usageInfo.code si le coupon est manquant */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-bl-full" />

        <CardHeader>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${isUsed ? 'bg-gray-200' : 'bg-[#D4AF37]'} flex items-center justify-center`}>
                    <Ticket className={`h-6 w-6 ${isUsed ? 'text-gray-500' : 'text-white'}`} />
                    </div>
                    <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        {usageInfo?.code || coupon.code}
                        {!isUsed && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCode(usageInfo?.code || coupon.code)}
                            className="h-8 w-8 p-0"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {isUsed && usageInfo ? (
                        <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Utilisé le {formatDate(usageInfo.used_at)}
                        </span>
                        ) : (
                        <span>Cliquez pour copier</span>
                        )}
                    </CardDescription>
                    </div>
                </div>
                <Badge className="bg-[#D4AF37] text-white text-lg px-3 py-1">
                    {formatDiscount(coupon)}
                </Badge>
            </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
            {/* ... Le reste de votre contenu ... */}
             <div className="grid grid-cols-2 gap-4 text-sm">
                {coupon.min_purchase && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Gift className="h-4 w-4" />
                    <span>Achat min: {Number(coupon.min_purchase).toFixed(2)}€</span>
                  </div>
                )}
                {/* ... etc ... */}
             </div>
             {isUsed && usageInfo && usageInfo.order_id && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Commande: {usageInfo.order_id}
                  </p>
                </div>
              )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ... Votre En-tête (Mes Coupons) ... */}
       <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#C6A15B]/10 border border-[#D4AF37]/20 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Coupons</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos codes promo et réductions
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-coupons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-coupons" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Mes coupons ({userCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Expirent bientôt ({expiringSoonCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="used" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Utilisés ({usedUserCoupons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="space-y-4 mt-6">
          {/* ... Contenu Expire Bientôt (identique à votre code) ... */}
           {expiringSoonCoupons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Aucun coupon n'expire dans les 7 prochains jours
                </p>
              </CardContent>
            </Card>
          ) : (
             <div className="grid gap-4 md:grid-cols-2">
                {expiringSoonCoupons.map((c) => (
                    <CouponCard key={c.id} coupon={c.coupon} usageInfo={c} />
                ))}
             </div>
          )}
        </TabsContent>

        <TabsContent value="my-coupons" className="space-y-4 mt-6">
            {/* ... Contenu Mes Coupons ... */}
            {userCoupons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">Vous n'avez pas encore gagné de coupons</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userCoupons.map((c) => (
                <CouponCard key={c.id} coupon={c.coupon} usageInfo={c} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="used" className="space-y-4 mt-6">
           {/* ... Contenu Utilisés ... */}
           {usedUserCoupons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">Vous n'avez pas encore utilisé de coupons</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {usedUserCoupons.map((c) => (
                <CouponCard key={c.id} coupon={c.coupon} isUsed={true} usageInfo={c} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}