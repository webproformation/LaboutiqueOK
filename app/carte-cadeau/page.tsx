"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, ShoppingCart, Mail, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";

export default function CartesCadeauxPage() {
  const { addToCart } = useCart();
  const [amount, setAmount] = useState(50);
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("my-email");
  const [recipientEmail, setRecipientEmail] = useState("");

  const handleAddToCart = () => {
    if (deliveryMethod === "recipient-email" && !recipientEmail) {
      toast.error("Veuillez entrer l'email du destinataire");
      return;
    }

    const giftCardProduct = {
      id: `gift-card-${Date.now()}`,
      name: `Carte Cadeau ${amount}€`,
      slug: 'carte-cadeau',
      price: amount.toString(),
      image: { sourceUrl: '/lbdm-logobdc.png' },
      giftCardData: {
        amount,
        fromName,
        toName,
        message,
        deliveryMethod,
        recipientEmail: deliveryMethod === "recipient-email" ? recipientEmail : null
      }
    };

    addToCart(giftCardProduct, 1);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Gift className="h-16 w-16 text-[#b8933d] mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Carte Cadeau</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Offrez le plaisir de choisir avec notre carte cadeau personnalisable
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <div className="relative aspect-[4/5] bg-gradient-to-br from-[#b8933d] to-[#8b6f2d] rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-white overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-10 right-10 w-32 h-32 border-4 border-white rounded-full" />
                <div className="absolute bottom-10 left-10 w-24 h-24 border-4 border-white rounded-full" />
              </div>

              <div className="relative z-10 text-center space-y-6">
                <Gift className="h-24 w-24 text-white opacity-90 mx-auto" />
                <p className="text-5xl font-bold">{amount}€</p>
                <p className="text-lg opacity-90">Carte Cadeau</p>
                <p className="text-sm opacity-75">La Boutique de Morgane</p>
              </div>

              {fromName && (
                <div className="absolute bottom-8 left-8 text-left">
                  <p className="text-sm opacity-75">De la part de :</p>
                  <p className="font-semibold text-lg">{fromName}</p>
                </div>
              )}

              {toName && (
                <div className="absolute top-8 right-8 text-right">
                  <p className="text-sm opacity-75">Pour :</p>
                  <p className="font-semibold text-lg">{toName}</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Validité : 1 an</p>
                <p>
                  Valable 1 an à compter de la date de réception. Utilisable en une ou plusieurs
                  fois sur l'ensemble de la boutique.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Personnalisez votre carte cadeau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Montant de la carte</Label>
                  <Slider
                    value={[amount]}
                    onValueChange={(value) => setAmount(value[0])}
                    min={10}
                    max={1500}
                    step={10}
                    className="py-4"
                  />
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 10 && val <= 1500) {
                          setAmount(val);
                        }
                      }}
                      min={10}
                      max={1500}
                      className="w-32"
                    />
                    <span className="text-2xl font-bold text-[#b8933d]">{amount}€</span>
                  </div>
                  <p className="text-sm text-gray-600">Montant entre 10€ et 1500€</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="fromName">De la part de (optionnel)</Label>
                  <Input
                    id="fromName"
                    type="text"
                    placeholder="Votre nom"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="toName">Pour (optionnel)</Label>
                  <Input
                    id="toName"
                    type="text"
                    placeholder="Nom du destinataire"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message">Message personnalisé (optionnel)</Label>
                  <Textarea
                    id="message"
                    placeholder="Ajoutez un message personnel..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Mode d'envoi</Label>
                  <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-[#b8933d] transition-colors">
                      <RadioGroupItem value="my-email" id="my-email" />
                      <div className="flex-1">
                        <Label htmlFor="my-email" className="font-semibold cursor-pointer">
                          À votre adresse mail
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Vous recevrez la carte cadeau puis la remettrez au destinataire
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-[#b8933d] transition-colors">
                      <RadioGroupItem value="recipient-email" id="recipient-email" />
                      <div className="flex-1">
                        <Label htmlFor="recipient-email" className="font-semibold cursor-pointer">
                          Directement au destinataire
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          La carte sera envoyée par email au destinataire
                        </p>
                      </div>
                    </div>
                  </RadioGroup>

                  {deliveryMethod === "recipient-email" && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="recipientEmail">Email du destinataire</Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        placeholder="email@exemple.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#b8933d] hover:bg-[#a07c2f] text-white text-lg py-6"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Ajouter au panier
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Comment ça fonctionne ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-[#b8933d] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Recevez votre carte</h3>
                <p className="text-gray-600">
                  Vous recevrez votre carte cadeau par email immédiatement après validation du
                  paiement
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-[#b8933d] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Offrez-la</h3>
                <p className="text-gray-600">
                  Imprimez-la ou transférez-la directement par email au destinataire
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-[#b8933d] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Utilisez-la</h3>
                <p className="text-gray-600">
                  Valable 1 an, utilisable en ligne en une ou plusieurs fois
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
