import { HeroSlider } from '@/components/hero-slider';
import { FeaturedProducts } from '@/components/featured-products';
import Link from 'next/link';
import { Sparkles, Gift, Truck } from 'lucide-react';

export const revalidate = 0;

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

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
    </div>
  );
}
