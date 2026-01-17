'use client'

import { useGuestbook } from '@/hooks/use-guestbook'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Crown, Gem, Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useState } from 'react'

export default function AdminGuestbookPage() {
  const { entries, loading, refetch } = useGuestbook(100, 'all')
  const [responses, setResponses] = useState<Record<string, string>>({})

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('guestbook_entries')
      .update({ status: 'approved' })
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors de l\'approbation')
      console.error(error)
      return
    }

    toast.success('Avis approuvé')
    refetch()
  }

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('guestbook_entries')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors du rejet')
      console.error(error)
      return
    }

    toast.success('Avis rejeté')
    refetch()
  }

  const handleResponse = async (id: string) => {
    const response = responses[id]
    if (!response || !response.trim()) {
      toast.error('Veuillez saisir une réponse')
      return
    }

    const { error } = await supabase
      .from('guestbook_entries')
      .update({ admin_response: response })
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors de l\'ajout de la réponse')
      console.error(error)
      return
    }

    toast.success('Réponse ajoutée')
    setResponses(prev => ({ ...prev, [id]: '' }))
    refetch()
  }

  const electAmbassador = async (entry: any) => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysToMonday)
    nextMonday.setHours(0, 0, 0, 0)

    const weekEnd = new Date(nextMonday)
    weekEnd.setDate(nextMonday.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const { error: ambassadorError } = await supabase
      .from('ambassador_weekly')
      .insert({
        user_id: entry.user_id,
        entry_id: entry.id,
        week_start: nextMonday.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        hearts_count: entry.hearts_count,
        reward_amount: 5.00,
        reward_credited: false
      })

    if (ambassadorError) {
      toast.error('Erreur lors de l\'élection')
      console.error(ambassadorError)
      return
    }

    const { error: updateError } = await supabase
      .from('guestbook_entries')
      .update({
        is_ambassador: true,
        ambassador_week: nextMonday.toISOString().split('T')[0]
      })
      .eq('id', entry.id)

    if (updateError) {
      toast.error('Erreur lors de la mise à jour')
      console.error(updateError)
      return
    }

    const { error: walletError } = await supabase.rpc('credit_wallet', {
      p_user_id: entry.user_id,
      p_amount: 5.00,
      p_transaction_type: 'ambassador_reward',
      p_description: 'Récompense Ambassadrice de la Semaine'
    })

    if (walletError) {
      console.error('Wallet credit error:', walletError)
    }

    toast.success('Ambassadrice élue ! 5€ crédités sur sa cagnotte')
    refetch()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approuvé</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>
      default:
        return <Badge variant="secondary">En attente</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion Livre d&apos;Or</h1>
          <p className="text-gray-600 mt-2">
            {entries.filter(e => e.status === 'pending').length} avis en attente de validation
          </p>
        </div>
        <Button onClick={refetch}>
          Actualiser
        </Button>
      </div>

      <div className="grid gap-6">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <span>{entry.customer_name}</span>
                  {entry.is_ambassador && (
                    <Crown className="h-5 w-5 text-[#C6A15B] fill-[#C6A15B]" />
                  )}
                  {getStatusBadge(entry.status)}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {entry.customer_photo_url && (
                  <div className="md:col-span-1">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={entry.customer_photo_url}
                        alt={entry.customer_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className={entry.customer_photo_url ? "md:col-span-2" : "md:col-span-3"}>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Commande : {entry.order_number}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((p) => (
                            <Gem
                              key={p}
                              className={`h-4 w-4 ${
                                p <= entry.rating ? 'fill-[#C6A15B] text-[#C6A15B]' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({entry.rating}/5)
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-700 whitespace-pre-wrap">{entry.message}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span className="font-medium">{entry.hearts_count} cœurs</span>
                      </div>
                      <div className="text-gray-500">
                        User ID: {entry.user_id.substring(0, 8)}...
                      </div>
                    </div>

                    {entry.admin_response && (
                      <div className="bg-[#C6A15B]/10 rounded-lg p-4 border-l-4 border-[#C6A15B]">
                        <p className="text-sm font-semibold text-[#C6A15B] mb-2">
                          Votre réponse :
                        </p>
                        <p className="text-sm text-gray-700">{entry.admin_response}</p>
                      </div>
                    )}

                    {entry.status === 'approved' && !entry.admin_response && (
                      <div className="space-y-2">
                        <Label htmlFor={`response-${entry.id}`}>
                          Ajouter une réponse (optionnel)
                        </Label>
                        <Textarea
                          id={`response-${entry.id}`}
                          value={responses[entry.id] || ''}
                          onChange={(e) => setResponses(prev => ({
                            ...prev,
                            [entry.id]: e.target.value
                          }))}
                          placeholder="Merci pour votre retour..."
                          rows={3}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleResponse(entry.id)}
                        >
                          Ajouter la réponse
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {entry.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(entry.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(entry.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </>
                      )}

                      {entry.status === 'approved' && !entry.is_ambassador && entry.hearts_count >= 5 && (
                        <Button
                          size="sm"
                          onClick={() => electAmbassador(entry)}
                          className="bg-[#C6A15B] hover:bg-[#B59149]"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Élire Ambassadrice
                        </Button>
                      )}

                      {entry.status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(entry.id)}
                        >
                          Réactiver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {entries.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Aucun avis dans le Livre d&apos;Or pour le moment
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
