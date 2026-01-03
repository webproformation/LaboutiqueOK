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

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  value: number;
  valid_until: string;
  is_active: boolean;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptyCoupon: Coupon = {
    id: '',
    code: '',
    description: '',
    discount_type: 'amount',
    value: 0,
    valid_until: '2026-12-31T23:59',
    is_active: true,
  };

  const fetchCoupons = async () => {
    setLoading(true);
    console.log('='.repeat(80));
    console.log('🔍 FETCHING COUPONS - Project: qcqbtmvbvipsxwjlgjvk');

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      toast.error(`Erreur: ${error.message}`);
      setCoupons([]);
    } else {
      console.log('✅ Coupons loaded:', data?.length || 0);
      setCoupons(data || []);
    }
    console.log('='.repeat(80));
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async (coupon: Coupon) => {
    if (!coupon.code.trim()) {
      toast.error('Code obligatoire');
      return;
    }

    if (!coupon.value || coupon.value <= 0) {
      toast.error('Valeur doit être supérieure à 0');
      return;
    }

    if (!coupon.discount_type) {
      toast.error('Type de remise obligatoire');
      return;
    }

    const validUntilFormatted = coupon.valid_until
      ? new Date(coupon.valid_until).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      code: coupon.code.trim().toUpperCase(),
      description: coupon.description.trim() || '',
      discount_type: coupon.discount_type,
      value: Number(coupon.value),
      valid_until: validUntilFormatted,
      is_active: coupon.is_active ?? true,
    };

    console.log('💾 Saving coupon:', payload);

    const { error } = coupon.id
      ? await supabase.from('coupons').update(payload).eq('id', coupon.id)
      : await supabase.from('coupons').insert(payload);

    if (error) {
      console.error('❌ Save error:', error);
      toast.error(`Erreur: ${error.message}`);
      return;
    }

    toast.success(coupon.id ? 'Coupon modifié' : 'Coupon créé');
    setEditingCoupon(null);
    setIsCreating(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce coupon ?')) return;

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(`Erreur: ${error.message}`);
    } else {
      toast.success('Coupon supprimé');
      fetchCoupons();
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'percent' ? 'Pourcentage' : 'Montant fixe';
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
                <Label>Code *</Label>
                <Input
                  value={editingCoupon?.code || ''}
                  onChange={(e) =>
                    setEditingCoupon(prev => prev ? { ...prev, code: e.target.value.toUpperCase() } : emptyCoupon)
                  }
                  placeholder="EX: PROMO10"
                />
              </div>

              <div>
                <Label>Type de remise *</Label>
                <Select
                  value={editingCoupon?.discount_type || 'amount'}
                  onValueChange={(value) =>
                    setEditingCoupon(prev => prev ? { ...prev, discount_type: value } : emptyCoupon)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Montant fixe</SelectItem>
                    <SelectItem value="percent">Pourcentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valeur *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingCoupon?.value || 0}
                  onChange={(e) =>
                    setEditingCoupon(prev => prev ? { ...prev, value: parseFloat(e.target.value) || 0 } : emptyCoupon)
                  }
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={editingCoupon?.description || ''}
                  onChange={(e) =>
                    setEditingCoupon(prev => prev ? { ...prev, description: e.target.value } : emptyCoupon)
                  }
                  placeholder="Ex: 10€ de réduction"
                />
              </div>

              <div>
                <Label>Valide jusqu&apos;au</Label>
                <Input
                  type="datetime-local"
                  value={(editingCoupon?.valid_until && typeof editingCoupon.valid_until === 'string') ? editingCoupon.valid_until.slice(0, 16) : ''}
                  onChange={(e) =>
                    setEditingCoupon(prev => prev ? { ...prev, valid_until: e.target.value } : emptyCoupon)
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingCoupon?.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setEditingCoupon(prev => prev ? { ...prev, is_active: checked } : emptyCoupon)
                  }
                />
                <Label>Actif</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => editingCoupon && handleSave(editingCoupon)}
                  disabled={!editingCoupon?.code || !editingCoupon?.discount_type}
                >
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
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">Aucun coupon créé</p>
            <p className="text-gray-400 text-sm mt-2">Cliquez sur &quot;Ajouter un coupon&quot; pour commencer</p>
          </CardContent>
        </Card>
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
                        Type: {getTypeLabel(coupon.discount_type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Valeur: {coupon.value}{coupon.discount_type === 'percent' ? '%' : '€'}
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
                      onClick={() => setEditingCoupon({
                        id: coupon.id,
                        code: coupon.code,
                        description: coupon.description,
                        discount_type: coupon.discount_type,
                        value: coupon.value,
                        valid_until: (coupon.valid_until && typeof coupon.valid_until === 'string') ? coupon.valid_until.slice(0, 16) : '',
                        is_active: coupon.is_active,
                      })}
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
