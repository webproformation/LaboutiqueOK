"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Ticket, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useCoupons, UserCoupon } from '@/hooks/use-coupons';

interface CouponSelectorProps {
  selectedCouponId: string | null;
  onSelectCoupon: (coupon: UserCoupon | null) => void;
  subtotal: number;
}

export function CouponSelector({ selectedCouponId, onSelectCoupon, subtotal }: CouponSelectorProps) {
  const { coupons, loading } = useCoupons();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectCoupon = (couponId: string) => {
    if (couponId === selectedCouponId) {
      onSelectCoupon(null);
    } else {
      const coupon = coupons.find(c => c.id === couponId);
      if (coupon) {
        onSelectCoupon(coupon);
      }
    }
  };

  const handleRemoveCoupon = () => {
    onSelectCoupon(null);
  };

  if (loading || coupons.length === 0) {
    return null;
  }

  const selectedCoupon = coupons.find(c => c.id === selectedCouponId);

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="w-full justify-between text-[#b8933d] hover:text-[#a07c2f] hover:bg-[#b8933d]/5 p-3"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="font-medium">Utiliser un coupon</span>
            {selectedCouponId && (
              <Badge variant="secondary" className="ml-2 bg-[#b8933d]/10 text-[#b8933d]">
                1 appliqué
              </Badge>
            )}
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {selectedCoupon && selectedCoupon.coupon && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    {selectedCoupon.coupon.description}
                  </p>
                  <p className="text-xs text-green-700">Code: {selectedCoupon.coupon.code}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <RadioGroup value={selectedCouponId || ''} onValueChange={handleSelectCoupon}>
            <div className="space-y-2">
              {coupons.map((coupon) => {
                if (!coupon.coupon) return null;

                const isSelected = selectedCouponId === coupon.id;
                const couponData = coupon.coupon;

                return (
                  <div
                    key={coupon.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#b8933d] bg-[#b8933d]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectCoupon(coupon.id)}
                  >
                    <RadioGroupItem value={coupon.id} id={coupon.id} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={coupon.id} className="cursor-pointer">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-[#b8933d]" />
                              <p className="font-semibold text-sm text-gray-900">
                                {couponData.description}
                              </p>
                            </div>
                            <div className="text-right">
                              {(couponData.discount_type === 'fixed' || couponData.type === 'discount_amount') && (
                                <p className="text-lg font-bold text-[#b8933d]">-{couponData.discount_value || couponData.value}€</p>
                              )}
                              {(couponData.discount_type === 'percentage' || couponData.type === 'discount_percentage') && (
                                <p className="text-lg font-bold text-[#b8933d]">-{couponData.discount_value || couponData.value}%</p>
                              )}
                              {(couponData.discount_type === 'free_shipping' || couponData.type === 'free_delivery') && (
                                <Badge className="bg-[#b8933d] hover:bg-[#a07c2f]">
                                  Livraison offerte
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">Code: {couponData.code}</p>
                          {coupon.valid_until && (
                            <p className="text-xs text-gray-500">
                              Valable jusqu'au {new Date(coupon.valid_until).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
