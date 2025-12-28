"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface CouponType {
  id: string;
  code: string;
  type: string;
  value: number;
  description: string;
  valid_until: string;
  is_active: boolean;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<CouponType | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptyCoupon: CouponType = {
    id: '',
    code: '',
    type: 'discount_amount',
    value: 0,
    description: '',
    valid_until: '2026-12-31 23:59:59+00',
    is_active: true,
  };

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupon_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async (coupon: CouponType) => {
    if (coupon.id) {
      const { error } = await supabase
        .from('coupon_types')
        .update({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description,
          valid_until: coupon.valid_until,
          is_active: coupon.is_active,
        })
        .eq('id', coupon.id);

      if (error) {
        toast.error('Erreur lors de la mise à jour');
      } else {
        toast.success('Coupon mis à jour');
        setEditingCoupon(null);
        fetchCoupons();
      }
    } else {
      const { error } = await supabase
        .from('coupon_types')
        .insert({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description,
          valid_until: coupon.valid_until,
          is_active: coupon.is_active,
        });

      if (error) {
        toast.error('Erreur lors de la création');
      } else {
        toast.success('Coupon créé');
        setIsCreating(false);
        setEditingCoupon(null);
        fetchCoupons();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce type de coupon ?')) return;

    const { error } = await supabase
      .from('coupon_types')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Coupon supprimé');
      fetchCoupons();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Coupons</h1>
        <Button
          onClick={() => {
            setEditingCoupon(emptyCoupon);
            setIsCreating(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un coupon
        </Button>
      </div>

      {(editingCoupon || isCreating) && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label>Code</Label>
                <Input
                  value={editingCoupon?.code || ''}
                  onChange={(e) =>
                    setEditingCoupon(prev => ({ ...prev!, code: e.target.value }))
                  }
                  placeholder="EX: PROMO10"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={editingCoupon?.type}
                  onValueChange={(value) =>
                    setEditingCoupon(prev => ({ ...prev!, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount_amount">Réduction montant</SelectItem>
                    <SelectItem value="discount_percentage">Réduction pourcentage</SelectItem>
                    <SelectItem value="free_delivery">Livraison offerte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valeur</Label>
                <Input
                  type="number"
                  value={editingCoupon?.value || 0}
                  onChange={(e) =>
                    setEditingCoupon(prev => ({ ...prev!, value: parseFloat(e.target.value) }))
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingCoupon?.description || ''}
                  onChange={(e) =>
                    setEditingCoupon(prev => ({ ...prev!, description: e.target.value }))
                  }
                  placeholder="Ex: 10€ de réduction"
                />
              </div>
              <div>
                <Label>Valide jusqu&apos;au</Label>
                <Input
                  type="datetime-local"
                  value={editingCoupon?.valid_until.slice(0, 16)}
                  onChange={(e) =>
                    setEditingCoupon(prev => ({ ...prev!, valid_until: e.target.value + ':00+00' }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingCoupon?.is_active}
                  onCheckedChange={(checked) =>
                    setEditingCoupon(prev => ({ ...prev!, is_active: checked }))
                  }
                />
                <Label>Actif</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => editingCoupon && handleSave(editingCoupon)}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCoupon(null);
                    setIsCreating(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{coupon.code}</h3>
                    <p className="text-gray-600">{coupon.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-sm text-gray-500">
                        Type: {coupon.type === 'discount_amount' ? 'Montant' : coupon.type === 'discount_percentage' ? 'Pourcentage' : 'Livraison'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Valeur: {coupon.value}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        coupon.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {coupon.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCoupon(coupon)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
