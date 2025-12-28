import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';

export default function RetoursGratuitsPage() {
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
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Retours gratuits sous 14 jours
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Chez La Boutique de Morgane, votre satisfaction est notre priorité.
              C'est pourquoi nous vous offrons la possibilité de retourner vos articles gratuitement.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Comment effectuer un retour ?
            </h2>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-gray-700">
                  <strong>Connectez-vous</strong> à votre compte et accédez à vos commandes
                </li>
                <li className="text-gray-700">
                  <strong>Sélectionnez</strong> l'article que vous souhaitez retourner
                </li>
                <li className="text-gray-700">
                  <strong>Demandez</strong> un retour en indiquant le motif
                </li>
                <li className="text-gray-700">
                  <strong>Recevez</strong> votre étiquette de retour par email
                </li>
                <li className="text-gray-700">
                  <strong>Renvoyez</strong> le colis dans son emballage d'origine
                </li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Conditions de retour
            </h2>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-[#C6A15B] mt-1">✓</span>
                <span className="text-gray-700">
                  Les articles doivent être retournés dans leur état d'origine, non portés et non lavés
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C6A15B] mt-1">✓</span>
                <span className="text-gray-700">
                  Les étiquettes doivent être intactes
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C6A15B] mt-1">✓</span>
                <span className="text-gray-700">
                  Le délai de 14 jours court à compter de la réception de votre commande
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C6A15B] mt-1">✓</span>
                <span className="text-gray-700">
                  Les articles soldés et promotionnels sont également éligibles aux retours
                </span>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Remboursement
            </h2>

            <p className="text-gray-700 mb-6">
              Une fois votre retour réceptionné et vérifié, nous procéderons au remboursement
              sous 5 à 7 jours ouvrés sur votre moyen de paiement initial.
            </p>

            <div className="bg-[#C6A15B] bg-opacity-10 border-l-4 border-[#C6A15B] p-6 rounded">
              <p className="text-gray-800 font-medium">
                Pour toute question concernant un retour, n'hésitez pas à contacter
                notre service client à <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] hover:underline">contact@laboutiquedemorgane.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
