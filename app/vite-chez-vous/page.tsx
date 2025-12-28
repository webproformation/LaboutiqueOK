import { Metadata } from 'next';
import { Package, Clock, Gift } from 'lucide-react';

export const metadata: Metadata = {
  title: "Livraison Rapide - La Boutique de Morgane",
  description: "Votre colis, préparé avec amour",
};

export default function ViteChezVousPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <img
              src="https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/La-boutique-de-Morgane-Vite-chez-vous.png"
              alt="Vite chez vous"
              className="w-20 h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Votre colis, préparé avec amour
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Chez Morgane, l'expérience commence dès l'ouverture du paquet. On ne se contente pas d'expédier des vêtements : on t'envoie un cadeau que tu te fais à toi-même.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-8 h-8 text-[#C6A15B]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Nos modes de livraison
                </h2>
              </div>
              <p className="text-gray-700 mb-6">
                Nous avons négocié pour vous les meilleurs tarifs pour une livraison fiable et suivie.
              </p>
              <div className="space-y-6">
                <div className="border-l-4 border-[#C6A15B] pl-6 py-4 bg-[#C6A15B]/5">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Chronopost Shop to Shop (3,90€)
                  </h3>
                  <p className="text-gray-700">
                    La solution ultra-rapide et économique ! Votre colis arrive en 1 à 2 jours ouvrés dans le point relais de votre choix.
                  </p>
                </div>

                <div className="border-l-4 border-gray-300 pl-6 py-4 bg-gray-50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Points Relais (Mondial Relay & GLS - 5,90€)
                  </h3>
                  <p className="text-gray-700">
                    La solution écologique. Votre colis vous attend près de chez vous ou de votre bureau. Idéal si vous n'êtes pas souvent à la maison !
                    <strong className="block mt-1">Mondial Relay gratuit dès 80€ d'achat.</strong>
                  </p>
                </div>

                <div className="border-l-4 border-gray-300 pl-6 py-4 bg-gray-50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Livraison à Domicile (GLS 7,90€ / Colissimo 8,90€)
                  </h3>
                  <p className="text-gray-700">
                    Pour celles qui préfèrent le confort de recevoir leur shopping directement dans leur boîte aux lettres ou remis en main propre.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-8 h-8 text-[#C6A15B]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Délais d'expédition
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#C6A15B]/5 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Préparation</h3>
                  <p className="text-gray-700">
                    Toute commande passée avant 12h est généralement préparée le jour même ou le lendemain.
                  </p>
                </div>
                <div className="bg-[#C6A15B]/5 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Réception</h3>
                  <p className="text-gray-700">
                    Comptez 1 à 5 jours ouvrés pour recevoir vos pépites.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <Gift className="w-8 h-8 text-[#C6A15B]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  L'emballage signé Morgane
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#C6A15B]/10 to-[#C6A15B]/5 rounded-lg p-8 text-center">
                <p className="text-lg text-gray-700 leading-relaxed">
                  Chaque commande est emballée avec soin dans du papier de soie, parfumée délicatement et accompagnée d'un petit mot. Parce que vous méritez cette attention.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
