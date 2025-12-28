"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Gift, Users, Check } from 'lucide-react';

interface ReferralData {
  code: string;
  total_referrals: number;
}

interface Referral {
  id: string;
  referred_id: string;
  status: string;
  completed_at: string | null;
  created_at: string;
}

export default function ReferralPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string>('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      let { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (codeError && codeError.code !== 'PGRST116') {
        throw codeError;
      }

      if (!codeData) {
        const { data: newCode } = await supabase.rpc('generate_referral_code_for_user', {
          p_user_id: user?.id
        });

        if (newCode) {
          setReferralCode(newCode);

          const { data: refreshedData } = await supabase
            .from('referral_codes')
            .select('*')
            .eq('user_id', user?.id)
            .single();

          if (refreshedData) {
            setTotalReferrals(refreshedData.total_referrals);
          }
        }
      } else {
        setReferralCode(codeData.code);
        setTotalReferrals(codeData.total_referrals);
      }

      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      setReferrals(referralsData || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données de parrainage');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Code copié dans le presse-papier');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = `${window.location.origin}/auth/register?ref=${referralCode}`;

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Lien copié dans le presse-papier');
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
        <h1 className="text-3xl font-bold text-gray-900">Parrainage</h1>
        <p className="mt-2 text-gray-600">
          Parrainez vos amies et recevez chacune 5€ de réduction
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#D4AF37] to-[#b8933d] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Votre code</p>
                <p className="text-2xl font-bold mt-1">{referralCode}</p>
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={copyCode}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Parrainages réussis</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalReferrals}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F2F2E8] flex items-center justify-center">
                <Users className="h-6 w-6 text-[#D4AF37]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gains totaux</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalReferrals * 5}€</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F2F2E8] flex items-center justify-center">
                <Gift className="h-6 w-6 text-[#D4AF37]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche ?</CardTitle>
          <CardDescription>
            Suivez ces 3 étapes simples pour parrainer vos amies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Partagez votre code</h3>
              <p className="text-sm text-gray-600">
                Envoyez votre code de parrainage à vos amies
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Elles s'inscrivent</h3>
              <p className="text-sm text-gray-600">
                Vos amies créent un compte avec votre code
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Vous gagnez 5€ chacune</h3>
              <p className="text-sm text-gray-600">
                Vous recevez toutes les deux un bon de 5€
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partagez votre lien</CardTitle>
          <CardDescription>
            Copiez ce lien pour faciliter l'inscription de vos amies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={copyShareUrl}
              className="bg-[#D4AF37] hover:bg-[#b8933d] text-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
          </div>
        </CardContent>
      </Card>

      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des parrainages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {referral.status === 'completed' ? 'Parrainage réussi' : 'En attente'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    referral.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {referral.status === 'completed' ? '+5€' : 'En attente'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
