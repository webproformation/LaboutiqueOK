"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Ruler, Save } from 'lucide-react';

interface Measurements {
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
  hips?: number;
  shoe_size?: number;
  preferred_size_bottom?: string;
  preferred_size_top?: string;
  body_type?: string;
}

export default function MeasurementsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>({});

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    }
  }, [user]);

  const fetchMeasurements = async () => {
    try {
      const { data, error } = await supabase
        .from('client_measurements')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setMeasurements({
          height: data.height,
          weight: data.weight,
          bust: data.bust,
          waist: data.waist,
          hips: data.hips,
          shoe_size: data.shoe_size,
          preferred_size_bottom: data.preferred_size_bottom,
          preferred_size_top: data.preferred_size_top,
          body_type: data.body_type,
        });
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des mensurations');
    } finally {
      setLoading(false);
    }
  };

  const saveMeasurements = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_measurements')
        .upsert({
          user_id: user.id,
          ...measurements,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Mensurations enregistrées avec succès');
    } catch (error: any) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Mensurations</h1>
        <p className="mt-2 text-gray-600">
          Renseignez vos mensurations pour obtenir des recommandations personnalisées
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-[#D4AF37]" />
            Informations générales
          </CardTitle>
          <CardDescription>
            Ces informations nous aident à vous recommander les produits adaptés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="height">Taille (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="Ex: 165"
                value={measurements.height || ''}
                onChange={(e) => setMeasurements({ ...measurements, height: parseInt(e.target.value) || undefined })}
              />
            </div>

            <div>
              <Label htmlFor="weight">Poids (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Ex: 60"
                value={measurements.weight || ''}
                onChange={(e) => setMeasurements({ ...measurements, weight: parseInt(e.target.value) || undefined })}
              />
            </div>

            <div>
              <Label htmlFor="bust">Tour de poitrine (cm)</Label>
              <Input
                id="bust"
                type="number"
                placeholder="Ex: 90"
                value={measurements.bust || ''}
                onChange={(e) => setMeasurements({ ...measurements, bust: parseInt(e.target.value) || undefined })}
              />
            </div>

            <div>
              <Label htmlFor="waist">Tour de taille (cm)</Label>
              <Input
                id="waist"
                type="number"
                placeholder="Ex: 70"
                value={measurements.waist || ''}
                onChange={(e) => setMeasurements({ ...measurements, waist: parseInt(e.target.value) || undefined })}
              />
            </div>

            <div>
              <Label htmlFor="hips">Tour de hanches (cm)</Label>
              <Input
                id="hips"
                type="number"
                placeholder="Ex: 95"
                value={measurements.hips || ''}
                onChange={(e) => setMeasurements({ ...measurements, hips: parseInt(e.target.value) || undefined })}
              />
            </div>

            <div>
              <Label htmlFor="shoe_size">Pointure</Label>
              <Input
                id="shoe_size"
                type="number"
                step="0.5"
                placeholder="Ex: 38"
                value={measurements.shoe_size || ''}
                onChange={(e) => setMeasurements({ ...measurements, shoe_size: parseFloat(e.target.value) || undefined })}
              />
            </div>

            <div>
              <Label htmlFor="preferred_size_bottom">Taille préférée bas</Label>
              <Select
                value={measurements.preferred_size_bottom || ''}
                onValueChange={(value) => setMeasurements({ ...measurements, preferred_size_bottom: value })}
              >
                <SelectTrigger id="preferred_size_bottom">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PETITES TAILLES (36 au 44)">PETITES TAILLES (36 au 44)</SelectItem>
                  <SelectItem value="GRANDES TAILLES (46 – 54)">GRANDES TAILLES (46 – 54)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preferred_size_top">Taille préférée hauts</Label>
              <Select
                value={measurements.preferred_size_top || ''}
                onValueChange={(value) => setMeasurements({ ...measurements, preferred_size_top: value })}
              >
                <SelectTrigger id="preferred_size_top">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PETITES TAILLES (36 au 44)">PETITES TAILLES (36 au 44)</SelectItem>
                  <SelectItem value="GRANDES TAILLES (46 – 54)">GRANDES TAILLES (46 – 54)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="body_type">Morphologie</Label>
              <Select
                value={measurements.body_type || ''}
                onValueChange={(value) => setMeasurements({ ...measurements, body_type: value })}
              >
                <SelectTrigger id="body_type">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A (Pyramide)</SelectItem>
                  <SelectItem value="V">V (Pyramide inversée)</SelectItem>
                  <SelectItem value="H">H (Rectangle)</SelectItem>
                  <SelectItem value="O">O (Ronde)</SelectItem>
                  <SelectItem value="X">X (Sablier)</SelectItem>
                  <SelectItem value="8">8 (Huit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveMeasurements}
              disabled={saving}
              className="bg-[#D4AF37] hover:bg-[#b8933d] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-[#F2F2E8] to-white border-[#D4AF37]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <Ruler className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Pourquoi renseigner mes mensurations ?</h3>
              <p className="text-sm text-gray-600">
                En renseignant vos mensurations, vous verrez apparaître un badge "Recommandé pour vous"
                sur les produits qui correspondent le mieux à votre morphologie et vos préférences.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
