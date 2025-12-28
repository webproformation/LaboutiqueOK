"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Ticket, X, Tag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  coupon_type_id: string;
  source: string;
  is_used: boolean;
  used_at: string | null;
  obtained_at: string;
  valid_until: string;
  coupon_types: CouponType;
}

interface CouponSelectorProps {
  selectedCouponId: string | null;
  onSelectCoupon: (coupon: UserCoupon | null) => void;
  subtotal: number;
}

export default function CouponSelector({ selectedCouponId, onSelectCoupon, subtotal }: CouponSelectorProps) {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadCoupons();
  }, [user]);

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
      .eq('is_used', false)
      .gte('valid_until', new Date().toISOString())
      .order('obtained_at', { ascending: false });

    if (data) {
      setCoupons(data as unknown as UserCoupon[]);
    }

    setLoading(false);
  };

  const handleSelectCoupon = (couponId: string) => {
    if (selectedCouponId === couponId) {
      onSelectCoupon(null);
    } else {
      const coupon = coupons.find(c => c.id === couponId);
      if (coupon) {
        onSelectCoupon(coupon);
      }
    }
  };

  if (loading || coupons.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4">
      <Button
        variant="ghost"
        className="w-full justify-between text-[#b8933d] hover:text-[#a07c2f] hover:bg-[#b8933d]/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          <span className="font-medium">Utiliser un coupon</span>
          {selectedCouponId && (
            <Badge variant="secondary" className="ml-2">
              1 appliqué
            </Badge>
          )}
        </div>
        <span>{isExpanded ? '−' : '+'}</span>
      </Button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <RadioGroup
            value={selectedCouponId || ''}
            onValueChange={handleSelectCoupon}
          >
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedCouponId === coupon.id
                    ? 'border-[#b8933d] bg-[#b8933d]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelectCoupon(coupon.id)}
              >
                <RadioGroupItem value={coupon.id} id={coupon.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={coupon.id} className="cursor-pointer">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#b8933d]" />
                        <p className="font-semibold text-sm text-gray-900">
                          {coupon.coupon_types.description}
                        </p>
                      </div>
                      {coupon.coupon_types.type === 'discount_amount' && (
                        <p className="text-lg font-bold text-[#b8933d]">
                          -{coupon.coupon_types.value}€
                        </p>
                      )}
                      {coupon.coupon_types.type === 'discount_percentage' && (
                        <p className="text-lg font-bold text-[#b8933d]">
                          -{coupon.coupon_types.value}%
                        </p>
                      )}
                      {coupon.coupon_types.type === 'free_delivery' && (
                        <p className="text-sm font-semibold text-[#b8933d]">
                          Livraison gratuite
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Code: {coupon.code}
                      </p>
                      <p className="text-xs text-gray-500">
                        Valable jusqu&apos;au {new Date(coupon.valid_until).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>

          {selectedCouponId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectCoupon(null)}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Retirer le coupon
            </Button>
          )}

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-xs text-yellow-800">
              Les coupons ne sont pas cumulables avec d&apos;autres réductions en cours
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
