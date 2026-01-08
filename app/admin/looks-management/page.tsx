'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sparkles, Eye, EyeOff, Edit2, Trash2, Plus, Loader2, AlertCircle, Euro, Package } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Look {
  id: string
  title: string
  description: string
  image_url: string | null
  is_active: boolean
  display_order: number
  total_price: number
  discounted_price: number | null
  discount_percentage: number | null
  morgane_advice: string | null
  created_at: string
  look_products: Array<{
    id: string
    product_id: string
    position_x: number | null
    position_y: number | null
  }>
}

export default function LooksManagementPage() {
  const [looks, setLooks] = useState<Look[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLook, setEditingLook] = useState<Look | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    morgane_advice: '',
    discount_percentage: 5,
    is_active: true
  })

  useEffect(() => {
    loadLooks()
  }, [])

  async function loadLooks() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('looks')
        .select(`
          id,
          title,
          description,
          image_url,
          is_active,
          display_order,
          total_price,
          discounted_price,
          discount_percentage,
          morgane_advice,
          created_at,
          look_products (
            id,
            product_id,
            position_x,
            position_y
          )
        `)
        .order('display_order', { ascending: true })

      if (error) throw error

      setLooks((data as any) || [])
    } catch (error) {
      console.error('Error loading looks:', error)
      toast.error('Erreur lors du chargement des looks')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(lookId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('looks')
      .update({ is_active: !currentStatus })
      .eq('id', lookId)

    if (error) {
      toast.error('Erreur')
      return
    }

    toast.success(currentStatus ? 'Look désactivé' : 'Look activé')
    loadLooks()
  }

  async function deleteLook(lookId: string) {
    if (!confirm('Supprimer ce look ?')) return

    const { error } = await supabase
      .from('looks')
      .delete()
      .eq('id', lookId)

    if (error) {
      toast.error('Erreur lors de la suppression')
      return
    }

    toast.success('Look supprimé')
    loadLooks()
  }

  async function saveLook() {
    if (!formData.title.trim()) {
      toast.error('Le titre est obligatoire')
      return
    }

    const lookData = {
      title: formData.title,
      description: formData.description,
      image_url: formData.image_url,
      morgane_advice: formData.morgane_advice,
      discount_percentage: formData.discount_percentage,
      is_active: formData.is_active,
      display_order: looks.length + 1
    }

    if (editingLook) {
      const { error } = await supabase
        .from('looks')
        .update(lookData)
        .eq('id', editingLook.id)

      if (error) {
        toast.error('Erreur lors de la mise à jour')
        return
      }

      toast.success('Look mis à jour')
    } else {
      const { error } = await supabase
        .from('looks')
        .insert([lookData])

      if (error) {
        toast.error('Erreur lors de la création')
        return
      }

      toast.success('Look créé')
    }

    setIsDialogOpen(false)
    resetForm()
    loadLooks()
  }

  function openEditDialog(look: Look) {
    setEditingLook(look)
    setFormData({
      title: look.title,
      description: look.description,
      image_url: look.image_url || '',
      morgane_advice: look.morgane_advice || '',
      discount_percentage: look.discount_percentage || 5,
      is_active: look.is_active
    })
    setIsDialogOpen(true)
  }

  function resetForm() {
    setEditingLook(null)
    setFormData({
      title: '',
      description: '',
      image_url: '',
      morgane_advice: '',
      discount_percentage: 5,
      is_active: true
    })
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
          <h1 className="text-3xl font-bold mb-2">Les Looks de Morgane</h1>
          <p className="text-gray-600">{looks.length} looks créés</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Look
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLook ? 'Modifier le look' : 'Créer un nouveau look'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre du look *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Le Look Bohème Chic"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description courte du look..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image">URL de l'image</Label>
                <Input
                  id="image"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="advice">Conseil de Morgane</Label>
                <Textarea
                  id="advice"
                  value={formData.morgane_advice}
                  onChange={(e) => setFormData({ ...formData, morgane_advice: e.target.value })}
                  placeholder="Mon petit conseil pour sublimer ce look..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="discount">Réduction bundle (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <label htmlFor="active" className="text-sm font-medium cursor-pointer">
                  Look actif (visible sur le site)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveLook} className="flex-1">
                  {editingLook ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {looks.map((look) => (
          <Card key={look.id}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                    {look.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{look.description}</p>
                </div>
                <Badge variant={look.is_active ? 'default' : 'secondary'}>
                  {look.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {look.image_url && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={look.image_url}
                    alt={look.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                {look.total_price > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Prix total</span>
                    <span className="font-bold text-gray-400 line-through">
                      {look.total_price.toFixed(2)}€
                    </span>
                  </div>
                )}

                {look.discounted_price && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <span className="text-sm font-medium text-green-700">Prix bundle (-{look.discount_percentage}%)</span>
                    <span className="text-xl font-bold text-green-700">
                      {look.discounted_price.toFixed(2)}€
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="h-4 w-4" />
                  {look.look_products.length} produits
                </div>
              </div>

              {look.morgane_advice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm text-amber-900 italic">
                    "{look.morgane_advice}"
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(look.id, look.is_active)}
                  className="flex-1"
                >
                  {look.is_active ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Activer
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(look)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteLook(look.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                Créé le {new Date(look.created_at).toLocaleDateString('fr-FR')}
              </div>
            </CardContent>
          </Card>
        ))}

        {looks.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun look créé pour le moment</p>
              <p className="text-sm text-gray-500 mt-2">
                Cliquez sur "Nouveau Look" pour commencer
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
