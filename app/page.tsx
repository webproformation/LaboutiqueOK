'use client';

import { LiveBanner } from '@/components/LiveBanner'; // <-- Le retour du bandeau !
import { LiveHighlightSection } from '@/components/LiveHighlightSection';
import { Button } from '@/components/ui/button';
import { HeroSlider } from '@/components/hero-slider';
import { FeaturedProducts } from '@/components/featured-products';
import { HomeCategories } from '@/components/home-categories';
import { VideoShortsSection } from '@/components/VideoShortsSection';
import KeyFigures from '@/components/sections/KeyFigures';
import { HomeReviewsCarousel } from '@/components/HomeReviewsCarousel';
import { GamePopupManager } from '@/components/GamePopupManager';


export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. Le Bandeau "EN DIRECT" (s'affiche uniquement si un live est en cours) */}
      <LiveBanner />
      <GamePopupManager />

      <main>
        {/* 2. Votre Hero Banner / Carrousel (Code existant à conserver) */}
        <section className="w-full">
          <HeroSlider />
        </section>

        <HomeCategories />

        <FeaturedProducts />

        <VideoShortsSection />
      
        {/* 3. La Nouvelle Section Live (Affiche le prochain live OU les replays) */}
        <LiveHighlightSection />

        {/* 4. Vos Chiffres Clés */}
        <KeyFigures />

        {/* ... Le reste de votre page d'accueil (Produits, Catégories...) ... */}
        <HomeReviewsCarousel />
      </main>
    </div>
  );
}