import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, ShoppingBag, Tv, Phone, Users, Facebook, UserCircle } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function QuiSommesNousPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F2F2E8]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader
            icon={UserCircle}
            title="Qui Sommes-Nous ?"
            description="Découvrez notre histoire, celle d'une passion devenue entreprise, d'un rêve partagé avec des milliers de clientes heureuses."
          />

          <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#b8933d]/20 border-[#C6A15B]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-[#C6A15B]" />
                <CardTitle className="text-2xl">Notre slogan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg italic text-gray-700 leading-relaxed">
                « Votre dose de style et de joie » n'est pas une phrase marketing. C'est le résumé de notre vie depuis 2020.
              </p>
            </CardContent>
          </Card>

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
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                C'est en 2020 que tout a commencé. Morgane, passionnée de mode, a décidé de partager ses pépites avec vous.
                Tout était artisanal, authentique, fait avec les moyens du bord mais surtout... avec une passion immense.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <p className="font-semibold text-[#C6A15B]">Celles qui sont là depuis le début se souviennent :</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C6A15B] mt-1">•</span>
                    <span>C'était l'époque où le scotch des colis s'arrachait... avec les dents !</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C6A15B] mt-1">•</span>
                    <span>C'était les nuits blanches à faire les factures à la main</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C6A15B] mt-1">•</span>
                    <span>C'était artisanal, chaotique, mais rempli d'amour</span>
                  </li>
                </ul>
              </div>
              <p className="text-gray-700 italic">
                "Chaque commande était une victoire, chaque sourire de cliente une récompense."
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
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                En 2023, la vie de Morgane a basculé avec la rencontre du grand Amour. André, touché par cette aventure humaine
                et par la détermination de Morgane, s'est laissé séduire... et pas seulement par elle !
              </p>
              <div className="bg-gradient-to-r from-pink-100 to-red-100 border-l-4 border-pink-500 p-4 rounded">
                <p className="text-gray-800 font-medium">
                  Touché par cette aventure humaine et convaincu que ce projet méritait d'aller plus loin,
                  il a rejoint l'aventure en 2024 !
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Le résultat ? Plus de lives interactifs, plus de structure, encore plus de fous rires...
                et toujours cette même envie : vous faire plaisir.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#D4AF37] via-[#b8933d] to-[#D4AF37] p-6">
              <div className="flex items-center gap-3 text-white">
                <ShoppingBag className="h-8 w-8" />
                <div>
                  <h3 className="text-2xl font-bold">2026 : Bienvenue dans notre (votre) nouvelle maison</h3>
                  <p className="text-white/90">Une Boutique qui vous ressemble</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="h-6 w-6 text-[#C6A15B]" />
                    <h4 className="font-semibold text-lg">Le Shopping Facile</h4>
                  </div>
                  <p className="text-gray-700">
                    Retrouvez nos pépites 24h/24, 7j/7. Plus besoin d'attendre le live pour craquer !
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Tv className="h-6 w-6 text-[#C6A15B]" />
                    <h4 className="font-semibold text-lg">Le Live Intégré</h4>
                  </div>
                  <p className="text-gray-700">
                    Suivez nos directs et shoppez en temps réel. L'expérience live, en encore mieux !
                  </p>
                </div>
              </div>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-gray-800 font-medium">
                  Malgré la technologie, notre promesse reste intacte : <strong>Qualité, Petit Prix, et Bonne Humeur.</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#C6A15B] to-[#b8933d] text-white">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-xl leading-relaxed">
                Merci de faire partie de notre histoire. Merci de nous suivre, de nous soutenir,
                de partager nos fous rires et nos coups de cœur mode.
              </p>
              <p className="text-xl leading-relaxed">
                Vous n'êtes pas seulement des clientes, vous êtes notre <strong>famille</strong>.
              </p>
              <p className="text-2xl font-bold mt-6">
                Avec tout notre amour,<br/>
                <span className="text-white">Morgane & Doudou</span>
              </p>
              <p className="text-lg italic">Vos complices mode.</p>
            </CardContent>
          </Card>

          <Card className="border-[#C6A15B] border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>Besoin de nous contacter ?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-[#C6A15B]/10 p-3 rounded-full">
                  <Phone className="h-5 w-5 text-[#C6A15B]" />
                </div>
                <div>
                  <p className="font-semibold">Morgane</p>
                  <a href="tel:+33641456671" className="text-[#C6A15B] hover:underline">
                    +33 6 41 45 66 71
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#C6A15B]/10 p-3 rounded-full">
                  <Phone className="h-5 w-5 text-[#C6A15B]" />
                </div>
                <div>
                  <p className="font-semibold">André</p>
                  <a href="tel:+33603489662" className="text-[#C6A15B] hover:underline">
                    +33 6 03 48 96 62
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#C6A15B] border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-[#C6A15B]" />
                <CardTitle>On garde le contact ?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <a href="https://facebook.com/laboutiquedemorgane" target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Facebook className="h-5 w-5" />
                    Facebook
                  </a>
                </Button>
                <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <a href="https://instagram.com/laboutiquedemorgane" target="_blank" rel="noopener noreferrer" className="gap-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                </Button>
                <Button asChild className="bg-black hover:bg-gray-800">
                  <a href="https://tiktok.com/@laboutiquedemorgane" target="_blank" rel="noopener noreferrer" className="gap-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
