import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, MapPin, Mail, Check } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function FraisDePortPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <PageHeader
            icon={Truck}
            title="Frais de Port"
            description="Profitez de la livraison gratuite en Point Relais pour toutes vos commandes à partir de 80€ d'achat."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#b8933d]/20 border-[#C6A15B] border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-6 w-6 text-[#C6A15B]" />
                  Chronopost Shop to Shop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold text-[#C6A15B]">3,90€</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold">Délai : 1 à 2 jours ouvrés</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">
                  La solution la plus rapide et économique !
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-[#C6A15B]" />
                  Mondial Relay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-2xl font-bold text-green-600">Gratuit</div>
                  <p className="text-sm text-gray-600">à partir de 80€ d'achat</p>
                </div>
                <div className="text-xl font-semibold text-gray-700">5,90€</div>
                <p className="text-sm text-gray-600">pour commandes {"<"} 80€</p>
                <div className="flex items-center gap-2 text-sm pt-2">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold">Délai : 3 à 5 jours ouvrés</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-[#C6A15B]" />
                  GLS Point Relais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold text-gray-700">5,90€</div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold">Délai : 2 à 4 jours ouvrés</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-6 w-6 text-[#C6A15B]" />
                  GLS Domicile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold text-gray-700">7,90€</div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold">Délai : 2 à 4 jours ouvrés</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-[#C6A15B]" />
                  Colissimo Domicile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold text-gray-700">8,90€</div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold">Délai : 2 à 4 jours ouvrés</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-green-600" />
                  Retrait en boutique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-3xl font-bold text-green-600">Gratuit</div>
                  <p className="text-sm text-gray-600">quel que soit le montant</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold">Disponible sous 24 à 48h</span>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  1062 rue d'Armentières<br/>
                  59850 Nieppe
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Suivi de commande</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Dès l'expédition de votre colis, vous recevrez un email avec un numéro de suivi pour suivre
                votre commande en temps réel jusqu'à sa livraison.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zones de livraison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#C6A15B]" />
                  <span>France métropolitaine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#C6A15B]" />
                  <span>Belgique</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#C6A15B]" />
                  <span>Luxembourg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#b8933d]/20 border-[#C6A15B] border-2">
            <CardContent className="p-6 text-center space-y-2">
              <Mail className="h-8 w-8 text-[#C6A15B] mx-auto mb-2" />
              <p className="text-gray-700">
                Pour toute question sur la livraison, n'hésitez pas à nous contacter :
              </p>
              <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] font-semibold hover:underline">
                contact@laboutiquedemorgane.com
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
