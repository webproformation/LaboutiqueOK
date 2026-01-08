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

      const { data, error } = await supabase
        .from('customer_measurements')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setMeasurements({
          height: data.height,
          weight: data.weight,
          bust: data.bust,
          waist: data.waist,
          hips: data.hips,
          inseam: data.inseam,
          shoe_size: data.shoe_size || '',
          notes: data.notes || ''
        });
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

      const { data, error } = await supabase
        .from('customer_measurements')
        .upsert(dataToSave, {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Erreur lors de l\'enregistrement');
      }

      toast.success('Mensurations enregistrées avec succès', {
        description: 'Vos mesures ont été mises à jour',
        position: 'bottom-right'
      });

      if (data) {
        setMeasurements({
          height: data.height,
          weight: data.weight,
          bust: data.bust,
          waist: data.waist,
          hips: data.hips,
          inseam: data.inseam,
          shoe_size: data.shoe_size || '',
          notes: data.notes || ''
        });
      }
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
                    placeholder="Ex: 78 cm"
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes personnelles</Label>
                <Textarea
                  id="notes"
                  placeholder="Ajoutez des notes sur vos préférences de coupe, tailles spécifiques par marque, etc."
                  rows={4}
                  value={measurements.notes}
                  onChange={(e) => setMeasurements({ ...measurements, notes: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Comment prendre vos mesures ?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Tour de poitrine : Mesurez à l'endroit le plus fort</li>
                  <li>Tour de taille : Mesurez au niveau le plus étroit</li>
                  <li>Tour de hanches : Mesurez à l'endroit le plus fort</li>
                  <li>Entrejambe : Du haut de l'intérieur de la cuisse jusqu'au sol</li>
                </ul>
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
