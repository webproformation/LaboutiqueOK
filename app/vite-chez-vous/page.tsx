import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, Clock, Gift, MapPin } from 'lucide-react';

export default function ViteChezVousPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Votre colis, préparé avec amour
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Chez nous, chaque commande est traitée avec soin. Découvrez nos modes de livraison
              et nos délais pour recevoir vos pépites rapidement.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Nos modes de livraison</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-[#C6A15B] border-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-[#C6A15B]" />
                    Chronopost Shop to Shop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-[#C6A15B]">3,90€</div>
                  <p className="text-sm text-gray-700">
                    <strong>Ultra-rapide et économique</strong>
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>1 à 2 jours ouvrés</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#C6A15B]" />
                    Points Relais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-gray-700">5,90€</div>
                  <p className="text-sm text-gray-700">
                    Mondial Relay & GLS<br/>
                    <strong className="text-green-600">Mondial Relay gratuit dès 80€</strong>
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>3 à 5 jours ouvrés</span>
                  </div>
                  <p className="text-xs text-gray-600 italic">Solution écologique</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#C6A15B]" />
                    Livraison à Domicile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xl font-bold text-gray-700">GLS : 7,90€</div>
                    <div className="text-xl font-bold text-gray-700">Colissimo : 8,90€</div>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Le confort de recevoir directement chez vous</strong>
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>2 à 4 jours ouvrés</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Délais d'expédition</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-[#C6A15B]" />
                    Préparation de votre commande
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Toute commande passée avant <strong className="text-[#C6A15B]">12h</strong> est préparée
                    le jour même ou le lendemain maximum (hors week-ends et jours fériés).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-6 w-6 text-[#C6A15B]" />
                    Réception de votre colis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Selon le mode de livraison choisi, comptez entre <strong>1 à 5 jours ouvrés</strong> pour
                    recevoir votre commande après expédition.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-[#D4AF37] to-[#b8933d] text-white">
            <CardContent className="p-8 text-center space-y-4">
              <Gift className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">L'emballage signé Morgane</h3>
              <p className="text-lg leading-relaxed">
                Chaque commande est emballée avec soin dans du papier de soie, parfumée délicatement
                et accompagnée d'un petit mot.
              </p>
              <p className="text-lg italic">
                Parce que vous méritez cette attention.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">📦 Suivi de votre commande</h3>
              <p className="text-gray-700">
                Dès l'expédition, vous recevrez un email avec votre numéro de suivi pour suivre votre colis
                en temps réel jusqu'à sa livraison.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
