import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ShieldCheck, CreditCard, ShoppingBag } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function TransactionsProtegeesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader
            icon={Lock}
            title="Transactions Protégées"
            description="Votre sécurité est notre priorité. Toutes vos transactions sont cryptées et protégées selon les normes les plus strictes."
          />

          <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#b8933d]/20 border-l-4 border-[#C6A15B]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-8 w-8 text-[#C6A15B]" />
                <CardTitle className="text-2xl">Sécurité Maximale</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-gray-700">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#C6A15B] mt-1 flex-shrink-0" />
                  <span>Toutes les transactions sont <strong>cryptées avec un protocole SSL</strong> de dernière génération</span>
                </p>
                <p className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#C6A15B] mt-1 flex-shrink-0" />
                  <span>Protocole de paiement sécurisé <strong>3D Secure</strong> pour une double authentification</span>
                </p>
                <p className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#C6A15B] mt-1 flex-shrink-0" />
                  <span><strong>Nous n'avons jamais accès à vos numéros de carte bancaire</strong></span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg mt-4">
                <p className="text-sm text-gray-600 italic">
                  Tous les paiements sont traités par des prestataires certifiés et conformes aux normes PCI-DSS
                  (Payment Card Industry Data Security Standard).
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Vos options de paiement</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-[#C6A15B]" />
                    <CardTitle>Cartes Bancaires</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">
                    Payez en toute sécurité avec votre carte bancaire :
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-gray-100 px-4 py-2 rounded font-semibold text-gray-700">Visa</div>
                    <div className="bg-gray-100 px-4 py-2 rounded font-semibold text-gray-700">Mastercard</div>
                    <div className="bg-gray-100 px-4 py-2 rounded font-semibold text-gray-700">CB</div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Paiement instantané et sécurisé avec validation par 3D Secure.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#003087">
                      <path d="M20.905 9.5c0-2.423-1.581-4.557-4.005-4.557-2.422 0-4.005 2.134-4.005 4.557 0 2.422 1.583 4.557 4.005 4.557 2.424 0 4.005-2.135 4.005-4.557zm-11.905 0c0-2.423-1.581-4.557-4.005-4.557C2.573 4.943 1 7.077 1 9.5c0 2.422 1.573 4.557 3.995 4.557 2.424 0 4.005-2.135 4.005-4.557z"/>
                    </svg>
                    <CardTitle>PayPal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">
                    Payez simplement avec votre compte PayPal sans ressaisir vos coordonnées bancaires.
                  </p>
                  <p className="text-sm text-gray-600 mt-3">
                    Simple, rapide et ultra-sécurisé.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-[#D4AF37] to-[#b8933d] text-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ShoppingBag className="h-16 w-16 flex-shrink-0" />
                <div className="text-center md:text-left space-y-3">
                  <h3 className="text-2xl font-bold">Payez à votre rythme</h3>
                  <p className="text-lg">
                    Réglez vos achats en <strong>3x ou 4x sans frais</strong> via PayPal
                  </p>
                  <p className="text-white/90">
                    Sélectionnez simplement cette option à l'étape du paiement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Lock className="h-8 w-8 text-green-600 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Garantie de protection</h3>
                  <p className="text-gray-700">
                    Toutes vos informations personnelles et bancaires sont protégées et traitées
                    conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong>.
                  </p>
                  <p className="text-gray-700">
                    Vos données ne sont jamais stockées sur nos serveurs et sont uniquement transmises
                    de manière cryptée à nos prestataires de paiement certifiés.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-700">
                Une question sur nos modes de paiement ?
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
