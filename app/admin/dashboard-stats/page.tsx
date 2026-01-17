'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Diamond, MessageCircleHeart, Package, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardStat {
  id: string;
  diamonds_found: number;
  reviews_validated: number;
  packages_sent: number;
  updated_at: string;
}

export default function AdminDashboardStatsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<DashboardStat | null>(null);

  const [diamondsFound, setDiamondsFound] = useState(0);
  const [reviewsValidated, setReviewsValidated] = useState(0);
  const [packagesSent, setPackagesSent] = useState(0);

  useEffect(() => {
    if (profile && !profile.is_admin) {
      router.push('/');
      return;
    }
    if (profile) {
      loadStats();
    }
  }, [profile, router]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStats(data);
        setDiamondsFound(data.diamonds_found);
        setReviewsValidated(data.reviews_validated);
        setPackagesSent(data.packages_sent);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const statsData = {
        diamonds_found: diamondsFound,
        reviews_validated: reviewsValidated,
        packages_sent: packagesSent,
        updated_at: new Date().toISOString(),
      };

      if (stats) {
        const { error } = await supabase
          .from('dashboard_stats')
          .update(statsData)
          .eq('id', stats.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dashboard_stats')
          .insert(statsData);

        if (error) throw error;
      }

      toast.success('Statistiques mises à jour avec succès');
      loadStats();
    } catch (error) {
      console.error('Error saving stats:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
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
        <h2 className="text-3xl font-bold mb-2">Gestion des Statistiques Dashboard</h2>
        <p className="text-gray-600">
          Modifiez les compteurs affichés sur la page d'accueil dans la section "Nos Petits Bonheurs en Chiffres"
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compteurs Actuels</CardTitle>
          <CardDescription>
            Ces valeurs sont affichées en temps réel sur la page d'accueil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diamondsFound" className="flex items-center gap-2">
                  <Diamond className="h-4 w-4 text-[#D4AF37]" />
                  💎 Diamants dénichés
                </Label>
                <Input
                  id="diamondsFound"
                  type="number"
                  min="0"
                  value={diamondsFound}
                  onChange={(e) => setDiamondsFound(Number(e.target.value))}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500">
                  Nombre total de diamants trouvés par les clientes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewsValidated" className="flex items-center gap-2">
                  <MessageCircleHeart className="h-4 w-4 text-pink-500" />
                  ✨ Mots doux reçus
                </Label>
                <Input
                  id="reviewsValidated"
                  type="number"
                  min="0"
                  value={reviewsValidated}
                  onChange={(e) => setReviewsValidated(Number(e.target.value))}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500">
                  Total des avis validés dans le Livre d'Or
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packagesSent" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-500" />
                  📦 Colis chouchoutés et expédiés
                </Label>
                <Input
                  id="packagesSent"
                  type="number"
                  min="0"
                  value={packagesSent}
                  onChange={(e) => setPackagesSent(Number(e.target.value))}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500">
                  Total historique des colis envoyés
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/5 to-white">
        <CardHeader>
          <CardTitle className="text-[#D4AF37]">📊 Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-[#D4AF37] mb-1">
                {(diamondsFound || 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-sm text-gray-600">Diamants dénichés</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-pink-500 mb-1">
                {(reviewsValidated || 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-sm text-gray-600">Mots doux reçus</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-emerald-500 mb-1">
                {(packagesSent || 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-sm text-gray-600">Colis expédiés</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
