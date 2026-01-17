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
  coupon?: {
    id: string;
    code: string;
    name: string;
    description: string;
    discount_type: string;
    discount_value: number;
    is_active: boolean;
  };
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
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: myCoupons, error: myCouponsError } = await supabase
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', user.id)
        .order('obtained_at', { ascending: false });

      if (myCouponsError) {
        console.error('Error loading user coupons:', myCouponsError);
        throw myCouponsError;
      }

      const all = (myCoupons as any) || [];
      const now = new Date();
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      setUserCoupons(all.filter((c: UserCoupon) => !c.is_used));
      setUsedUserCoupons(all.filter((c: UserCoupon) => c.is_used));

      setExpiringSoonCoupons(
        all.filter((c: UserCoupon) => {
          if (c.is_used || !c.valid_until) return false;
          const validUntil = new Date(c.valid_until);
          return validUntil >= now && validUntil <= in7Days;
        })
      );
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Erreur lors du chargement des coupons');
    } finally {
      setLoading(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papier!');
  }

  function formatDiscount(coupon: Coupon) {
    if (coupon.discount_type === 'percentage') {
      return `-${coupon.discount_value}%`;
    }
    return `-${coupon.discount_value.toFixed(2)}€`;
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

  function CouponCard({ coupon, isUsed = false, usageInfo }: { coupon: Coupon; isUsed?: boolean; usageInfo?: UserCoupon }) {
    return (
      <Card className={`relative overflow-hidden ${isUsed ? 'opacity-60' : 'border-[#D4AF37]/30'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-bl-full" />

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${isUsed ? 'bg-gray-200' : 'bg-[#D4AF37]'} flex items-center justify-center`}>
                <Ticket className={`h-6 w-6 ${isUsed ? 'text-gray-500' : 'text-white'}`} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {coupon.code}
                  {!isUsed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyCode(coupon.code)}
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            {coupon.min_purchase && (
              <div className="flex items-center gap-2 text-gray-600">
                <Gift className="h-4 w-4" />
                <span>Achat min: {coupon.min_purchase.toFixed(2)}€</span>
              </div>
            )}

            {coupon.valid_until && (
              <div className={`flex items-center gap-2 ${isExpiringSoon(coupon.valid_until) ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                <Calendar className="h-4 w-4" />
                <span>Expire: {formatDate(coupon.valid_until)}</span>
                {isExpiringSoon(coupon.valid_until) && !isUsed && (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                )}
              </div>
            )}

            {coupon.max_uses && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Utilisations: {coupon.uses_count || 0} / {coupon.max_uses}</span>
              </div>
            )}
          </div>

          {isUsed && usageInfo && usageInfo.order_id && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Commande: {usageInfo.order_id}
              </p>
            </div>
          )}

          {!isUsed && (
            <div className="pt-3">
              <Button
                onClick={() => copyCode(coupon.code)}
                className="w-full bg-[#D4AF37] hover:bg-[#C6A15B] text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier le code
              </Button>
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
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900">Attention - Expiration imminente</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Ces coupons expirent dans les 7 prochains jours. Utilisez-les rapidement !
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {expiringSoonCoupons.map((userCoupon) => (
                  <Card key={userCoupon.id} className="relative overflow-hidden border-orange-400/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-bl-full" />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-bold text-orange-600 flex items-center gap-2">
                            {userCoupon.coupon?.code || userCoupon.code}
                            <AlertTriangle className="h-5 w-5" />
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {userCoupon.coupon?.description || 'Réduction applicable'}
                          </CardDescription>
                        </div>
                        <Badge className="bg-orange-500 text-white">{userCoupon.code}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center p-6 bg-gradient-to-br from-orange-400/10 to-orange-300/5 rounded-lg">
                        <div className="text-4xl font-bold text-orange-600">
                          {userCoupon.coupon?.discount_type === 'percentage'
                            ? `-${userCoupon.coupon.discount_value}%`
                            : `-${(Number(userCoupon.coupon?.discount_value) || 0).toFixed(2)}€`
                          }
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-orange-600 font-semibold">
                          <Calendar className="h-4 w-4" />
                          <span>Expire: {formatDate(userCoupon.valid_until)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Gift className="h-4 w-4" />
                          <span>Source: {userCoupon.source}</span>
                        </div>
                      </div>
                      <div className="pt-3">
                        <Button
                          onClick={() => copyCode(userCoupon.code)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copier le code
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-coupons" className="space-y-4 mt-6">
          {userCoupons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Vous n'avez pas encore gagné de coupons
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Participez à nos jeux pour gagner des coupons exclusifs !
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userCoupons.map((userCoupon) => (
                <Card key={userCoupon.id} className="relative overflow-hidden border-[#D4AF37]/30">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-bl-full" />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-[#D4AF37]">
                          {userCoupon.coupon?.code || userCoupon.code}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {userCoupon.coupon?.description || 'Réduction applicable'}
                        </CardDescription>
                      </div>
                      <Badge className="bg-[#D4AF37] text-white">{userCoupon.code}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-center p-6 bg-gradient-to-br from-[#D4AF37]/10 to-[#C6A15B]/5 rounded-lg">
                      <div className="text-4xl font-bold text-[#D4AF37]">
                        {userCoupon.coupon?.discount_type === 'percentage'
                          ? `-${userCoupon.coupon.discount_value}%`
                          : `-${(Number(userCoupon.coupon?.discount_value) || 0).toFixed(2)}€`
                        }
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Expire: {formatDate(userCoupon.valid_until)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Gift className="h-4 w-4" />
                        <span>Source: {userCoupon.source}</span>
                      </div>
                    </div>
                    <div className="pt-3">
                      <Button
                        onClick={() => copyCode(userCoupon.code)}
                        className="w-full bg-[#D4AF37] hover:bg-[#C6A15B] text-white"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copier le code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="used" className="space-y-4 mt-6">
          {usedUserCoupons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Vous n'avez pas encore utilisé de coupons
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {usedUserCoupons.map((userCoupon) => (
                <Card key={userCoupon.id} className="relative overflow-hidden opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">
                          {userCoupon.coupon?.code || userCoupon.code}
                        </CardTitle>
                        <Badge variant="secondary">{userCoupon.code}</Badge>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {userCoupon.coupon?.discount_type === 'percentage'
                          ? `-${userCoupon.coupon.discount_value}%`
                          : `-${(Number(userCoupon.coupon?.discount_value) || 0).toFixed(2)}€`
                        }
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200 space-y-1">
                      <p className="text-sm text-gray-600">
                        Utilisé le: {userCoupon.used_at ? formatDate(userCoupon.used_at) : 'N/A'}
                      </p>
                      {userCoupon.order_id && (
                        <p className="text-xs text-gray-500">
                          Commande: {userCoupon.order_id}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
