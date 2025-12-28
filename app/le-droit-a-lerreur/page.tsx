import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Le Droit à l'Erreur - La Boutique de Morgane",
  description: "Retourner un article ? On s'arrange en douceur.",
};

export default function LeDroitALerreurPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <img
              src="https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/La-boutique-de-Morgane-Le-droit-a-lerreur.png"
              alt="Le Droit à l'Erreur"
              className="w-20 h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Retourner un article ? On s'arrange en douceur.
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Oups, le coup de cœur n'a pas opéré une fois porté ? Cela arrive même aux meilleures ! Chez Morgane, vous avez 14 jours après réception pour nous signaler un retour.
              </p>
            </div>

            <div className="border-l-4 border-[#C6A15B] pl-6 py-4 bg-[#C6A15B]/5">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Option 1 : L'Avoir « Shopping Lovers » (Recommandé)
              </h2>
              <p className="text-gray-700 mb-4 font-medium">
                C'est la solution préférée de nos clientes !
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-[#C6A15B] font-bold mt-1">•</span>
                  <span><strong>Rapidité :</strong> Dès réception de votre retour, votre avoir est crédité sur votre compte client.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C6A15B] font-bold mt-1">•</span>
                  <span><strong>Validité :</strong> Utilisable pendant 1 an sur toute la boutique (Mode, Beauté, Maison).</span>
                </li>
              </ul>
            </div>

            <div className="border-l-4 border-gray-300 pl-6 py-4 bg-gray-50">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Option 2 : Le Remboursement Classique
              </h2>
              <p className="text-gray-700 mb-4">
                Vous préférez être remboursée ? Pas de souci.
              </p>
              <p className="text-gray-700">
                Le remboursement est effectué sur le moyen de paiement utilisé lors de la commande, sous 14 jours maximum après réception et vérification de vos articles.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                La marche à suivre (100 % autonome)
              </h2>
              <ol className="space-y-6 text-gray-700">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#C6A15B] text-white font-semibold">1</span>
                  <div className="pt-1">
                    <strong className="block mb-2">Déclarez votre retour :</strong>
                    <span>Dans votre historique de commandes, cliquez sur « Déclarer un retour ». Sélectionnez vos articles et votre mode de dédommagement (avoir ou remboursement).</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#C6A15B] text-white font-semibold">2</span>
                  <div className="pt-1">
                    <strong className="block mb-2">Préparez votre colis :</strong>
                    <span>Glissez les articles (neufs, avec étiquettes) dans leur emballage. Joignez impérativement votre numéro de commande.</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#C6A15B] text-white font-semibold">3</span>
                  <div className="pt-1">
                    <strong className="block mb-2">Expédiez à l'adresse exacte :</strong>
                    <p className="mb-3">Renvoyez votre colis avec le transporteur de votre choix (frais à votre charge) à :</p>
                    <div className="bg-gray-50 border-l-4 border-[#C6A15B] p-4 my-3">
                      <p className="font-semibold">La Boutique de Morgane</p>
                      <p>1062, Rue d'Armentières, 59850 Nieppe</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                      <p className="text-sm">
                        <strong>⚠️ Attention :</strong> Les colis doivent être livrés directement à notre adresse. Nous ne pouvons pas récupérer les colis en points relais ou en consignes. Tout colis non livré à l'adresse exacte sera retourné à l'expéditeur.
                      </p>
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎁 Note particulière sur nos cadeaux
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nous sommes heureux de vous offrir une surprise dès que votre commande atteint 69 €. Si vous effectuez un retour et que le montant total de vos articles conservés devient inférieur à ce palier de 69€, nous vous demandons de bien vouloir glisser le cadeau dans votre colis de retour. Si vous souhaitez le garder, pas de souci ! Sa valeur sera simplement déduite de votre remboursement ou de votre avoir.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Note :</strong> Conformément à nos CGV, les frais de retour restent à votre charge. Les produits cosmétiques, sous-vêtements et boucles d'oreilles descellés ne peuvent être repris par mesure d'hygiène.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
