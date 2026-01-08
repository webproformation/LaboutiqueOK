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

interface CouponUsage {
  id: string;
  coupon_id: string;
  used_at: string;
  order_id: string;
  discount_applied: number;
  coupons: Coupon;
}

export default function CouponsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [usedCoupons, setUsedCoupons] = useState<CouponUsage[]>([]);
  const [expiringSoonCoupons, setExpiringSoonCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    if (user) {
      loadCoupons();
    }
  }, [user]);

  async function loadCoupons() {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: available, error: availableError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or(`valid_from.is.null,valid_from.lte.${now}`)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order('created_at', { ascending: false });

      if (availableError) throw availableError;
      setAvailableCoupons(available || []);

      const { data: expiring, error: expiringError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or(`valid_from.is.null,valid_from.lte.${now}`)
        .gte('valid_until', now)
        .lte('valid_until', in7Days)
        .order('valid_until', { ascending: true });

      if (expiringError) throw expiringError;
      setExpiringSoonCoupons(expiring || []);

      if (user) {
        const { data: used, error: usedError } = await supabase
          .from('coupon_usage')
          .select(`
            id,
            coupon_id,
            used_at,
            order_id,
            discount_applied,
            coupons (
              id,
              code,
              discount_type,
              discount_value,
              min_purchase,
              max_uses,
              uses_count,
              valid_from,
              valid_until,
              is_active,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('used_at', { ascending: false });

        if (usedError) throw usedError;
        setUsedCoupons(used as any || []);
      }
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

  function CouponCard({ coupon, isUsed = false, usageInfo }: { coupon: Coupon; isUsed?: boolean; usageInfo?: CouponUsage }) {
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

          {isUsed && usageInfo && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Réduction appliquée: <span className="font-semibold text-green-600">{usageInfo.discount_applied.toFixed(2)}€</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
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

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Disponibles ({availableCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Expirent bientôt ({expiringSoonCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="used" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Utilisés ({usedCoupons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4 mt-6">
          {availableCoupons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Aucun coupon disponible pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {availableCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
            </div>
          )}
        </TabsContent>

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
                {expiringSoonCoupons.map((coupon) => (
                  <CouponCard key={coupon.id} coupon={coupon} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="used" className="space-y-4 mt-6">
          {usedCoupons.length === 0 ? (
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
              {usedCoupons.map((usage) => (
                <CouponCard
                  key={usage.id}
                  coupon={usage.coupons as Coupon}
                  isUsed={true}
                  usageInfo={usage}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
