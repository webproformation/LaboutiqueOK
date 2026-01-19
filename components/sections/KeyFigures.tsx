'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Gem, Heart, Truck, Sparkles } from 'lucide-react'; // Ajout de Sparkles
import { Card } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/SectionTitle'; // Import du nouveau composant

// ... (Gardez la fonction useCounter telle quelle) ...
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
}

export default function KeyFigures() {
  const [stats, setStats] = useState({
    diamonds: 0,
    reviews: 0,
    shipped: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase.rpc('get_homepage_stats');
        if (error) throw error;
        if (data) {
          setStats({
            diamonds: Number(data.diamonds) || 0,
            reviews: Number(data.reviews) || 0,
            shipped: Number(data.shipped) || 0
          });
        }
      } catch (err) {
        console.error('Erreur chargement stats:', err);
      }
    }
    fetchStats();
  }, []);

  const animatedDiamonds = useCounter(stats.diamonds);
  const animatedReviews = useCounter(stats.reviews);
  const animatedShipped = useCounter(stats.shipped);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        
        {/* NOUVEAU TITRE HARMONISÉ */}
        <SectionTitle 
          title="Nos Petits Bonheurs en Chiffres" 
          subtitle="Chaque chiffre raconte une histoire de joie partagée"
          icon={Sparkles}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ... (Le reste des Cartes reste identique) ... */}
          <Card className="p-8 text-center border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-yellow-50 to-white">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
              <Gem className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-[#D4AF37] mb-2 font-display">
              {animatedDiamonds}
            </div>
            <div className="text-gray-600 font-medium">Diamants dénichés</div>
          </Card>

          <Card className="p-8 text-center border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-pink-50 to-white">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-pink-100 text-pink-500">
              <Heart className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-pink-500 mb-2 font-display">
              {animatedReviews}
            </div>
            <div className="text-gray-600 font-medium">Mots doux reçus</div>
          </Card>

          <Card className="p-8 text-center border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-white">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-green-100 text-green-500">
              <Truck className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-green-500 mb-2 font-display">
              {animatedShipped}
            </div>
            <div className="text-gray-600 font-medium">Colis chouchoutés</div>
          </Card>
        </div>
      </div>
    </section>
  );
}