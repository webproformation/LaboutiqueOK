import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export interface GuestbookEntry {
  id: string
  user_id: string
  order_number: string
  rating: number
  message: string
  customer_name: string
  customer_photo_url?: string
  admin_response?: string
  status: 'pending' | 'approved' | 'rejected'
  hearts_count: number
  is_ambassador: boolean
  ambassador_week?: string
  created_at: string
  user_has_hearted?: boolean
}

export interface Ambassador {
  id: string
  user_id: string
  entry_id: string
  week_start: string
  week_end: string
  hearts_count: number
  reward_amount: number
  reward_credited: boolean
  created_at: string
  entry?: GuestbookEntry
}

export function useGuestbook(limit = 20, status: 'approved' | 'all' = 'approved') {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchEntries()
  }, [status, limit, user])

  async function fetchEntries() {
    try {
      setLoading(true)
      let query = supabase
        .from('guestbook_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status === 'approved') {
        query = query.eq('status', 'approved')
      }

      const { data, error } = await query

      if (error) throw error

      if (user && data) {
        const entriesWithHearts = await Promise.all(
          data.map(async (entry) => {
            const { data: heartData } = await supabase
              .from('guestbook_hearts')
              .select('id')
              .eq('entry_id', entry.id)
              .eq('user_id', user.id)
              .maybeSingle()

            return {
              ...entry,
              user_has_hearted: !!heartData
            }
          })
        )
        setEntries(entriesWithHearts)
      } else {
        setEntries(data || [])
      }
    } catch (error) {
      console.error('Error fetching guestbook entries:', error)
    } finally {
      setLoading(false)
    }
  }

  return { entries, loading, refetch: fetchEntries }
}

export function useHearts(entryId: string) {
  const { user } = useAuth()
  const [hasHearted, setHasHearted] = useState(false)
  const [heartsCount, setHeartsCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkIfHearted()
    }
    fetchHeartsCount()
  }, [entryId, user])

  async function checkIfHearted() {
    if (!user) return

    const { data } = await supabase
      .from('guestbook_hearts')
      .select('id')
      .eq('entry_id', entryId)
      .eq('user_id', user.id)
      .maybeSingle()

    setHasHearted(!!data)
  }

  async function fetchHeartsCount() {
    const { data } = await supabase
      .from('guestbook_entries')
      .select('hearts_count')
      .eq('id', entryId)
      .maybeSingle()

    setHeartsCount(data?.hearts_count || 0)
  }

  async function toggleHeart() {
    if (!user) return

    setLoading(true)
    try {
      if (hasHearted) {
        const { error } = await supabase
          .from('guestbook_hearts')
          .delete()
          .eq('entry_id', entryId)
          .eq('user_id', user.id)

        if (error) throw error
        setHasHearted(false)
        setHeartsCount(prev => Math.max(0, prev - 1))
      } else {
        const { error } = await supabase
          .from('guestbook_hearts')
          .insert({
            entry_id: entryId,
            user_id: user.id
          })

        if (error) throw error
        setHasHearted(true)
        setHeartsCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling heart:', error)
    } finally {
      setLoading(false)
    }
  }

  return { hasHearted, heartsCount, toggleHeart, loading }
}

export function useAmbassador() {
  const [currentAmbassador, setCurrentAmbassador] = useState<Ambassador | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentAmbassador()
  }, [])

  async function fetchCurrentAmbassador() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ambassador_weekly')
        .select('*, entry:guestbook_entries(*)')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setCurrentAmbassador(data)
    } catch (error) {
      console.error('Error fetching ambassador:', error)
    } finally {
      setLoading(false)
    }
  }

  return { currentAmbassador, loading, refetch: fetchCurrentAmbassador }
}

export async function submitGuestbookEntry(data: {
  order_number: string
  rating: number
  message: string
  customer_name: string
  customer_photo_url?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: entry, error } = await supabase
    .from('guestbook_entries')
    .insert({
      ...data,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error

  try {
    const { data: loyaltyData, error: loyaltyError } = await supabase.rpc('add_loyalty_gain', {
      p_user_id: user.id,
      p_type: 'review',
      p_base_amount: 0.20,
      p_description: 'Avis déposé sur le Livre d\'Or'
    })

    if (!loyaltyError && loyaltyData) {
      const result = typeof loyaltyData === 'string' ? JSON.parse(loyaltyData) : loyaltyData
      console.log('Loyalty reward added:', result)
    }
  } catch (loyaltyErr) {
    console.error('Error adding loyalty reward for review:', loyaltyErr)
  }

  return entry
}

export async function canUserReview(userId: string, orderNumber: string) {
  const { data: existingReview } = await supabase
    .from('guestbook_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('order_number', orderNumber)
    .maybeSingle()

  return !existingReview
}
