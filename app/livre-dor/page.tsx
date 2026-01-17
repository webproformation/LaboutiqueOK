'use client'

import { useState } from 'react'
import { useGuestbook, useAmbassador, useHearts, canUserReview, submitGuestbookEntry } from '@/hooks/use-guestbook'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Gem, Heart, Loader2, Crown, Upload, CheckCircle2, BookHeart } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import PageHeader from '@/components/PageHeader'

export default function LivreDorPage() {
  const { entries, loading, refetch } = useGuestbook(50, 'approved')
  const { currentAmbassador, loading: ambassadorLoading } = useAmbassador()
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    order_number: '',
    rating: 5,
    message: '',
    customer_name: '',
    customer_photo_url: '',
    gdpr_consent: false
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const { url } = await response.json()
      setFormData(prev => ({ ...prev, customer_photo_url: url }))
      toast.success('Photo uploadée avec succès')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'upload de la photo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Vous devez être connectée pour signer le Livre d\'Or')
      return
    }

    if (!formData.gdpr_consent) {
      toast.error('Veuillez accepter les conditions de publication')
      return
    }

    setSubmitting(true)
    try {
      const canReview = await canUserReview(user.id, formData.order_number)
      if (!canReview) {
        toast.error('Vous avez déjà signé le Livre d\'Or pour cette commande')
        return
      }

      const entry = await submitGuestbookEntry({
        order_number: formData.order_number,
        rating: formData.rating,
        message: formData.message,
        customer_name: formData.customer_name,
        customer_photo_url: formData.customer_photo_url
      })

      toast.success('Merci pour votre mot doux ! Il sera publié après validation (48-72h)', {
        description: 'Bonus fidélité ajouté à votre cagnotte !'
      })

      setFormData({
        order_number: '',
        rating: 5,
        message: '',
        customer_name: '',
        customer_photo_url: '',
        gdpr_consent: false
      })
      setShowForm(false)
      refetch()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSubmitting(false)
    }
  }

  const renderPepites = (rating: number, interactive = false, onClick?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((pepite) => (
          <button
            key={pepite}
            type={interactive ? "button" : undefined}
            onClick={() => interactive && onClick && onClick(pepite)}
            disabled={!interactive}
            className={interactive ? "focus:outline-none cursor-pointer" : undefined}
          >
            <Gem
              className={`h-5 w-5 ${
                pepite <= rating ? 'fill-[#C6A15B] text-[#C6A15B]' : 'text-gray-300'
              } ${interactive ? 'hover:text-[#C6A15B]/50' : ''}`}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          icon={BookHeart}
          title="Livre d'Or"
          description="Partagez votre expérience et devenez notre Ambassadrice de la Semaine !"
        />

        <div className="bg-gradient-to-r from-[#C6A15B]/10 to-pink-50 rounded-3xl p-8 mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
              <Crown className="h-10 w-10 text-[#C6A15B]" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Challenge de la Semaine</h2>
          </div>

          <div className="prose prose-lg max-w-4xl mx-auto text-gray-700 space-y-4">
            <p>
              Vous aimez vos pépites ? Vous adorez partager vos looks ? Alors, préparez-vous à briller !
              Chaque semaine, nous mettons l&apos;une d&apos;entre vous à l&apos;honneur sur la boutique.
            </p>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-[#C6A15B] mb-3 flex items-center gap-2">
                <Gem className="h-6 w-6" /> Comment participer ?
              </h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Faites pétiller votre look : Prenez une jolie photo de vous portant vos pépites préférées</li>
                <li>Signez le Livre d&apos;Or : Déposez votre photo et votre petit mot doux (Bonus : 0,20 € immédiat dans votre cagnotte)</li>
                <li>Récoltez des cœurs : Invitez les autres visiteuses à cliquer sur le Cœur sous votre avis</li>
              </ol>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-pink-600 mb-3 flex items-center gap-2">
                <Heart className="h-6 w-6" /> Comment gagner ?
              </h3>
              <p>
                Chaque lundi matin, nous regardons quelle photo a fait battre le plus de cœurs sur les 7 derniers jours.
                La cliente qui a récolté le plus de votes devient officiellement notre Ambassadrice de la Semaine.
              </p>
            </div>

            <div className="bg-[#C6A15B] text-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Crown className="h-6 w-6" /> Votre couronne de cadeaux
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-2xl">💰</span>
                  <span>5,00 € offerts immédiatement sur votre Cagnotte</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">👑</span>
                  <span>Votre Badge &quot;Couronne Dorée&quot; affiché à côté de votre prénom</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">🌟</span>
                  <span>Votre photo et avis affichés en grand sur la page d&apos;accueil pendant toute la semaine</span>
                </li>
              </ul>
            </div>
          </div>

          {user && (
            <div className="text-center mt-8">
              <Button
                onClick={() => setShowForm(!showForm)}
                size="lg"
                className="bg-[#C6A15B] hover:bg-[#B59149] text-white"
              >
                <Gem className="mr-2 h-5 w-5" />
                Signer le Livre d&apos;Or
              </Button>
            </div>
          )}

          {!user && (
            <p className="text-center mt-6 text-gray-600">
              Connectez-vous pour signer le Livre d&apos;Or et participer au concours !
            </p>
          )}
        </div>

        {!ambassadorLoading && currentAmbassador && currentAmbassador.entry && (
          <Card className="mb-12 border-4 border-[#C6A15B] shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <Crown className="h-12 w-12 text-[#C6A15B] fill-[#C6A15B]" />
                <div>
                  <h2 className="text-2xl font-bold">Ambassadrice de la Semaine</h2>
                  <p className="text-gray-600">Cette semaine, on met à l&apos;honneur...</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {currentAmbassador.entry.customer_photo_url && (
                  <div className="relative h-96 rounded-xl overflow-hidden">
                    <Image
                      src={currentAmbassador.entry.customer_photo_url}
                      alt={currentAmbassador.entry.customer_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-2xl font-bold">{currentAmbassador.entry.customer_name}</h3>
                    <Crown className="h-6 w-6 text-[#C6A15B] fill-[#C6A15B]" />
                  </div>
                  {renderPepites(currentAmbassador.entry.rating)}
                  <p className="text-gray-700 mt-4 text-lg">{currentAmbassador.entry.message}</p>
                  <div className="flex items-center gap-4 mt-6">
                    <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
                    <span className="font-bold text-xl">{currentAmbassador.hearts_count} cœurs</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showForm && user && (
          <Card className="mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Laissez votre mot doux</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customer_name">Votre prénom</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="order_number">Numéro de commande</Label>
                    <Input
                      id="order_number"
                      value={formData.order_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
                      placeholder="#12345"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Note en Pépites</Label>
                  <div className="mt-2">
                    {renderPepites(formData.rating, true, (rating) => setFormData(prev => ({ ...prev, rating })))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Votre message (max 500 caractères)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value.slice(0, 500) }))}
                    placeholder="Partagez votre expérience..."
                    rows={5}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">{formData.message.length}/500 caractères</p>
                </div>

                <div>
                  <Label htmlFor="photo">Votre photo (optionnel)</Label>
                  <div className="mt-2">
                    {formData.customer_photo_url ? (
                      <div className="relative w-40 h-40 rounded-lg overflow-hidden">
                        <Image src={formData.customer_photo_url} alt="Preview" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, customer_photo_url: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <Label htmlFor="photo-upload" className="cursor-pointer text-[#C6A15B] hover:underline">
                          {uploading ? 'Upload en cours...' : 'Cliquez pour ajouter une photo'}
                        </Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploading}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="gdpr"
                    checked={formData.gdpr_consent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, gdpr_consent: checked as boolean }))}
                  />
                  <Label htmlFor="gdpr" className="text-sm cursor-pointer">
                    J&apos;accepte que mon message et ma photo soient publiés sur le Livre d&apos;Or de la boutique.
                  </Label>
                </div>

                <Button type="submit" disabled={submitting} className="w-full" size="lg">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Gem className="mr-2 h-5 w-5" />
                      Publier mon mot doux
                    </>
                  )}
                </Button>

                <p className="text-sm text-gray-500 text-center">
                  Pour garantir l&apos;authenticité du Livre d&apos;Or, votre message sera publié après une vérification
                  anti-spam de notre équipe. Merci de votre patience !
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Nos Mots Doux</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#C6A15B]" />
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Soyez la première à signer le Livre d&apos;Or !
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entries.map((entry) => (
                <GuestbookCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GuestbookCard({ entry }: { entry: any }) {
  const { hasHearted, heartsCount, toggleHeart, loading } = useHearts(entry.id)
  const { user } = useAuth()

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {entry.customer_photo_url && (
        <div className="relative h-64 w-full">
          <Image
            src={entry.customer_photo_url}
            alt={entry.customer_name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{entry.customer_name}</h3>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Achat Vérifié
            </Badge>
            {entry.is_ambassador && (
              <Crown className="h-5 w-5 text-[#C6A15B] fill-[#C6A15B]" />
            )}
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((pepite) => (
            <Gem
              key={pepite}
              className={`h-4 w-4 ${
                pepite <= entry.rating ? 'fill-[#C6A15B] text-[#C6A15B]' : 'text-gray-300'
              }`}
            />
          ))}
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-4">{entry.message}</p>

        {entry.admin_response && (
          <div className="bg-[#C6A15B]/5 rounded-lg p-3 mb-4 border-l-4 border-[#C6A15B]">
            <p className="text-xs font-semibold text-[#C6A15B] mb-1">Réponse de Morgane</p>
            <p className="text-sm text-gray-700">{entry.admin_response}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-xs text-gray-500">
            {new Date(entry.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          {user && (
            <button
              onClick={toggleHeart}
              disabled={loading}
              className="flex items-center gap-2 hover:scale-110 transition-transform"
            >
              <Heart
                className={`h-5 w-5 ${
                  hasHearted ? 'fill-pink-500 text-pink-500' : 'text-gray-400'
                }`}
              />
              <span className="text-sm font-medium">{heartsCount}</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
