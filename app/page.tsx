import { Header } from '@/components/header';
import { LoyaltyBar } from '@/components/loyalty-bar';
import { HeroSlider } from '@/components/hero-slider';
import { FeaturedProducts } from '@/components/featured-products';
import Link from 'next/link';
import { Sparkles, Gift, Truck } from 'lucide-react';

export const revalidate = 0;

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <LoyaltyBar />

      <main>
        <section className="container mx-auto px-4 py-8">
          <HeroSlider />
        </section>

        <section className="bg-gradient-to-r from-[#F8B4C1]/20 to-[#D4AF37]/20 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4 bg-white rounded-xl p-6 shadow-soft">
                <Truck className="h-12 w-12 text-[#D4AF37]" />
                <div>
                  <h3 className="font-bold text-lg">Livraison Rapide</h3>
                  <p className="text-sm text-gray-600">Colissimo & Mondial Relay</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white rounded-xl p-6 shadow-soft">
                <Gift className="h-12 w-12 text-[#F8B4C1]" />
                <div>
                  <h3 className="font-bold text-lg">Cadeaux Offerts</h3>
                  <p className="text-sm text-gray-600">À partir de 50€ d'achat</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white rounded-xl p-6 shadow-soft">
                <Sparkles className="h-12 w-12 text-[#D4AF37]" />
                <div>
                  <h3 className="font-bold text-lg">Programme Fidélité</h3>
                  <p className="text-sm text-gray-600">Gagnez des euros à chaque achat</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FeaturedProducts />

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">Découvrez Tous Nos Produits</h2>
            <p className="text-gray-600 mb-8">121 produits disponibles</p>
            <Link
              href="/categorie/tous"
              className="inline-block bg-black text-white px-8 py-4 rounded-xl hover:bg-[#D4AF37] transition-smooth shadow-soft"
            >
              Voir le Catalogue
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-[#D4AF37]">La Boutique</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/nouveautes" className="hover:text-[#D4AF37] transition-smooth">Nouveautés</Link></li>
                <li><Link href="/live" className="hover:text-[#D4AF37] transition-smooth">Live Shopping</Link></li>
                <li><Link href="/carte-cadeau" className="hover:text-[#D4AF37] transition-smooth">Carte Cadeau</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-[#D4AF37]">Catégories</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/categorie/mode" className="hover:text-[#D4AF37] transition-smooth">Mode</Link></li>
                <li><Link href="/categorie/beaute" className="hover:text-[#D4AF37] transition-smooth">Beauté</Link></li>
                <li><Link href="/categorie/maison" className="hover:text-[#D4AF37] transition-smooth">Maison</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-[#D4AF37]">Aide</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="hover:text-[#D4AF37] transition-smooth">Contact</Link></li>
                <li><Link href="/livraison" className="hover:text-[#D4AF37] transition-smooth">Livraison</Link></li>
                <li><Link href="/retours" className="hover:text-[#D4AF37] transition-smooth">Retours</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-[#D4AF37]">Suivez-nous</h3>
              <p className="text-sm mb-4">Rejoignez notre communauté</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 La Boutique de Morgane. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
