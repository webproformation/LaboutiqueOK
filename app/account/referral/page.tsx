'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Copy, Check, Gift, Loader2, Euro } from 'lucide-react'
import { toast } from 'sonner'

interface ReferralCode {
  id: string
  user_id: string
  code: string
  usage_count: number
  reward_type: string
  reward_value: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

interface ReferralUse {
  id: string
  referred_user_id: string
  order_id: string
  created_at: string
  sponsor_credited: boolean
  referred_credited: boolean
  profiles: {
    first_name: string
    last_name: string
  } | null
}

export default function ReferralPage() {
  const { profile } = useAuth()
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null)
  const [referralUses, setReferralUses] = useState<ReferralUse[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      loadReferralData()
    }
  }, [profile])

  async function loadReferralData() {
    if (!profile?.id) return

    try {
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (codeError && codeError.code !== 'PGRST116') throw codeError

      if (!codeData) {
        await createReferralCode()
      } else {
        setReferralCode(codeData)
        await loadReferralUses(codeData.code)
      }
    } catch (error) {
      console.error('Error loading referral data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function createReferralCode() {
    if (!profile?.id) return

    const firstName = profile.first_name || 'USER'
    const code = `${firstName.toUpperCase().substring(0, 4)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: profile.id,
        code,
        usage_count: 0,
        reward_type: 'wallet_credit',
        reward_value: 5.00,
        is_active: true,
        expires_at: null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating referral code:', error)
      toast.error('Erreur lors de la création du code')
      return
    }

    setReferralCode(data)
    toast.success('Votre code de parrainage a été créé !')
  }

  async function loadReferralUses(code: string) {
    const { data, error } = await supabase
      .from('referral_uses')
      .select('id, referred_user_id, order_id, created_at, sponsor_credited, referred_credited')
      .eq('referral_code', code)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading referral uses:', error)
      return
    }

    const usesWithProfiles = await Promise.all((data || []).map(async (use) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', use.referred_user_id)
        .maybeSingle()

      return {
        ...use,
        profiles: profileData
      }
    }))

    setReferralUses(usesWithProfiles)
  }

  const handleCopyCode = () => {
    if (!referralCode) return

    navigator.clipboard.writeText(referralCode.code)
    setCopied(true)
    toast.success('Code copié dans le presse-papier !')

    setTimeout(() => setCopied(false), 2000)
  }

  const rewardValue = referralCode?.reward_value || 5
  const totalEarned = referralUses.filter(u => u.sponsor_credited).length * rewardValue

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Parrainage</h1>
        <p className="text-gray-600">
          Partagez votre code et gagnez {rewardValue}€ pour chaque amie parrainée
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#D4AF37] to-[#C6A15B] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">Total gagné</p>
                <p className="text-3xl font-bold">{totalEarned}€</p>
              </div>
              <Euro className="h-12 w-12 text-white/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">Amies parrainées</p>
                <p className="text-3xl font-bold">{referralCode?.usage_count || 0}</p>
              </div>
              <Users className="h-12 w-12 text-white/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">En attente</p>
                <p className="text-3xl font-bold">
                  {referralUses.filter(u => !u.sponsor_credited).length * rewardValue}€
                </p>
              </div>
              <Gift className="h-12 w-12 text-white/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#D4AF37]" />
            Votre code de parrainage
          </CardTitle>
          <CardDescription>
            Partagez ce code avec vos amies. Elles recevront 5€ de réduction sur leur première commande, et vous recevrez 5€ sur votre porte-monnaie dès leur achat validé.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {referralCode ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={referralCode.code}
                  readOnly
                  className="text-2xl font-bold text-center text-[#D4AF37] bg-gray-50"
                />
                <Button
                  onClick={handleCopyCode}
                  className="bg-[#D4AF37] hover:bg-[#C6A15B]"
                  size="lg"
                >
                  {copied ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {referralCode.expires_at && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                  Code valable jusqu'au {new Date(referralCode.expires_at).toLocaleDateString('fr-FR')}
                </div>
              )}

              <div className="bg-[#D4AF37]/10 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900">Comment ça marche ?</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Partagez votre code avec vos amies</li>
                  <li>Elles utilisent votre code lors du paiement</li>
                  <li>Elles reçoivent {referralCode.reward_value}€ de réduction immédiate</li>
                  <li>Vous recevez {referralCode.reward_value}€ sur votre porte-monnaie après validation de leur commande</li>
                  <li>Parrainez autant d'amies que vous le souhaitez !</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Aucun code de parrainage trouvé</p>
              <Button onClick={createReferralCode}>
                Créer mon code de parrainage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {referralUses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#D4AF37]" />
              Historique des parrainages
            </CardTitle>
            <CardDescription>
              Liste de toutes les personnes qui ont utilisé votre code
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {referralUses.map((use) => (
                <div
                  key={use.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {use.profiles?.first_name} {use.profiles?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(use.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    {use.sponsor_credited ? (
                      <Badge className="bg-green-500">{rewardValue}€ crédités</Badge>
                    ) : (
                      <Badge variant="secondary">En attente</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
