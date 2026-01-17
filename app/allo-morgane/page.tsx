import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MessageCircle, HelpCircle, Package, Shirt, PhoneCall } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import PageContentDisplay from '@/components/PageContentDisplay';
import { supabase } from '@/lib/supabase';

async function getPageContent() {
  const { data } = await supabase
    .from('pages_seo')
    .select('content, title, meta_description')
    .eq('slug', 'allo-morgane')
    .eq('is_published', true)
    .maybeSingle();

  return data;
}

export default async function AlloMorganePage() {
  const pageData = await getPageContent();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader
            icon={PhoneCall}
            title={pageData?.title || "Allo Morgane"}
            description={pageData?.meta_description || "Besoin d'un conseil ? Morgane et André sont là pour vous conseiller, vous rassurer, et surtout... pour vous faire sourire !"}
          />

          {pageData?.content && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <PageContentDisplay content={pageData.content} />
            </div>
          )}

          <Card className="bg-gradient-to-br from-[#D4AF37] to-[#b8933d] text-white">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-lg leading-relaxed">
                Derrière l'écran, il n'y a pas de robots, mais une <strong>équipe passionnée et humaine</strong>.
              </p>
              <p className="text-lg leading-relaxed">
                Morgane et André sont là pour vous conseiller, vous rassurer, et surtout...
                pour vous faire sourire !
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Une question sur...</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#b8933d]/20">
                <CardContent className="p-6 text-center space-y-3">
                  <Shirt className="h-12 w-12 text-[#C6A15B] mx-auto" />
                  <h3 className="text-lg font-semibold">La taille ?</h3>
                  <p className="text-gray-700">
                    Vous hésitez entre deux tailles ? On vous guide avec plaisir !
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <HelpCircle className="h-12 w-12 text-[#C6A15B] mx-auto" />
                  <h3 className="text-lg font-semibold">Le style ?</h3>
                  <p className="text-gray-700">
                    Besoin d'idées pour accessoiriser votre tenue ? Nous adorons ça !
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <Package className="h-12 w-12 text-[#C6A15B] mx-auto" />
                  <h3 className="text-lg font-semibold">Une commande ?</h3>
                  <p className="text-gray-700">
                    Où en est votre colis ? Une question sur un article ? On répond vite !
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Comment nous joindre ?</h2>

            <div className="grid gap-6">
              <Card className="border-[#C6A15B] border-2 bg-gradient-to-br from-[#D4AF37]/10 to-[#b8933d]/10">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#C6A15B] p-3 rounded-full">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Par Email</CardTitle>
                      <p className="text-sm text-gray-600">Réponse sous 24h ouvrées</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <a href="mailto:contact@laboutiquedemorgane.com" className="text-[#C6A15B] text-lg font-semibold hover:underline">
                    contact@laboutiquedemorgane.com
                  </a>
                  <p className="text-sm text-gray-600 mt-2">
                    L'idéal pour les questions détaillées ou les photos à envoyer.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-300 border-2 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle>Sur Facebook</CardTitle>
                      <p className="text-sm text-gray-600">Messagerie instantanée</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <a href="https://www.facebook.com/laboutiquedemorgane" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-lg font-semibold hover:underline">
                    La boutique de morgane
                  </a>
                  <p className="text-sm text-gray-600 mt-2">
                    Envoyez-nous un message privé, on répond rapidement !
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-300 border-2 bg-green-50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 p-3 rounded-full">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Par Téléphone / WhatsApp</CardTitle>
                      <p className="text-sm text-gray-600">Du lundi au vendredi, 10h-18h</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900">Morgane</p>
                    <a href="tel:+33641456671" className="text-green-600 text-lg font-semibold hover:underline">
                      +33 6 41 45 66 71
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">André</p>
                    <a href="tel:+33603489662" className="text-green-600 text-lg font-semibold hover:underline">
                      +33 6 03 48 96 62
                    </a>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    WhatsApp disponible sur ces deux numéros.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-[#C6A15B] to-[#b8933d] text-white">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-xl leading-relaxed">
                N'hésitez pas, aucune question n'est bête.
              </p>
              <p className="text-xl leading-relaxed font-semibold">
                Nous sommes là pour que votre expérience shopping soit parfaite !
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
