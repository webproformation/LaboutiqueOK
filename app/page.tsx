import { HeroSlider } from '@/components/hero-slider';
import { FeaturedProducts } from '@/components/featured-products';
import { HomeCategories } from '@/components/home-categories';
import { VideoShortsSection } from '@/components/VideoShortsSection';
import { DashboardStats } from '@/components/DashboardStats';
import { HomeReviewsCarousel } from '@/components/HomeReviewsCarousel';
import { GamePopupManager } from '@/components/GamePopupManager';
import { LiveBanner } from '@/components/LiveBanner';

export const revalidate = 0;

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LiveBanner />
      <GamePopupManager />

      <main>
        <section className="w-full">
          <HeroSlider />
        </section>

        <HomeCategories />

        <FeaturedProducts />

        <VideoShortsSection />

        <DashboardStats />

        <HomeReviewsCarousel />
      </main>
    </div>
  );
}
