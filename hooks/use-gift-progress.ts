import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'

export interface GiftProgress {
  current: number
  threshold: number
  progress: number
  remaining: number
  isEligible: boolean
}

export function useGiftProgress() {
  const [progress, setProgress] = useState<GiftProgress>({
    current: 0,
    threshold: 69,
    progress: 0,
    remaining: 69,
    isEligible: false
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { cart } = useCart()

  useEffect(() => {
    calculateProgress()
  }, [user, cart])

  async function calculateProgress() {
    try {
      setLoading(true)

      const { data: settings } = await supabase
        .from('guestbook_settings')
        .select('threshold_amount')
        .maybeSingle()

      const threshold = settings?.threshold_amount || 69

      let cartTotal = 0
      if (cart && Array.isArray(cart)) {
        cartTotal = cart.reduce((sum, item) => {
          const price = typeof item.price === 'string'
            ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
            : item.price
          return sum + (price * item.quantity)
        }, 0)
      }

      let openPackageTotal = 0
      if (user) {
        const { data: openPackage } = await supabase
          .from('open_packages')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (openPackage) {
          const { data: orders } = await supabase
            .from('orders')
            .select('total')
            .eq('open_package_id', openPackage.id)
            .eq('payment_status', 'paid')

          if (orders) {
            openPackageTotal = orders.reduce((sum, order) => sum + order.total, 0)
          }
        }
      }

      const current = cartTotal + openPackageTotal
      const progressPercent = Math.min(100, (current / threshold) * 100)
      const remaining = Math.max(0, threshold - current)
      const isEligible = current >= threshold

      setProgress({
        current,
        threshold,
        progress: progressPercent,
        remaining,
        isEligible
      })
    } catch (error) {
      console.error('Error calculating gift progress:', error)
    } finally {
      setLoading(false)
    }
  }

  return { progress, loading, refetch: calculateProgress }
}
