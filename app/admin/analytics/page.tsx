'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase-client';
import { useAdmin } from '@/hooks/use-admin';
import { Loader2, Users, Eye, Clock, ShoppingCart, TrendingUp, TrendingDown, Monitor } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type TimeRange = 'week' | 'month' | 'year';

interface Stats {
  totalVisits: number;
  uniqueVisitors: number;
  avgTimeSpent: number;
  totalOrders: number;
  totalRevenue: number;
  liveViewers: number;
  visitsChange: number;
  ordersChange: number;
  revenueChange: number;
}

export default function AnalyticsPage() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [browserData, setBrowserData] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAnalytics();
  }, [isAdmin, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      await Promise.all([
        fetchStats(startDate, days),
        fetchVisitsTimeline(startDate),
        fetchTopPages(startDate),
        fetchDeviceStats(startDate),
        fetchBrowserStats(startDate),
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (startDate: Date, days: number) => {
    const { data: visits } = await supabase
      .from('page_visits')
      .select('id, session_id, time_spent_seconds, visited_at')
      .gte('visited_at', startDate.toISOString());

    const { data: orders } = await supabase
      .from('order_analytics')
      .select('order_total, created_at')
      .gte('created_at', startDate.toISOString());

    const { data: liveAnalytics } = await supabase
      .from('live_stream_analytics')
      .select('id')
      .gte('joined_at', startDate.toISOString());

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const { data: prevVisits } = await supabase
      .from('page_visits')
      .select('id')
      .gte('visited_at', prevStartDate.toISOString())
      .lt('visited_at', startDate.toISOString());

    const { data: prevOrders } = await supabase
      .from('order_analytics')
      .select('order_total')
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const uniqueVisitors = new Set(visits?.map(v => v.session_id) || []).size;
    const totalTimeSpent = visits?.reduce((sum, v) => sum + (v.time_spent_seconds || 0), 0) || 0;
    const avgTimeSpent = visits && visits.length > 0 ? Math.round(totalTimeSpent / visits.length) : 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.order_total.toString()), 0) || 0;
    const prevRevenue = prevOrders?.reduce((sum, o) => sum + parseFloat(o.order_total.toString()), 0) || 0;

    const visitsChange = prevVisits && prevVisits.length > 0
      ? Math.round(((visits?.length || 0) - prevVisits.length) / prevVisits.length * 100)
      : 0;

    const ordersChange = prevOrders && prevOrders.length > 0
      ? Math.round(((orders?.length || 0) - prevOrders.length) / prevOrders.length * 100)
      : 0;

    const revenueChange = prevRevenue > 0
      ? Math.round((totalRevenue - prevRevenue) / prevRevenue * 100)
      : 0;

    setStats({
      totalVisits: visits?.length || 0,
      uniqueVisitors,
      avgTimeSpent,
      totalOrders: orders?.length || 0,
      totalRevenue,
      liveViewers: liveAnalytics?.length || 0,
      visitsChange,
      ordersChange,
      revenueChange,
    });
  };

  const fetchVisitsTimeline = async (startDate: Date) => {
    const { data } = await supabase
      .from('page_visits')
      .select('visited_at')
      .gte('visited_at', startDate.toISOString())
      .order('visited_at');

    if (!data) return;

    const groupedData = data.reduce((acc: any, visit) => {
      const date = new Date(visit.visited_at).toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric'
      });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(groupedData).map(([date, visits]) => ({
      date,
      visits,
    }));

    setVisitsData(chartData);
  };

  const fetchTopPages = async (startDate: Date) => {
    const { data } = await supabase
      .from('page_visits')
      .select('page_path, time_spent_seconds')
      .gte('visited_at', startDate.toISOString());

    if (!data) return;

    const grouped = data.reduce((acc: any, visit) => {
      if (!acc[visit.page_path]) {
        acc[visit.page_path] = { count: 0, totalTime: 0 };
      }
      acc[visit.page_path].count++;
      acc[visit.page_path].totalTime += visit.time_spent_seconds || 0;
      return acc;
    }, {});

    const topPagesArray = Object.entries(grouped)
      .map(([path, data]: [string, any]) => ({
        path,
        visits: data.count,
        avgTime: Math.round(data.totalTime / data.count),
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    setTopPages(topPagesArray);
  };

  const fetchDeviceStats = async (startDate: Date) => {
    const { data } = await supabase
      .from('page_visits')
      .select('device_type')
      .gte('visited_at', startDate.toISOString());

    if (!data) return;

    const grouped = data.reduce((acc: any, visit) => {
      const device = visit.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    const deviceArray = Object.entries(grouped).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    setDeviceData(deviceArray);
  };

  const fetchBrowserStats = async (startDate: Date) => {
    const { data } = await supabase
      .from('page_visits')
      .select('browser')
      .gte('visited_at', startDate.toISOString());

    if (!data) return;

    const grouped = data.reduce((acc: any, visit) => {
      const browser = visit.browser || 'Other';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    const browserArray = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);

    setBrowserData(browserArray);
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Accès non autorisé</p>
      </div>
    );
  }

  const COLORS = ['#b8933d', '#305F69', '#DF30CF', '#82ca9d', '#8884d8'];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">7 derniers jours</SelectItem>
            <SelectItem value="month">30 derniers jours</SelectItem>
            <SelectItem value="year">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visites totales</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalVisits.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {stats && stats.visitsChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+{stats.visitsChange}%</span>
                    </>
                  ) : stats && stats.visitsChange < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{stats.visitsChange}%</span>
                    </>
                  ) : null}
                  <span>vs période précédente</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visiteurs uniques</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.uniqueVisitors.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Sessions uniques</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor((stats?.avgTimeSpent || 0) / 60)}:{String((stats?.avgTimeSpent || 0) % 60).padStart(2, '0')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Par visite de page</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {stats && stats.ordersChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+{stats.ordersChange}%</span>
                    </>
                  ) : stats && stats.ordersChange < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{stats.ordersChange}%</span>
                    </>
                  ) : null}
                  <span>vs période précédente</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="visits" className="space-y-4">
            <TabsList>
              <TabsTrigger value="visits">Visites</TabsTrigger>
              <TabsTrigger value="pages">Pages populaires</TabsTrigger>
              <TabsTrigger value="devices">Appareils & Navigateurs</TabsTrigger>
            </TabsList>

            <TabsContent value="visits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des visites</CardTitle>
                  <CardDescription>Nombre de visites par jour</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={visitsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="visits" stroke="#b8933d" strokeWidth={2} name="Visites" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pages les plus visitées</CardTitle>
                  <CardDescription>Top 10 des pages par nombre de visites</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPages.map((page, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{page.path}</p>
                          <p className="text-xs text-muted-foreground">
                            Temps moyen: {Math.floor(page.avgTime / 60)}:{String(page.avgTime % 60).padStart(2, '0')}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-[#b8933d]">{page.visits}</p>
                          <p className="text-xs text-muted-foreground">visites</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appareils</CardTitle>
                    <CardDescription>Répartition par type d'appareil</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Navigateurs</CardTitle>
                    <CardDescription>Top 5 des navigateurs utilisés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={browserData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#b8933d" name="Visites" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
