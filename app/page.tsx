import { HeroSlider } from '@/components/hero-slider';
import { FeaturedProducts } from '@/components/featured-products';
import { HomeCategories } from '@/components/home-categories';
import { VideoShortsSection } from '@/components/VideoShortsSection';
import { CustomerReviewsSection } from '@/components/CustomerReviewsSection';
import { GamePopupManager } from '@/components/GamePopupManager';
import Link from 'next/link';
import { Sparkles, Gift, Truck } from 'lucide-react';

export const revalidate = 0;

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <GamePopupManager />

      <main>
        <section className="w-full">
          <HeroSlider />
        </section>

        <HomeCategories />

        <FeaturedProducts />

        <VideoShortsSection />

        <CustomerReviewsSection />

        <section className="py-20 bg-gradient-to-br from-[#F2F2E8] via-white to-[#F2F2E8]">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-6">
                <Sparkles className="w-16 h-16 text-[#D4AF37] mx-auto mb-4 animate-pulse" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#C6A15B] via-[#D4AF37] to-[#C6A15B] bg-clip-text text-transparent">
                L'Élégance à Portée de Clic
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Parcourez notre collection exclusive de 121 pièces soigneusement sélectionnées pour sublimer votre style
              </p>
              <Link
                href="/categorie/tous"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-[#C6A15B] to-[#D4AF37] text-white px-10 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5" />
                Découvrir le Catalogue
                <Sparkles className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-[#D4AF37]/20 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C6A15B] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-gray-900">Style Unique</h3>
                <p className="text-gray-600">Des pièces exclusives pour affirmer votre personnalité</p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-[#D4AF37]/20 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C6A15B] flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-gray-900">Qualité Premium</h3>
                <p className="text-gray-600">Sélection rigoureuse pour votre satisfaction</p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-[#D4AF37]/20 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C6A15B] flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-gray-900">Livraison Soignée</h3>
                <p className="text-gray-600">Votre commande livrée avec attention</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
