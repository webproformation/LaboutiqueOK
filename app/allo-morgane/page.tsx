import { Metadata } from 'next';
import { Mail, Phone, MessageCircle, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: "Contactez Morgane - La Boutique de Morgane",
  description: "Besoin d'un conseil ? Morgane vous répond.",
};

export default function AlloMorganePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <img
              src="https://wp.laboutiquedemorgane.com/wp-content/uploads/2025/12/La-boutique-de-Morgane-Allo-Morgane.png"
              alt="Allô Morgane ?"
              className="w-20 h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Besoin d'un conseil ? Morgane vous répond.
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">
            <div className="bg-gradient-to-br from-[#C6A15B]/10 to-[#C6A15B]/5 rounded-lg p-8 text-center">
              <p className="text-lg text-gray-700 leading-relaxed">
                Derrière l'écran, il n'y a pas de robots, mais une équipe passionnée et humaine. Je suis là pour vous accompagner comme je le ferais avec une amie en boutique.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-8 h-8 text-[#C6A15B]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Une question sur...
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#C6A15B]/5 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">La taille ?</h3>
                  <p className="text-sm text-gray-700">
                    Vous hésitez entre deux tailles pour une robe ?
                  </p>
                </div>
                <div className="bg-[#C6A15B]/5 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Le style ?</h3>
                  <p className="text-sm text-gray-700">
                    Besoin d'idées pour accessoiriser une tenue ?
                  </p>
                </div>
                <div className="bg-[#C6A15B]/5 rounded-lg p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Une commande ?</h3>
                  <p className="text-sm text-gray-700">
                    Vous voulez savoir où en est votre colis ?
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-8 h-8 text-[#C6A15B]" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Comment nous joindre ?
                </h2>
              </div>
              <div className="space-y-6">
                <div className="border-l-4 border-[#C6A15B] pl-6 py-4 bg-[#C6A15B]/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-6 h-6 text-[#C6A15B]" />
                    <h3 className="text-xl font-semibold text-gray-900">Par Email</h3>
                  </div>
                  <a
                    href="mailto:contact@laboutiquedemorgane.com"
                    className="text-[#C6A15B] hover:underline text-lg font-medium"
                  >
                    contact@laboutiquedemorgane.com
                  </a>
                  <p className="text-sm text-gray-600 mt-2">(Réponse sous 24h ouvrées)</p>
                </div>

                <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900">Sur Facebook</h3>
                  </div>
                  <p className="text-gray-700">
                    Envoyez-nous un DM sur <strong>"la boutique de morgane"</strong>, on adore échanger avec vous !
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-6 h-6 text-green-500" />
                    <h3 className="text-xl font-semibold text-gray-900">Par Téléphone / WhatsApp</h3>
                  </div>
                  <div className="space-y-2">
                    <a
                      href="tel:+33641456671"
                      className="text-green-600 hover:underline text-lg font-medium block"
                    >
                      <strong>Morgane</strong> : +33 6 41 45 66 71
                    </a>
                    <a
                      href="tel:+33603489662"
                      className="text-green-600 hover:underline text-lg font-medium block"
                    >
                      <strong>André</strong> : +33 6 03 48 96 62
                    </a>
                    <p className="text-sm text-gray-600 mt-2">(Du lundi au vendredi, de 10h à 18h)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#C6A15B]/10 rounded-lg p-8 text-center border-2 border-[#C6A15B]/30">
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                N'hésitez pas, aucune question n'est bête. Nous sommes là pour que votre expérience shopping soit parfaite !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
