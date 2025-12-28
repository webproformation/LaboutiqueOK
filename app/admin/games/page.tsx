'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Settings, Gift, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface GameSettings {
  id: string;
  name: string;
  description: string;
  icon: any;
  is_enabled: boolean;
  table: string;
  settingsUrl: string;
}

export default function GamesManagementPage() {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<GameSettings[]>([]);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const [scratchRes, wheelRes] = await Promise.all([
        supabase.from('scratch_game_settings').select('*').limit(1).maybeSingle(),
        supabase.from('wheel_game_settings').select('*').limit(1).maybeSingle()
      ]);

      if (scratchRes.error) {
        console.error('Scratch game settings error:', scratchRes.error);
        throw new Error('Impossible de charger les paramètres du jeu de grattage');
      }

      if (wheelRes.error) {
        console.error('Wheel game settings error:', wheelRes.error);
        throw new Error('Impossible de charger les paramètres de la roue');
      }

      let scratchData = scratchRes.data;
      let wheelData = wheelRes.data;

      if (!scratchData) {
        const { data: newScratch, error: createError } = await supabase
          .from('scratch_game_settings')
          .insert({
            is_enabled: false,
            win_probability: 0.3,
            max_plays_per_day: 1,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating scratch game settings:', createError);
          throw new Error('Impossible de créer les paramètres du jeu de grattage');
        }

        scratchData = newScratch;
      }

      if (!wheelData) {
        const { data: newWheel, error: createError } = await supabase
          .from('wheel_game_settings')
          .insert({
            is_enabled: false,
            show_popup: false,
            max_plays_per_day: 1,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wheel game settings:', createError);
          throw new Error('Impossible de créer les paramètres de la roue');
        }

        wheelData = newWheel;
      }

      const gamesData: GameSettings[] = [
        {
          id: scratchData.id,
          name: 'Jeu de Grattage',
          description: 'Jeu de carte à gratter avec des gains instantanés',
          icon: Sparkles,
          is_enabled: scratchData.is_enabled,
          table: 'scratch_game_settings',
          settingsUrl: '/admin/scratch-game-settings'
        },
        {
          id: wheelData.id,
          name: 'Roue de la Fortune',
          description: 'Roue de loterie avec zones gagnantes et perdantes',
          icon: Gift,
          is_enabled: wheelData.is_enabled,
          table: 'wheel_game_settings',
          settingsUrl: '/admin/wheel-game-settings'
        }
      ];

      setGames(gamesData);
    } catch (error) {
      console.error('Error loading games:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors du chargement des jeux'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleGame = async (game: GameSettings, enabled: boolean) => {
    try {
      if (enabled) {
        for (const otherGame of games) {
          if (otherGame.id !== game.id && otherGame.is_enabled) {
            const { error } = await supabase
              .from(otherGame.table)
              .update({ is_enabled: false })
              .eq('id', otherGame.id);

            if (error) {
              console.error('Error disabling other game:', error);
              throw error;
            }
          }
        }
      }

      const { error } = await supabase
        .from(game.table)
        .update({ is_enabled: enabled })
        .eq('id', game.id);

      if (error) {
        console.error('Error updating game:', error);
        throw error;
      }

      toast.success(
        enabled
          ? `${game.name} activé avec succès`
          : `${game.name} désactivé avec succès`
      );

      await loadGames();
    } catch (error) {
      console.error('Error toggling game:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la mise à jour'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  const activeGame = games.find((g) => g.is_enabled);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Jeux</h1>
        <p className="text-muted-foreground mt-2">
          Activez et configurez les jeux disponibles sur votre site
        </p>
        {activeGame && (
          <Badge variant="default" className="mt-4">
            Jeu actif : {activeGame.name}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Card key={game.id} className={game.is_enabled ? 'border-green-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{game.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {game.description}
                      </CardDescription>
                    </div>
                  </div>
                  {game.is_enabled && (
                    <Badge variant="default">Actif</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut</span>
                  <Switch
                    checked={game.is_enabled}
                    onCheckedChange={(checked) => toggleGame(game, checked)}
                  />
                </div>

                <Link href={game.settingsUrl}>
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            ℹ️ Important
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            • Un seul jeu peut être actif à la fois
          </p>
          <p>
            • Configurez les paramètres du jeu avant de l&apos;activer
          </p>
          <p>
            • Les utilisateurs verront le jeu actif sur la page d&apos;accueil
          </p>
        </CardContent>
      </Card>
    </div>
  );
}