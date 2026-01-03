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

interface Coupon {
  id: string;
  coupon_type_id: string;
  code: string;
  description: string;
  value: number;
  valid_until: string;
  is_active: boolean;
}

export default function AdminCoupons() {
  const [couponTypes, setCouponTypes] = useState<CouponType[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptyCoupon: Coupon = {
    id: '',
    coupon_type_id: '',
    code: '',
    description: '',
    value: 0,
    valid_until: '2026-12-31T23:59',
    is_active: true,
  };

  const fetchCouponTypes = async () => {
    const { data, error } = await supabase
      .from('coupon_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erreur chargement types: ${error.message}`);
      console.error('fetchCouponTypes error:', error);
    } else {
      if (!data || data.length === 0) {
        toast.error('Aucun type de coupon disponible. Veuillez contacter un administrateur.');
      }
      setCouponTypes(data || []);
    }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        id,
        coupon_type_id,
        code,
        description,
        value,
        valid_until,
        is_active,
        created_at,
        coupon_types!inner (
          type,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erreur chargement coupons: ${error.message}`);
      console.error('fetchCoupons error:', error);
      setCoupons([]);
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCouponTypes();
    fetchCoupons();
  }, []);

  const handleSave = async (coupon: Coupon) => {
    if (!coupon.coupon_type_id) {
      toast.error('Veuillez sélectionner un type de coupon');
      return;
    }

    if (!coupon.code) {
      toast.error('Veuillez entrer un code');
      return;
    }

    const payload = {
      coupon_type_id: coupon.coupon_type_id,
      code: coupon.code || '',
      description: coupon.description || '',
      value: coupon.value || 0,
      valid_until: coupon.valid_until + ':00+00',
      is_active: coupon.is_active !== undefined ? coupon.is_active : true,
    };

    const { error } = await supabase
      .from('coupons')
      .upsert(
        coupon.id ? { id: coupon.id, ...payload } : payload,
        { onConflict: 'id' }
      );

    if (error) {
      toast.error(`Erreur : ${error.message}`);
      console.error('Upsert error:', error);
      return;
    }

    toast.success(coupon.id ? 'Coupon mis à jour' : 'Coupon créé');
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
      toast.error(`Erreur : ${error.message}`);
    } else {
      toast.success('Coupon supprimé');
      fetchCoupons();
    }
  };

  const getTypeLabel = (typeString: string) => {
    switch (typeString) {
      case 'discount_amount': return 'Réduction montant';
      case 'discount_percentage': return 'Réduction pourcentage';
      case 'free_delivery': return 'Livraison offerte';
      default: return typeString;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Coupons</h1>
        <Button
          onClick={() => {
            if (couponTypes.length === 0) {
              toast.error('Impossible de créer un coupon: aucun type disponible');
              return;
            }
            setEditingCoupon(emptyCoupon);
            setIsCreating(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un coupon
        </Button>
      </div>

      {!loading && couponTypes.length === 0 && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-yellow-800 font-medium">Aucun type de coupon disponible</p>
            <p className="text-yellow-700 text-sm mt-1">
              Les types de coupons (remise montant, pourcentage, livraison) doivent être créés dans la table coupon_types.
              Contactez un administrateur système si ce message persiste.
            </p>
          </CardContent>
        </Card>
      )}

      {(editingCoupon || isCreating) && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label>Type de coupon *</Label>
                {couponTypes.length === 0 ? (
                  <div className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200">
                    Aucun type de coupon disponible. Impossible de créer un coupon.
                  </div>
                ) : (
                  <Select
                    value={editingCoupon?.coupon_type_id || ''}
                    onValueChange={(value) =>
                      setEditingCoupon(prev => prev ? { ...prev, coupon_type_id: value } : emptyCoupon)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {couponTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {getTypeLabel(type.type)} - {type.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
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
                <Label>Valeur</Label>
                <Input
                  type="number"
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
                  value={editingCoupon?.valid_until?.slice(0, 16) || ''}
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
                  disabled={couponTypes.length === 0 || !editingCoupon?.coupon_type_id || !editingCoupon?.code}
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
            <p className="text-gray-500 text-lg">Aucun coupon créé pour le moment.</p>
            <p className="text-gray-400 text-sm mt-2">Cliquez sur &quot;Ajouter un coupon&quot; pour commencer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(coupons || []).map((coupon: any) => (
            <Card key={coupon.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{coupon.code}</h3>
                    <p className="text-gray-600">{coupon.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-sm text-gray-500">
                        Type: {coupon.coupon_types ? getTypeLabel(coupon.coupon_types.type) : 'N/A'}
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
                      onClick={() => setEditingCoupon({
                        id: coupon.id,
                        coupon_type_id: coupon.coupon_type_id,
                        code: coupon.code,
                        description: coupon.description,
                        value: coupon.value,
                        valid_until: coupon.valid_until?.slice(0, 16) || '',
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
