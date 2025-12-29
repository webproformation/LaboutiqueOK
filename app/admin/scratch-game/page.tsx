"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface GamePlay {
  id: string;
  user_id: string;
  result: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  user_coupons: {
    code: string;
    coupon_types: {
      description: string;
    };
  } | null;
}

export default function AdminScratchGame() {
  const [plays, setPlays] = useState<GamePlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    wins: 0,
    losses: 0,
  });

  useEffect(() => {
    const fetchPlays = async () => {
      setLoading(true);

      const { data: playsData, error: playsError } = await supabase
        .from('scratch_game_plays')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(50);

      if (playsError) {
        console.error('Error fetching scratch game plays:', playsError.message || playsError);
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(playsData?.map(p => p.user_id) || []));

      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p]) || []
      );

      const { data: couponsData } = await supabase
        .from('user_coupons')
        .select(`
          id,
          code,
          user_id,
          coupon_type_id,
          coupon_types(description)
        `)
        .in('user_id', userIds)
        .eq('source', 'scratch_game');

      const couponsMap = new Map(
        couponsData?.map(c => [`${c.user_id}`, c]) || []
      );

      const enrichedPlays = playsData?.map(play => ({
        ...play,
        profiles: profilesMap.get(play.user_id) || { first_name: 'Inconnu', last_name: '' },
        user_coupons: play.result === 'win' ? couponsMap.get(play.user_id) || null : null,
      })) || [];

      setPlays(enrichedPlays);
      const total = enrichedPlays.length;
      const wins = enrichedPlays.filter(p => p.result === 'win').length;
      setStats({
        total,
        wins,
        losses: total - wins,
      });

      setLoading(false);
    };

    fetchPlays();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Jeux Concours - Statistiques</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Parties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Victoires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.wins}</div>
            <div className="text-sm text-gray-500">
              {stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Défaites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.losses}</div>
            <div className="text-sm text-gray-500">
              {stats.total > 0 ? Math.round((stats.losses / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des Parties</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-2">
              {plays.map((play) => (
                <div
                  key={play.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {play.profiles?.first_name} {play.profiles?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(play.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        play.result === 'win'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {play.result === 'win' ? 'Victoire' : 'Défaite'}
                    </span>
                    {play.user_coupons && (
                      <p className="text-sm text-gray-600 mt-1">
                        {play.user_coupons.coupon_types?.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
