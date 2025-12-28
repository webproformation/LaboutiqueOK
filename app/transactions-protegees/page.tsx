import { Metadata } from 'next';
import { Lock, CreditCard, ShoppingBag } from 'lucide-react';

export const metadata: Metadata = {
  title: "Paiement Sécurisé - La Boutique de Morgane",
  description: "Réglez vos achats en toute sérénité.",
};

export default function TransactionsProtegeesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <img
              src="https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/La-boutique-de-Morgane-Transaction-protegees.png"
              alt="Transactions Protégées"
              className="w-20 h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Réglez vos achats en toute sérénité.
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Faites-vous plaisir sans compromis. Notre site utilise les protocoles de sécurité les plus stricts pour protéger vos données bancaires.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-8 h-8 text-[#C6A15B]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Sécurité Maximale
                </h2>
              </div>
              <div className="bg-[#C6A15B]/5 border-l-4 border-[#C6A15B] pl-6 py-6 rounded-r-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Toutes les transactions sont cryptées (SSL) et sécurisées par le protocole 3D Secure. Vous recevrez un code de validation de votre banque pour confirmer que c'est bien vous qui commandez.
                </p>
                <p className="text-gray-700 font-semibold">
                  Nous n'avons jamais accès à vos numéros de carte.
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-8 h-8 text-[#C6A15B]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Vos options de paiement
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-[#C6A15B] rounded-full"></div>
                  <p className="text-gray-700"><strong>Cartes Bancaires :</strong> Visa, Mastercard, CB.</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-[#C6A15B] rounded-full"></div>
                  <p className="text-gray-700"><strong>Paypal :</strong> Simple et rapide.</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag className="w-8 h-8 text-[#C6A15B]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Payez à votre rythme (3x ou 4x sans frais)
                </h2>
              </div>
              <div className="bg-gradient-to-br from-[#C6A15B]/10 to-[#C6A15B]/5 rounded-lg p-8">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Un coup de cœur pour un manteau ou une sélection complète ?
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Ne choisissez plus ! Grâce à notre partenaire Paypal, vous pouvez échelonner votre paiement en 3 ou 4 fois, sans frais supplémentaires.
                </p>
                <div className="bg-white rounded-lg p-6 mt-6">
                  <p className="text-gray-700 font-semibold text-center">
                    Sélectionnez simplement cette option à l'étape du paiement.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Garantie :</strong> Toutes vos informations sont protégées et conformes aux normes RGPD.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
