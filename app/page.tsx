import { HeroSlider } from '@/components/hero-slider';
import { FeaturedProducts } from '@/components/featured-products';
import { HomeCategories } from '@/components/home-categories';
import { VideoShortsSection } from '@/components/VideoShortsSection';
import { CustomerReviewsSection } from '@/components/CustomerReviewsSection';
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

        <HomeCategories />

        <FeaturedProducts />

        <VideoShortsSection />

        <CustomerReviewsSection />

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4 text-center" style={{ color: '#C6A15B' }}>Découvrez Tous Nos Produits</h2>
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
