import Link from 'next/link';
import { ArrowLeft, Lock, CreditCard, Shield } from 'lucide-react';

export default function PaiementsSecurisesPage() {
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
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Paiements sécurisés
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Votre sécurité est notre priorité. Tous vos paiements sont protégés par les
              technologies de sécurité les plus avancées du marché.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Moyens de paiement acceptés
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-6 w-6 text-[#C6A15B]" />
                  <h3 className="text-xl font-bold text-gray-900">Carte bancaire</h3>
                </div>
                <p className="text-gray-700 mb-3">
                  Nous acceptons les cartes Visa, Mastercard, American Express et CB.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Paiement instantané</li>
                  <li>✓ Cryptage SSL 256 bits</li>
                  <li>✓ 3D Secure</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-[#C6A15B]" />
                  <h3 className="text-xl font-bold text-gray-900">PayPal</h3>
                </div>
                <p className="text-gray-700 mb-3">
                  Payez en toute sécurité avec votre compte PayPal.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Protection des achats</li>
                  <li>✓ Sans partager vos données bancaires</li>
                  <li>✓ Paiement rapide</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-6 w-6 text-[#C6A15B]" />
                  <h3 className="text-xl font-bold text-gray-900">Klarna</h3>
                </div>
                <p className="text-gray-700 mb-3">
                  Payez en 3 ou 4 fois sans frais avec Klarna.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Paiement fractionné</li>
                  <li>✓ Sans frais</li>
                  <li>✓ Acceptation immédiate</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-6 w-6 text-[#C6A15B]" />
                  <h3 className="text-xl font-bold text-gray-900">Virement bancaire</h3>
                </div>
                <p className="text-gray-700 mb-3">
                  Commandez maintenant, payez par virement sous 7 jours.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Aucun frais supplémentaire</li>
                  <li>✓ Confirmation par email</li>
                  <li>✓ Expédition après réception</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Sécurité et protection
            </h2>

            <div className="bg-[#C6A15B] bg-opacity-10 p-6 rounded-lg mb-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Lock className="h-6 w-6 text-[#C6A15B] flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-gray-900">Cryptage SSL 256 bits</strong>
                    <p className="text-gray-700 mt-1">
                      Toutes vos données de paiement sont cryptées avec la même technologie
                      utilisée par les banques pour sécuriser vos transactions.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-[#C6A15B] flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-gray-900">3D Secure</strong>
                    <p className="text-gray-700 mt-1">
                      Authentification renforcée pour valider chaque transaction et vous
                      protéger contre la fraude.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-[#C6A15B] flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-gray-900">Conformité PCI DSS</strong>
                    <p className="text-gray-700 mt-1">
                      Notre plateforme est certifiée PCI DSS niveau 1, le plus haut standard
                      de sécurité pour le traitement des paiements par carte bancaire.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Lock className="h-6 w-6 text-[#C6A15B] flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-gray-900">Données non stockées</strong>
                    <p className="text-gray-700 mt-1">
                      Vos informations bancaires ne sont jamais stockées sur nos serveurs.
                      Elles sont traitées directement par nos partenaires de paiement sécurisés.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Nos partenaires de paiement
            </h2>

            <p className="text-gray-700 mb-6">
              Nous travaillons avec les leaders mondiaux du paiement sécurisé pour garantir
              la protection de vos transactions :
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center font-bold text-gray-700">
                Stripe
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center font-bold text-gray-700">
                PayPal
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center font-bold text-gray-700">
                Klarna
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center font-bold text-gray-700">
                Visa
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Protection de vos données personnelles
            </h2>

            <p className="text-gray-700 mb-6">
              Conformément au RGPD, vos données personnelles sont protégées et ne sont jamais
              partagées avec des tiers sans votre consentement. Pour en savoir plus, consultez
              notre{' '}
              <Link href="/politique-confidentialite" className="text-[#C6A15B] hover:underline font-medium">
                politique de confidentialité
              </Link>.
            </p>

            <div className="bg-[#C6A15B] bg-opacity-10 border-l-4 border-[#C6A15B] p-6 rounded">
              <p className="text-gray-800 font-medium">
                Vous avez une question sur la sécurité de vos paiements ?
                N'hésitez pas à nous contacter à{' '}
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
