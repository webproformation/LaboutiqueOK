'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Package, CheckCircle2, XCircle, AlertCircle, Euro, Gift, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReturnRequest {
  id: string
  user_id: string
  order_id: string
  status: string
  reason: string
  gift_returned: boolean
  total_refund_amount: number
  wallet_amount_credited: number
  admin_notes: string | null
  created_at: string
  updated_at: string
  profiles: {
    first_name: string
    last_name: string
    email: string
  }
  return_items: Array<{
    id: string
    product_name: string
    quantity: number
    refund_amount: number
  }>
}

export default function ReturnsManagementPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadReturns()
  }, [filter])

  async function loadReturns() {
    setLoading(true)
    try {
      let query = supabase
        .from('return_requests')
        .select(`
          id,
          user_id,
          order_id,
          status,
          reason,
          gift_returned,
          total_refund_amount,
          wallet_amount_credited,
          admin_notes,
          created_at,
          updated_at,
          profiles:user_id (
            first_name,
            last_name,
            email
          ),
          return_items (
            id,
            product_name,
            quantity,
            refund_amount
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setReturns((data as any) || [])
    } catch (error) {
      console.error('Error loading returns:', error)
      toast.error('Erreur lors du chargement des retours')
    } finally {
      setLoading(false)
    }
  }

  async function updateReturnStatus(returnId: string, newStatus: string) {
    const { error } = await supabase
      .from('return_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', returnId)

    if (error) {
      toast.error('Erreur lors de la mise à jour')
      return
    }

    toast.success('Statut mis à jour')
    loadReturns()
  }

  async function toggleGiftReturned(returnId: string, currentValue: boolean) {
    const { error } = await supabase
      .from('return_requests')
      .update({ gift_returned: !currentValue })
      .eq('id', returnId)

    if (error) {
      toast.error('Erreur')
      return
    }

    toast.success('Statut cadeau mis à jour')
    loadReturns()
  }

  async function creditWallet(returnRequest: ReturnRequest) {
    const { error: walletError } = await supabase
      .from('customer_wallet')
      .upsert({
        user_id: returnRequest.user_id,
        balance: returnRequest.total_refund_amount
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (walletError) {
      toast.error('Erreur créditation porte-monnaie')
      return
    }

    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: returnRequest.user_id,
        amount: returnRequest.total_refund_amount,
        type: 'refund',
        reference_type: 'return',
        reference_id: returnRequest.id,
        description: `Retour commande ${returnRequest.order_id}`
      })

    await supabase
      .from('return_requests')
      .update({
        wallet_amount_credited: returnRequest.total_refund_amount,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', returnRequest.id)

    toast.success(`${returnRequest.total_refund_amount.toFixed(2)}€ crédités !`)
    loadReturns()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'En attente' },
      received: { variant: 'default', label: 'Reçu' },
      validated: { variant: 'default', label: 'Validé' },
      completed: { variant: 'default', label: 'Complété' },
      rejected: { variant: 'destructive', label: 'Rejeté' }
    }

    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Retours</h1>
          <p className="text-gray-600">{returns.length} demandes de retour</p>
        </div>
        <Button onClick={loadReturns} variant="outline">
          Actualiser
        </Button>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'received', 'validated', 'completed'].map((f) => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
          >
            {f === 'all' ? 'Tous' : f}
          </Button>
        ))}
      </div>

      <div className="grid gap-6">
        {returns.map((returnRequest) => (
          <Card key={returnRequest.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#D4AF37]" />
                    Retour #{returnRequest.id.substring(0, 8)}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {returnRequest.profiles?.first_name} {returnRequest.profiles?.last_name} ({returnRequest.profiles?.email})
                  </p>
                </div>
                {getStatusBadge(returnRequest.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Raison du retour</h4>
                <p className="text-sm text-gray-700">{returnRequest.reason}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Articles retournés</h4>
                <div className="space-y-2">
                  {returnRequest.return_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-[#D4AF37]">
                        {item.refund_amount.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <Euro className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold">Montant total à rembourser</p>
                  <p className="text-sm text-gray-600">
                    {returnRequest.wallet_amount_credited > 0
                      ? `${returnRequest.wallet_amount_credited.toFixed(2)}€ déjà crédités`
                      : 'Non crédité'}
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {returnRequest.total_refund_amount.toFixed(2)}€
                </span>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded">
                <Checkbox
                  id={`gift-${returnRequest.id}`}
                  checked={returnRequest.gift_returned}
                  onCheckedChange={() => toggleGiftReturned(returnRequest.id, returnRequest.gift_returned)}
                />
                <label
                  htmlFor={`gift-${returnRequest.id}`}
                  className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Gift className="h-4 w-4 text-amber-600" />
                  Cadeau retourné dans le colis
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {returnRequest.status === 'pending' && (
                  <Button
                    onClick={() => updateReturnStatus(returnRequest.id, 'received')}
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marquer comme reçu
                  </Button>
                )}

                {returnRequest.status === 'received' && (
                  <Button
                    onClick={() => updateReturnStatus(returnRequest.id, 'validated')}
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valider le retour
                  </Button>
                )}

                {returnRequest.status === 'validated' && returnRequest.wallet_amount_credited === 0 && (
                  <Button
                    onClick={() => creditWallet(returnRequest)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Euro className="h-4 w-4 mr-2" />
                    Créditer {returnRequest.total_refund_amount.toFixed(2)}€
                  </Button>
                )}

                {returnRequest.status !== 'rejected' && returnRequest.status !== 'completed' && (
                  <Button
                    onClick={() => updateReturnStatus(returnRequest.id, 'rejected')}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                Créé le {new Date(returnRequest.created_at).toLocaleString('fr-FR')}
              </div>
            </CardContent>
          </Card>
        ))}

        {returns.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune demande de retour</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
