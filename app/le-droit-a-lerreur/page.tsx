import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, Gift, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import PageHeader from '@/components/PageHeader';

export default function LeDroitALErreurPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader
            icon={RotateCcw}
            title="Le Droit à l'Erreur"
            description="Pas satisfaite ? Ça arrive. Nous avons deux solutions simples pour que vous repartiez heureuse."
          />

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Vos options de retour</h2>

            <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#b8933d]/20 border-l-4 border-[#C6A15B]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Option 1 : L'Avoir "Shopping Lovers"</CardTitle>
                  <span className="bg-[#C6A15B] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Recommandé
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C6A15B] mt-1">•</span>
                    <span><strong>Rapidité :</strong> Dès réception de votre retour, votre avoir est crédité sur votre compte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C6A15B] mt-1">•</span>
                    <span><strong>Validité :</strong> 1 an sur toute la boutique</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C6A15B] mt-1">•</span>
                    <span><strong>Avantage :</strong> Continuez à chiner nos pépites sans attendre</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Option 2 : Le Remboursement Classique</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Nous procédons au remboursement de votre commande sous <strong>14 jours maximum</strong> après
                  réception et vérification de votre retour.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">La marche à suivre</h2>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#C6A15B] text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">Déclarez votre retour</h3>
                      <p className="text-gray-700">
                        Connectez-vous à votre compte, rendez-vous dans l'historique de vos commandes et cliquez sur
                        <strong> "Déclarer un retour"</strong>. Choisissez votre mode de dédommagement (avoir ou remboursement).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#C6A15B] text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">Préparez votre colis</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-[#C6A15B] mt-1">•</span>
                          <span>Les articles doivent être dans leur état d'origine, neufs et non portés</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#C6A15B] mt-1">•</span>
                          <span>Avec toutes les étiquettes attachées</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#C6A15B] mt-1">•</span>
                          <span>Indiquez votre numéro de commande dans le colis</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#C6A15B] text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">Expédiez à l'adresse exacte</h3>
                      <Card className="bg-gray-50 border-[#C6A15B] border-2 mt-3">
                        <CardContent className="p-4">
                          <p className="font-semibold text-lg text-gray-900 mb-2">La Boutique de Morgane</p>
                          <p className="text-gray-700">
                            1062, Rue d'Armentières<br/>
                            59850 Nieppe<br/>
                            France
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-amber-50 border-amber-300 border-2 mt-3">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-900">
                              <strong>Important :</strong> Les colis doivent être livrés directement à notre adresse.
                              Nous ne récupérons pas les colis en points relais.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-pink-100 to-purple-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-pink-600" />
                <CardTitle>Note importante sur les cadeaux</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700">
                Un cadeau offert était inclus dans votre commande (offert dès 69€ d'achat) ?
              </p>
              <p className="text-gray-700">
                Si votre retour fait passer le montant de votre commande en dessous de 69€, deux options :
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-1">•</span>
                  <span>Vous nous retournez également le cadeau offert</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-1">•</span>
                  <span>Ou sa valeur sera déduite de votre avoir/remboursement</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="p-6 space-y-3">
              <p className="text-gray-700">
                <strong>Les frais de retour sont à votre charge.</strong> Nous vous recommandons un envoi avec suivi
                pour suivre votre colis.
              </p>
              <p className="text-gray-700">
                <strong>Pour des raisons d'hygiène,</strong> les produits cosmétiques, sous-vêtements et boucles d'oreilles
                ne peuvent pas être repris.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
