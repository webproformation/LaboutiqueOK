import Link from 'next/link';
import { ArrowLeft, Truck } from 'lucide-react';

export default function FraisDePortPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#C6A15B] p-3 rounded-full">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Frais de port offerts
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Profitez de la livraison gratuite en Point Relais pour toutes vos commandes
              à partir de 80€ d'achat.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Modes de livraison
            </h2>

            <div className="space-y-6 mb-8">
              <div className="bg-[#C6A15B] bg-opacity-10 p-6 rounded-lg border border-[#C6A15B]">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Chronopost (Shop to Shop)
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>3,90€</strong>
                  </p>
                  <p className="text-gray-700">
                    Délai de livraison : <strong>1 à 2 jours ouvrés</strong>
                  </p>
                  <p className="text-gray-600 text-sm">
                    La solution la plus rapide et économique !
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Mondial Relay
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>Gratuit</strong> à partir de 80€ d'achat
                  </p>
                  <p className="text-gray-700">
                    <strong>5,90€</strong> pour les commandes inférieures à 80€
                  </p>
                  <p className="text-gray-700">
                    Délai de livraison : <strong>3 à 5 jours ouvrés</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  GLS Point Relais
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>5,90€</strong>
                  </p>
                  <p className="text-gray-700">
                    Délai de livraison : <strong>2 à 4 jours ouvrés</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  GLS Domicile
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>7,90€</strong>
                  </p>
                  <p className="text-gray-700">
                    Délai de livraison : <strong>2 à 4 jours ouvrés</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Colissimo Domicile
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>8,90€</strong>
                  </p>
                  <p className="text-gray-700">
                    Délai de livraison : <strong>2 à 4 jours ouvrés</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Retrait en boutique
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>Gratuit</strong> (quel que soit le montant de la commande)
                  </p>
                  <p className="text-gray-700">
                    Disponible sous <strong>24 à 48h</strong>
                  </p>
                  <p className="text-gray-700 text-sm mt-2">
                    1062 rue d'Armentières, 59850 Nieppe
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Suivi de commande
            </h2>

            <p className="text-gray-700 mb-6">
              Dès l'expédition de votre colis, vous recevrez un email avec votre numéro de suivi.
              Vous pourrez suivre l'acheminement de votre commande en temps réel.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Zones de livraison
            </h2>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-[#C6A15B] mt-1">✓</span>
                <span className="text-gray-700">
                  France métropolitaine
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C6A15B] mt-1">✓</span>
                <span className="text-gray-700">
                  Belgique
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C6A15B] mt-1">✓</span>
                <span className="text-gray-700">
                  Luxembourg
                </span>
              </li>
            </ul>

            <div className="bg-[#C6A15B] bg-opacity-10 border-l-4 border-[#C6A15B] p-6 rounded">
              <p className="text-gray-800 font-medium">
                Pour toute question concernant la livraison, contactez-nous à{' '}
                <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">
                  contact@laboutiquedemorgane.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
