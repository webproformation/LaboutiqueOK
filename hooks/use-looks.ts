import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Look {
  id: string
  title: string
  description?: string
  morgane_style_advice?: string
  main_image_url?: string
  is_active: boolean
  discount_percentage: number
  total_price: number
  discounted_price: number
  items_count: number
  created_at: string
  updated_at: string
}

export interface LookProduct {
  id: string
  look_id: string
  product_id: string
  product_name: string
  product_slug?: string
  product_price: number
  product_image_url?: string
  available_sizes?: string[]
  available_colors?: string[]
  stock_status: 'instock' | 'lowstock' | 'outofstock'
  category?: string
  position: number
  hotspot_x?: number
  hotspot_y?: number
}

export function useLooks(activeOnly = true) {
  const [looks, setLooks] = useState<Look[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLooks()
  }, [activeOnly])

  async function fetchLooks() {
    try {
      setLoading(true)
      let query = supabase
        .from('looks')
        .select('*')
        .order('created_at', { ascending: false })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error
      setLooks(data || [])
    } catch (error) {
      console.error('Error fetching looks:', error)
    } finally {
      setLoading(false)
    }
  }

  return { looks, loading, refetch: fetchLooks }
}

export function useLookDetails(lookId: string) {
  const [look, setLook] = useState<Look | null>(null)
  const [products, setProducts] = useState<LookProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (lookId) {
      fetchLookDetails()
    }
  }, [lookId])

  async function fetchLookDetails() {
    try {
      setLoading(true)

      const { data: lookData, error: lookError } = await supabase
        .from('looks')
        .select('*')
        .eq('id', lookId)
        .single()

      if (lookError) throw lookError
      setLook(lookData)

      const { data: productsData, error: productsError } = await supabase
        .from('look_products')
        .select('*')
        .eq('look_id', lookId)
        .order('position')

      if (productsError) throw productsError
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error fetching look details:', error)
    } finally {
      setLoading(false)
    }
  }

  return { look, products, loading, refetch: fetchLookDetails }
}

export async function checkLookAvailability(lookId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_look_availability', {
    look_id_param: lookId
  })

  if (error) {
    console.error('Error checking look availability:', error)
    return false
  }

  return data || false
}

export async function addLookToCart(
  lookId: string,
  selectedVariations: Record<string, {
    size?: string
    color?: string
    quantity: number
  }>
) {
  const { data: products, error } = await supabase
    .from('look_products')
    .select('*')
    .eq('look_id', lookId)

  if (error) throw error

  const cartItems = products.map(product => ({
    product_id: product.product_id,
    quantity: selectedVariations[product.product_id]?.quantity || 1,
    variation_data: {
      size: selectedVariations[product.product_id]?.size,
      color: selectedVariations[product.product_id]?.color
    },
    is_bundle: true,
    bundle_id: lookId
  }))

  return cartItems
}
