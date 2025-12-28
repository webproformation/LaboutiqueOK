"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ShoppingCart, Heart, Gift } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';

export default function CarteCodeauPage() {
  const { addToCart } = useCart();
  const [amount, setAmount] = useState(100);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('my-email');
  const [recipientEmail, setRecipientEmail] = useState('');

  const handleAddToCart = () => {
    const giftCard = {
      id: `gift-card-${amount}`,
      slug: `carte-cadeau-${amount}`,
      name: `Carte Cadeau ${amount}€`,
      price: `${amount},00€`,
      image: { sourceUrl: 'https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg' },
      stockQuantity: 999,
    };

    addToCart(giftCard, 1);
    toast.success(`Carte cadeau de ${amount}€ ajoutée au panier !`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-[#b8933d] flex items-center gap-1">
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <span>/</span>
          <span className="text-gray-900">Carte Cadeau</span>
        </nav>

        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-10">
            <div className="space-y-6">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gradient-to-br from-[#b8933d] to-[#8b6f2d]">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                  <Gift className="h-24 w-24 mb-6 opacity-90" />
                  <div className="text-center">
                    <p className="text-5xl font-bold mb-2">{amount}€</p>
                    <p className="text-lg opacity-90">Carte Cadeau</p>
                  </div>
                  {fromName && (
                    <div className="absolute bottom-8 left-8 text-left">
                      <p className="text-sm opacity-75">De la part de:</p>
                      <p className="font-semibold">{fromName}</p>
                    </div>
                  )}
                  {toName && (
                    <div className="absolute top-8 right-8 text-right">
                      <p className="text-sm opacity-75">Pour:</p>
                      <p className="font-semibold">{toName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Valable 1 an</strong> à compter de la date de réception
                  <br />
                  Utilisable en une ou plusieurs fois
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Carte Cadeau
                </h1>
                <p className="text-lg text-gray-600">
                  Faites-lui plaisir en lui offrant une carte cadeau !
                </p>
              </div>

              <div className="space-y-6 border-t pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      1. Choisissez le montant
                    </Label>
                    <span className="text-2xl font-bold text-[#b8933d]">{amount}€</span>
                  </div>
                  <div className="space-y-3">
                    <Slider
                      value={[amount]}
                      onValueChange={(value) => setAmount(value[0])}
                      min={10}
                      max={1500}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>10€</span>
                      <span>1500€</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Math.max(10, Math.min(1500, parseInt(e.target.value) || 10)))}
                      min={10}
                      max={1500}
                      className="flex-1"
                    />
                    <span className="flex items-center text-gray-600 font-medium">€</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    2. Personnalisez votre carte
                  </Label>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="from">De la part de</Label>
                      <Input
                        id="from"
                        placeholder="Votre nom"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="to">Pour</Label>
                      <Input
                        id="to"
                        placeholder="Nom du destinataire"
                        value={toName}
                        onChange={(e) => setToName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message personnalisé</Label>
                      <Textarea
                        id="message"
                        placeholder="Votre message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1 resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    3. Choisissez le mode d&apos;envoi
                  </Label>
                  <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-[#b8933d] transition-colors">
                      <RadioGroupItem value="my-email" id="my-email" className="mt-0.5" />
                      <Label htmlFor="my-email" className="cursor-pointer flex-1">
                        <p className="font-medium">À votre adresse mail</p>
                        <p className="text-sm text-gray-500">
                          Vous recevrez la carte cadeau puis la remettrez au destinataire
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-[#b8933d] transition-colors">
                      <RadioGroupItem value="recipient-email" id="recipient-email" className="mt-0.5" />
                      <Label htmlFor="recipient-email" className="cursor-pointer flex-1">
                        <p className="font-medium">Directement au destinataire</p>
                        <p className="text-sm text-gray-500">
                          La carte sera envoyée par email au destinataire
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>

                  {deliveryMethod === 'recipient-email' && (
                    <div className="mt-3 pl-4">
                      <Label htmlFor="recipient-email-input">Email du destinataire</Label>
                      <Input
                        id="recipient-email-input"
                        type="email"
                        placeholder="email@exemple.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white h-12 text-lg font-semibold"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Ajouter au panier
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 h-12"
                    onClick={() => toast.info('Ajouté à la wishlist')}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Ajouter à la wishlist
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Comment utiliser votre carte cadeau ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#b8933d] rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Recevez votre carte</h3>
                  <p className="text-sm text-gray-600">
                    Vous recevrez votre carte cadeau par email après validation de votre commande
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#b8933d] rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                    2
                  </div>
                  <h3 className="font-semibold mb-2">Offrez-la</h3>
                  <p className="text-sm text-gray-600">
                    Imprimez-la ou envoyez-la directement par email au destinataire
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#b8933d] rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Utilisez-la</h3>
                  <p className="text-sm text-gray-600">
                    Valable 1 an, utilisable en ligne en une ou plusieurs fois
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
