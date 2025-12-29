"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Users, Ticket, Video, Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCoupons: 0,
    activeCoupons: 0,
    totalCustomers: 0,
    totalLiveStreams: 0,
    activeLiveStreams: 0,
  });
  const [liveStream, setLiveStream] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const [orders, coupons, customers, liveStreams] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('user_coupons').select('id, is_used', { count: 'exact' }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('live_streams').select('id, status', { count: 'exact' }),
      ]);

      const activeCoupons = coupons.data?.filter(c => !c.is_used).length || 0;
      const activeLives = liveStreams.data?.filter(s => s.status === 'live').length || 0;
      const currentLive = liveStreams.data?.find(s => s.status === 'live');

      setStats({
        totalOrders: orders.count || 0,
        totalCoupons: coupons.count || 0,
        activeCoupons,
        totalCustomers: customers.count || 0,
        totalLiveStreams: liveStreams.count || 0,
        activeLiveStreams: activeLives,
      });

      setLiveStream(currentLive);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Commandes',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Clients',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Live Streams',
      value: stats.totalLiveStreams,
      icon: Video,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      badge: stats.activeLiveStreams > 0 ? 'EN DIRECT' : null,
    },
    {
      title: 'Coupons Actifs',
      value: stats.activeCoupons,
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.badge && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />
                    {stat.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {liveStream && (
        <Card className="mb-6 border-red-500 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Radio className="h-5 w-5 text-red-600 mr-2 animate-pulse" />
                Live en cours
              </CardTitle>
              <Badge variant="destructive" className="animate-pulse">
                EN DIRECT
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Un live stream est actuellement en cours. Cliquez ci-dessous pour le gérer.
            </p>
            <Link
              href="/admin/live-streams"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Video className="h-4 w-4 mr-2" />
              Gérer le Live
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenue dans l&apos;administration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Utilisez le menu pour naviguer entre les différentes sections.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Gérez vos produits directement depuis WordPress</li>
              <li>• Suivez et modifiez les commandes</li>
              <li>• Configurez les slides et les produits mis en vedette</li>
              <li>• Organisez des lives shopping en temps réel</li>
              <li>• Gérez les jeux concours et les coupons</li>
              <li>• Consultez la liste des clients</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/live-streams"
              className="block p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <div className="font-medium flex items-center text-red-900">
                <Video className="h-4 w-4 mr-2" />
                Gérer les Lives
                {stats.activeLiveStreams > 0 && (
                  <Badge variant="destructive" className="ml-2 animate-pulse text-xs">
                    {stats.activeLiveStreams} EN DIRECT
                  </Badge>
                )}
              </div>
              <div className="text-sm text-red-700">Créer et diffuser des lives shopping</div>
            </Link>
            <Link
              href="/admin/products"
              className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Ajouter un produit</div>
              <div className="text-sm text-gray-500">Créer un nouveau produit</div>
            </Link>
            <Link
              href="/admin/slides"
              className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Gérer les slides</div>
              <div className="text-sm text-gray-500">Modifier les slides d&apos;accueil</div>
            </Link>
            <Link
              href="/admin/featured-products"
              className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Produits mis en vedette</div>
              <div className="text-sm text-gray-500">Gérer le slider de produits</div>
            </Link>
            <Link
              href="/admin/coupons"
              className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Créer un coupon</div>
              <div className="text-sm text-gray-500">Ajouter un nouveau coupon</div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
