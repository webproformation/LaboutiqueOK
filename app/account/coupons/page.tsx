"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Calendar, Check, X, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface CouponType {
  id: string;
  code: string;
  type: string;
  value: number;
  description: string;
  valid_until: string;
}

interface UserCoupon {
  id: string;
  code: string;
  source: string;
  is_used: boolean;
  used_at: string | null;
  obtained_at: string;
  valid_until: string;
  coupon_types: CouponType;
}

export default function CouponsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadCoupons();
  }, [user, router]);

  const loadCoupons = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupon_types:coupon_type_id (
          id,
          code,
          type,
          value,
          description,
          valid_until
        )
      `)
      .eq('user_id', user.id)
      .order('obtained_at', { ascending: false });

    if (data) {
      setCoupons(data as unknown as UserCoupon[]);
    }

    setLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papiers');
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      scratch_game: 'Jeu Concours',
      promotion: 'Promotion',
      loyalty: 'Programme Fidélité',
      gift: 'Cadeau',
    };
    return labels[source] || source;
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  const availableCoupons = coupons.filter(c => !c.is_used && !isExpired(c.valid_until));
  const usedCoupons = coupons.filter(c => c.is_used);
  const expiredCoupons = coupons.filter(c => !c.is_used && isExpired(c.valid_until));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Gift className="w-8 h-8 text-pink-500" />
          <h1 className="text-3xl font-bold">Mes Coupons & Réductions</h1>
        </div>

        {coupons.length === 0 ? (
          <Alert>
            <Gift className="h-4 w-4" />
            <AlertDescription>
              Vous n&apos;avez pas encore de coupons. Participez à nos jeux concours et promotions pour en obtenir !
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {availableCoupons.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Check className="w-6 h-6 text-green-500" />
                  Coupons Disponibles ({availableCoupons.length})
                </h2>
                <div className="grid gap-4">
                  {availableCoupons.map((coupon) => (
                    <Card
                      key={coupon.id}
                      className="p-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              {getSourceLabel(coupon.source)}
                            </Badge>
                            <Badge variant="secondary">Disponible</Badge>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {coupon.coupon_types.description}
                          </h3>
                          {coupon.coupon_types.type === 'discount_amount' && (
                            <p className="text-3xl font-bold text-green-600">
                              {coupon.coupon_types.value}€
                            </p>
                          )}
                          {coupon.coupon_types.type === 'discount_percentage' && (
                            <p className="text-3xl font-bold text-green-600">
                              -{coupon.coupon_types.value}%
                            </p>
                          )}
                          {coupon.coupon_types.type === 'free_delivery' && (
                            <p className="text-lg font-semibold text-green-600">
                              Livraison gratuite
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Valable jusqu&apos;au{' '}
                              {new Date(coupon.valid_until).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Non cumulable avec d&apos;autres réductions
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 font-mono text-center">
                            <div className="text-xs text-gray-500 mb-1">Code</div>
                            <div className="text-sm font-bold">{coupon.code}</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyCode(coupon.code)}
                            className="w-full"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copier
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {usedCoupons.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-600">
                  <Check className="w-6 h-6" />
                  Coupons Utilisés ({usedCoupons.length})
                </h2>
                <div className="grid gap-4">
                  {usedCoupons.map((coupon) => (
                    <Card key={coupon.id} className="p-6 bg-gray-50 opacity-75">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{getSourceLabel(coupon.source)}</Badge>
                            <Badge variant="secondary">Utilisé</Badge>
                          </div>
                          <h3 className="text-lg font-bold text-gray-700">
                            {coupon.coupon_types.description}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Utilisé le{' '}
                            {coupon.used_at
                              ? new Date(coupon.used_at).toLocaleDateString('fr-FR')
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right text-gray-500 font-mono text-sm">
                          {coupon.code}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {expiredCoupons.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-600">
                  <X className="w-6 h-6" />
                  Coupons Expirés ({expiredCoupons.length})
                </h2>
                <div className="grid gap-4">
                  {expiredCoupons.map((coupon) => (
                    <Card key={coupon.id} className="p-6 bg-red-50 opacity-75">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{getSourceLabel(coupon.source)}</Badge>
                            <Badge variant="destructive">Expiré</Badge>
                          </div>
                          <h3 className="text-lg font-bold text-gray-700">
                            {coupon.coupon_types.description}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Expiré le {new Date(coupon.valid_until).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
