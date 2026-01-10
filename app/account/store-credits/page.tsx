'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, PiggyBank, CheckCircle, Clock, Euro } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StoreCredit {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  order_id: string | null;
}

export default function StoreCreditPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [storeCredits, setStoreCredits] = useState<StoreCredit[]>([]);

  useEffect(() => {
    if (user) {
      loadStoreCredits();
    }
  }, [user]);

  const loadStoreCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('store_credits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStoreCredits(data || []);
    } catch (error) {
      console.error('Error loading store credits:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAvailable = () => {
    return storeCredits
      .filter((c) => c.status === 'available')
      .reduce((sum, c) => sum + Number(c.amount), 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle className="h-3 w-3" />
            Disponible
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
            <CheckCircle className="h-3 w-3" />
            Utilisé
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            Expiré
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Mes Avoirs</h2>
        <p className="text-gray-600">
          Vos crédits boutique utilisables sur vos prochaines commandes
        </p>
      </div>

      <Card className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] border-[#b8933d]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Avoirs Disponibles</h3>
                <p className="text-sm text-white/90">À utiliser lors de votre prochaine commande</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-white">
                {getTotalAvailable().toFixed(2)}€
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des Avoirs</CardTitle>
          <CardDescription>Tous vos avoirs et leur statut</CardDescription>
        </CardHeader>
        <CardContent>
          {storeCredits.length === 0 ? (
            <div className="text-center py-12">
              <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun avoir disponible</h3>
              <p className="text-gray-600">
                Vos avoirs boutique apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {storeCredits.map((credit) => (
                <div
                  key={credit.id}
                  className={`border rounded-lg p-4 ${
                    credit.status === 'available'
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {Number(credit.amount).toFixed(2)}€
                        </h3>
                        {getStatusBadge(credit.status)}
                      </div>
                      <p className="text-sm text-gray-600">{credit.reason}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 pt-3 border-t">
                    <p>
                      <span className="font-medium">Créé le:</span>{' '}
                      {format(new Date(credit.created_at), 'd MMMM yyyy', { locale: fr })}
                    </p>
                    {credit.expires_at && (
                      <p>
                        <span className="font-medium">
                          {credit.status === 'available' ? 'Expire le:' : 'Expiré le:'}
                        </span>{' '}
                        {format(new Date(credit.expires_at), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    )}
                    {credit.used_at && (
                      <p>
                        <span className="font-medium">Utilisé le:</span>{' '}
                        {format(new Date(credit.used_at), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    )}
                    {credit.order_id && (
                      <p>
                        <span className="font-medium">Commande:</span> #{credit.order_id}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
