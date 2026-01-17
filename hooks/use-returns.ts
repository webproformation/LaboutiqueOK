import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export interface ReturnRequest {
  id: string
  return_number: string
  user_id: string
  order_id: string
  order_number: string
  return_type: 'credit' | 'refund'
  status: 'declared' | 'received' | 'validated' | 'completed' | 'cancelled'
  total_amount: number
  loyalty_recovered: number
  gift_deduction: number
  gift_returned: boolean
  shipping_address?: any
  admin_notes?: string
  declared_at: string
  received_at?: string
  validated_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface ReturnItem {
  id: string
  return_id: string
  product_id: string
  product_name: string
  product_slug: string
  quantity: number
  unit_price: number
  discount_prorata: number
  net_amount: number
  variation_data?: any
  image_url?: string
  created_at: string
}

export interface CustomerWallet {
  id: string
  user_id: string
  balance: number
  total_credited: number
  total_spent: number
  created_at: string
  updated_at: string
}

export function useReturns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchReturns()
    }
  }, [user])

  async function fetchReturns() {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('declared_at', { ascending: false })

      if (error) throw error
      setReturns(data || [])
    } catch (error) {
      console.error('Error fetching returns:', error)
    } finally {
      setLoading(false)
    }
  }

  return { returns, loading, refetch: fetchReturns }
}

export function useCustomerWallet() {
  const [wallet, setWallet] = useState<CustomerWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchWallet()
    }
  }, [user])

  async function fetchWallet() {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customer_wallet')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      
      if (!data) {
        const { data: newWallet, error: insertError } = await supabase
          .from('customer_wallet')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (insertError) throw insertError
        setWallet(newWallet)
      } else {
        setWallet(data)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  return { wallet, loading, refetch: fetchWallet }
}

export async function createReturnRequest(data: {
  order_id: string
  order_number: string
  return_type: 'credit' | 'refund'
  items: Array<{
    product_id: string
    product_name: string
    product_slug: string
    quantity: number
    unit_price: number
    discount_prorata: number
    net_amount: number
    variation_data?: any
    image_url?: string
  }>
  total_amount: number
  loyalty_recovered: number
  gift_deduction: number
  gift_returned: boolean
}) {
  const { data: returnRequest, error: returnError } = await supabase
    .from('return_requests')
    .insert({
      order_id: data.order_id,
      order_number: data.order_number,
      return_type: data.return_type,
      total_amount: data.total_amount,
      loyalty_recovered: data.loyalty_recovered,
      gift_deduction: data.gift_deduction,
      gift_returned: data.gift_returned,
      status: 'declared'
    })
    .select()
    .single()

  if (returnError) throw returnError

  const returnItems = data.items.map(item => ({
    ...item,
    return_id: returnRequest.id
  }))

  const { error: itemsError } = await supabase
    .from('return_items')
    .insert(returnItems)

  if (itemsError) throw itemsError

  return returnRequest
}

export async function calculateRefundAmount(
  orderTotal: number,
  itemPrice: number,
  totalDiscount: number,
  loyaltyEarned: number,
  hadGift: boolean,
  giftValue: number,
  newTotal: number,
  giftReturned: boolean
) {
  const prorata = totalDiscount * (itemPrice / orderTotal)
  const netPrice = itemPrice - prorata

  const loyaltyToRecover = (loyaltyEarned * itemPrice) / orderTotal

  let giftDeduction = 0
  if (hadGift && newTotal < 69 && !giftReturned) {
    giftDeduction = giftValue
  }

  const refund = netPrice - loyaltyToRecover - giftDeduction

  return {
    netPrice,
    discount_prorata: prorata,
    loyaltyToRecover,
    giftDeduction,
    finalRefund: Math.max(0, refund)
  }
}

export async function getEligibleReturns(userId: string) {
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'delivered')
    .gte('delivered_at', fourteenDaysAgo.toISOString())

  if (error) throw error
  return data || []
}
