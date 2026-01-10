'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Diamond, MessageCircleHeart, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DashboardStat {
  diamonds_found: number;
  reviews_validated: number;
  packages_sent: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStat>({
    diamonds_found: 0,
    reviews_validated: 0,
    packages_sent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statsData = [
    {
      icon: Diamond,
      value: stats?.diamonds_found || 0,
      label: 'Diamants dénichés',
      color: 'text-[#D4AF37]',
      bgColor: 'bg-[#D4AF37]/10',
    },
    {
      icon: MessageCircleHeart,
      value: stats?.reviews_validated || 0,
      label: 'Mots doux reçus',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      icon: Package,
      value: stats?.packages_sent || 0,
      label: 'Colis chouchoutés et expédiés',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4" />
                <div className="h-6 bg-gray-200 rounded" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Nos Petits Bonheurs en Chiffres
          </h2>
          <p className="text-gray-600 text-lg">
            Chaque chiffre raconte une histoire de joie partagée
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsData.map((stat, index) => (
            <Card
              key={index}
              className="p-8 hover:shadow-xl transition-shadow duration-300 border-2 hover:border-[#D4AF37]/30"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                  <stat.icon className={`h-10 w-10 ${stat.color}`} />
                </div>
                <div className="space-y-2">
                  <div className={`text-4xl font-bold ${stat.color}`}>
                    {(stat.value || 0).toLocaleString('fr-FR')}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {stat.label}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
