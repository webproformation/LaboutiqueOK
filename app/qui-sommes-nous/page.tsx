import { Card, CardContent } from '@/components/ui/card';
import { Heart, Sparkles, Users, Smile, ShoppingBag, Tv, Facebook, Instagram, Phone } from 'lucide-react';
import Image from 'next/image';

export default function QuiSommesNousPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Bienvenue dans la famille
            </h1>
            <div className="inline-block">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#b8933d] bg-clip-text text-transparent mb-6">
                "La Boutique de Morgane"
              </h2>
            </div>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Si vous lisez ces lignes, c'est que vous cherchez bien plus que des vêtements.
              Vous cherchez une histoire, un sourire, et peut-être un peu de folie.
              Ça tombe bien, vous êtes exactement au bon endroit.
            </p>
          </div>

          <Card className="mb-8 bg-gradient-to-br from-[#D4AF37]/10 to-[#F2F2E8] border-[#D4AF37]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Notre slogan</h3>
              </div>
              <p className="text-lg text-gray-700 italic">
                « Votre dose de style et de joie » n'est pas une phrase marketing.
                C'est le résumé de notre vie depuis 2020.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#b8933d] p-6">
                <div className="flex items-center gap-3 text-white">
                  <Sparkles className="h-8 w-8" />
                  <div>
                    <h3 className="text-2xl font-bold">2020 : Le "Système D" et la Passion</h3>
                    <p className="text-white/90">L'ère Morgane</p>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Tout a commencé par une envie simple : partager ma passion pour la mode et apporter de la joie,
                  même à distance. Morgane s'est lancée seule, armée de son téléphone et d'une énergie débordante.
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Celles qui sont là depuis le début (merci, vous êtes nos piliers !) s'en souviennent avec le sourire :
                </p>
                <div className="bg-[#F2F2E8] rounded-lg p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></div>
                    <p className="text-gray-700">
                      <strong>C'était l'époque où le scotch des colis s'arrachait... avec les dents !</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></div>
                    <p className="text-gray-700">
                      <strong>C'était les nuits blanches</strong> à faire les factures à la main après des heures de live.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></div>
                    <p className="text-gray-700">
                      C'était artisanal, c'était parfois chaotique, mais c'était surtout <strong>rempli d'amour</strong>.
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mt-4 italic">
                  C'est dans ces moments-là, entre deux éclats de rire et trois cartons,
                  que les fondations de cette "Team" ont été posées.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-red-500 p-6">
                <div className="flex items-center gap-3 text-white">
                  <Heart className="h-8 w-8 fill-current" />
                  <div>
                    <h3 className="text-2xl font-bold">2023 : L'Amour s'en mêle</h3>
                    <p className="text-white/90">Le Duo de Choc</p>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  En 2023, la vie de Morgane a basculé avec la rencontre du grand Amour.
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Au fil des discussions, Morgane lui a raconté ses journées, non pas comme un travail,
                  mais comme une relation privilégiée avec vous. Elle lui a parlé de cette proximité unique,
                  de ce lien qui fait que nos clientes sont bien plus que des clientes :
                  elles sont une extension de notre famille.
                </p>
                <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-lg p-6 my-4 border-l-4 border-pink-500">
                  <p className="text-gray-800 font-semibold">
                    Touché par cette aventure humaine et par l'énergie incroyable de la Team,
                    il a fait le grand saut. En 2024, il rejoint officiellement l'aventure !
                  </p>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Son arrivée a tout changé : plus de lives, plus de structure, mais surtout encore plus de fous rires.
                  Ensemble, nous avons transformé les sessions shopping en véritables événements,
                  mêlant jeux, détente et mode. Parce que s'habiller, c'est bien, mais s'amuser en le faisant, c'est mieux !
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-[#D4AF37] via-[#b8933d] to-[#D4AF37] p-6">
                <div className="flex items-center gap-3 text-white">
                  <ShoppingBag className="h-8 w-8" />
                  <div>
                    <h3 className="text-2xl font-bold">2026 : Bienvenue dans notre (votre) nouvelle maison</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6">
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Aujourd'hui, nous écrivons un nouveau chapitre. Nous avons voulu créer un endroit
                  qui nous ressemble et qui <strong>VOUS</strong> rassemble.
                </p>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Ce site web, c'est notre nouvelle maison. Nous l'avons imaginé pour nous rapprocher encore plus de vous :
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#F2F2E8] rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900">Le Shopping Facile</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      Retrouvez nos pépites 24h/24.
                    </p>
                  </div>
                  <div className="bg-[#F2F2E8] rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
                        <Tv className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900">Le Live Intégré</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      La grande nouveauté ! Suivez nos directs et shoppez en temps réel directement ici,
                      sans changer de plateforme.
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                  <p className="text-center text-lg font-semibold text-gray-900">
                    Malgré la technologie, notre promesse reste intacte :
                    <span className="text-green-700"> Qualité, Petit Prix, et Bonne Humeur.</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#D4AF37] to-[#b8933d] text-white">
              <CardContent className="pt-6 pb-6">
                <div className="text-center">
                  <p className="text-xl mb-4 leading-relaxed">
                    Merci de faire partie de notre histoire. Que vous soyez là depuis l'époque du scotch
                    ou que vous veniez d'arriver, <strong>bienvenue dans la famille</strong>.
                  </p>
                  <div className="my-6">
                    <p className="text-lg mb-2">Avec tout notre amour,</p>
                    <p className="text-2xl font-bold">Morgane & Doudou</p>
                    <p className="text-white/90">Vos complices mode.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#D4AF37]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Phone className="h-8 w-8 text-[#D4AF37]" />
                    <h3 className="text-2xl font-bold text-gray-900">Besoin de nous contacter ?</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    N'hésitez pas à nous appeler, nous sommes là pour vous accompagner !
                  </p>
                  <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#b8933d]/10 rounded-lg p-6 mb-6">
                    <div className="space-y-3">
                      <a
                        href="tel:+33641456671"
                        className="text-lg font-semibold text-[#D4AF37] hover:underline block"
                      >
                        Morgane : +33 6 41 45 66 71
                      </a>
                      <a
                        href="tel:+33603489662"
                        className="text-lg font-semibold text-[#D4AF37] hover:underline block"
                      >
                        André : +33 6 03 48 96 62
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#D4AF37]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Users className="h-8 w-8 text-[#D4AF37]" />
                    <h3 className="text-2xl font-bold text-gray-900">On garde le contact ?</h3>
                  </div>
                  <p className="text-gray-700 mb-6">
                    Même si nous avons notre beau site, on ne vous lâche pas sur les réseaux !
                    Retrouvez nos coulisses et nos délires quotidiens ici :
                  </p>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <a
                      href="https://www.facebook.com/p/La-boutique-de-Morgane-100057420760713/?locale=fr_FR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Facebook className="h-5 w-5" />
                      <span className="font-medium">Facebook</span>
                    </a>
                    <a
                      href="https://www.instagram.com/la.boutique.de.morgane/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                      <span className="font-medium">Instagram</span>
                    </a>
                    <a
                      href="https://www.tiktok.com/@laboutiquedemorgane"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-lg transition-colors"
                    >
                      <Smile className="h-5 w-5" />
                      <span className="font-medium">TikTok</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
