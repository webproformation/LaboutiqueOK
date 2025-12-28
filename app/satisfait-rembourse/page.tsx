import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function SatisfaitRemboursePage() {
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
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Satisfait(e) ou remboursé(e)
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Notre engagement : votre entière satisfaction. Si un article ne vous convient pas,
              nous vous remboursons intégralement, sans condition.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Notre garantie satisfaction
            </h2>

            <div className="bg-[#C6A15B] bg-opacity-10 p-6 rounded-lg mb-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-[#C6A15B] text-xl font-bold">✓</span>
                  <div>
                    <strong className="text-gray-900">14 jours pour changer d'avis</strong>
                    <p className="text-gray-700 mt-1">
                      Vous disposez de 14 jours à compter de la réception de votre commande
                      pour retourner vos articles, sans avoir à vous justifier.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C6A15B] text-xl font-bold">✓</span>
                  <div>
                    <strong className="text-gray-900">Remboursement intégral</strong>
                    <p className="text-gray-700 mt-1">
                      Nous remboursons 100% du montant de vos articles, ainsi que les frais
                      de port initiaux si le retour est dû à une erreur de notre part.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C6A15B] text-xl font-bold">✓</span>
                  <div>
                    <strong className="text-gray-900">Traitement rapide</strong>
                    <p className="text-gray-700 mt-1">
                      Une fois votre retour réceptionné, nous traitons votre demande sous
                      5 à 7 jours ouvrés.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Comment obtenir un remboursement ?
            </h2>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#C6A15B] text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <p className="text-gray-700">
                      <strong>Initiez votre demande de retour</strong> depuis votre espace client
                      dans un délai de 14 jours après réception de votre commande.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#C6A15B] text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <p className="text-gray-700">
                      <strong>Renvoyez l'article</strong> dans son emballage d'origine,
                      accompagné de la facture et des étiquettes intactes.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#C6A15B] text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <p className="text-gray-700">
                      <strong>Recevez votre remboursement</strong> sous 5 à 7 jours ouvrés
                      après validation de votre retour, sur votre moyen de paiement initial.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Cas particuliers
            </h2>

            <div className="space-y-4 mb-6">
              <div className="border-l-4 border-[#C6A15B] pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Article défectueux</h3>
                <p className="text-gray-700">
                  Si vous recevez un article défectueux ou endommagé, contactez-nous immédiatement.
                  Nous prendrons en charge les frais de retour et procéderons à un échange ou
                  un remboursement selon votre préférence.
                </p>
              </div>

              <div className="border-l-4 border-[#C6A15B] pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Erreur de livraison</h3>
                <p className="text-gray-700">
                  Si vous avez reçu un article différent de votre commande, nous organiserons
                  un retour gratuit et vous enverrons le bon produit dans les plus brefs délais.
                </p>
              </div>
            </div>

            <div className="bg-[#C6A15B] bg-opacity-10 border-l-4 border-[#C6A15B] p-6 rounded">
              <p className="text-gray-800 font-medium">
                Une question sur notre garantie satisfaction ? Contactez notre service client à{' '}
                <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">
                  contact@laboutiquedemorgane.com
                </a>{' '}
                ou au <a href="tel:+33641456671" className="text-[#C6A15B] hover:underline"><strong>Morgane</strong> : +33 6 41 45 66 71</a> / <a href="tel:+33603489662" className="text-[#C6A15B] hover:underline"><strong>André</strong> : +33 6 03 48 96 62</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
