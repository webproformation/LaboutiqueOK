'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ruler, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Measurements {
  user_size: number | null;
  height: number | null;
  weight: number | null;
  bust: number | null;
  waist: number | null;
  hips: number | null;
  inseam: number | null;
  shoe_size: string;
  notes: string;
}

export default function MeasurementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>({
    user_size: null,
    height: null,
    weight: null,
    bust: null,
    waist: null,
    hips: null,
    inseam: null,
    shoe_size: '',
    notes: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }
    loadMeasurements();
  }

  async function loadMeasurements() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [measurementsResult, profileResult] = await Promise.all([
        supabase
          .from('customer_measurements')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('user_size')
          .eq('id', user.id)
          .maybeSingle()
      ]);

      if (measurementsResult.error && measurementsResult.error.code !== 'PGRST116') {
        throw measurementsResult.error;
      }

      if (measurementsResult.data) {
        setMeasurements({
          user_size: profileResult.data?.user_size || null,
          height: measurementsResult.data.height,
          weight: measurementsResult.data.weight,
          bust: measurementsResult.data.bust,
          waist: measurementsResult.data.waist,
          hips: measurementsResult.data.hips,
          inseam: measurementsResult.data.inseam,
          shoe_size: measurementsResult.data.shoe_size || '',
          notes: measurementsResult.data.notes || ''
        });
      } else if (profileResult.data && 'user_size' in profileResult.data) {
        setMeasurements(prev => ({
          ...prev,
          user_size: profileResult.data?.user_size || null
        }));
      }
    } catch (error: any) {
      console.error('Error loading measurements:', error);
      toast.error('Erreur lors du chargement', {
        description: error.message,
        position: 'bottom-right'
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveMeasurements(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const dataToSave = {
        user_id: user.id,
        height: measurements.height,
        weight: measurements.weight,
        bust: measurements.bust,
        waist: measurements.waist,
        hips: measurements.hips,
        inseam: measurements.inseam,
        shoe_size: measurements.shoe_size || null,
        notes: measurements.notes || null,
        updated_at: new Date().toISOString()
      };

      const [measurementsResult, profileResult] = await Promise.all([
        supabase
          .from('customer_measurements')
          .upsert(dataToSave, {
            onConflict: 'user_id'
          })
          .select()
          .maybeSingle(),
        supabase
          .from('profiles')
          .update({ user_size: measurements.user_size })
          .eq('id', user.id)
      ]);

      if (measurementsResult.error) {
        console.error('Supabase error:', measurementsResult.error);
        throw new Error(measurementsResult.error.message || 'Erreur lors de l\'enregistrement');
      }

      if (profileResult.error) {
        console.error('Profile update error:', profileResult.error);
      }

      toast.success('Mensurations enregistrées avec succès', {
        description: 'Vos mesures ont été mises à jour',
        position: 'bottom-right'
      });
    } catch (error: any) {
      console.error('Error saving measurements:', error);
      toast.error('Erreur lors de l\'enregistrement', {
        description: error.message || 'Une erreur est survenue',
        position: 'bottom-right'
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37] bg-opacity-10 flex items-center justify-center">
                <Ruler className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <CardTitle>Mes Mensurations</CardTitle>
                <CardDescription>
                  Enregistrez vos mensurations pour des recommandations personnalisées
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveMeasurements} className="space-y-6">
              <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#C6A15B]/10 border border-[#D4AF37]/30 rounded-lg p-6 mb-6">
                <div className="space-y-3">
                  <Label htmlFor="user_size" className="text-lg font-semibold text-gray-900">
                    Ma taille habituelle ✨
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Cette information nous permet de vous montrer les produits compatibles avec votre taille
                  </p>
                  <select
                    id="user_size"
                    className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                    value={measurements.user_size || ''}
                    onChange={(e) => setMeasurements({ ...measurements, user_size: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value="">Sélectionnez votre taille</option>
                    {Array.from({ length: 21 }, (_, i) => 34 + i).map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Mensurations détaillées (optionnel)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="height">Taille (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      max="250"
                      placeholder="Ex: 170 cm"
                      value={measurements.height || ''}
                      onChange={(e) => setMeasurements({ ...measurements, height: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Poids (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      placeholder="Ex: 65 kg"
                      value={measurements.weight || ''}
                      onChange={(e) => setMeasurements({ ...measurements, weight: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bust">Tour de poitrine (cm)</Label>
                    <Input
                      id="bust"
                      type="number"
                      min="0"
                      max="200"
                      placeholder="Ex: 90 cm"
                      value={measurements.bust || ''}
                      onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="waist">Tour de taille (cm)</Label>
                    <Input
                      id="waist"
                      type="number"
                      min="0"
                      max="200"
                      placeholder="Ex: 70 cm"
                      value={measurements.waist || ''}
                      onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hips">Tour de hanches (cm)</Label>
                    <Input
                      id="hips"
                      type="number"
                      min="0"
                      max="200"
                      placeholder="Ex: 95 cm"
                      value={measurements.hips || ''}
                      onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inseam">Entrejambe (cm)</Label>
                    <Input
                      id="inseam"
                      type="number"
                      min="0"
                      max="150"
                      placeholder="Ex: 80 cm"
                      value={measurements.inseam || ''}
                      onChange={(e) => setMeasurements({ ...measurements, inseam: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="shoe_size">Pointure</Label>
                    <Input
                      id="shoe_size"
                      type="text"
                      placeholder="Ex: 38 ou 38.5"
                      value={measurements.shoe_size}
                      onChange={(e) => setMeasurements({ ...measurements, shoe_size: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="notes">Notes personnelles</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ajoutez des notes sur vos préférences de coupe, tailles spécifiques par marque, etc."
                    rows={4}
                    value={measurements.notes}
                    onChange={(e) => setMeasurements({ ...measurements, notes: e.target.value })}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Comment prendre vos mesures ?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>Tour de poitrine : Mesurez à l'endroit le plus fort</li>
                    <li>Tour de taille : Mesurez au niveau le plus étroit</li>
                    <li>Tour de hanches : Mesurez à l'endroit le plus fort</li>
                    <li>Entrejambe : Du haut de l'intérieur de la cuisse jusqu'au sol</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer mes mensurations'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
