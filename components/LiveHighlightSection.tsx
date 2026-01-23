'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Play, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: 'live' | 'scheduled' | 'ended';
  scheduled_start: string;
  thumbnail_url: string | null;
}

export function LiveHighlightSection() {
  const [nextLive, setNextLive] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNextLive() {
      try {
        // On cherche d'abord un live EN COURS
        const { data: liveNow } = await supabase
          .from('live_streams')
          .select('*')
          .eq('status', 'live')
          .maybeSingle();

        if (liveNow) {
          setNextLive(liveNow);
        } else {
          // Sinon on cherche le prochain PROGRAMMÉ
          const { data: scheduled } = await supabase
            .from('live_streams')
            .select('*')
            .eq('status', 'scheduled')
            .gt('scheduled_start', new Date().toISOString())
            .order('scheduled_start', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          setNextLive(scheduled);
        }
      } catch (error) {
        console.error("Erreur chargement live", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNextLive();
  }, []);

  if (loading) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#F9F5EB] to-white shadow-2xl">
        
        {/* Décoration d'arrière-plan */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative z-10 grid gap-8 p-8 md:grid-cols-2 md:items-center lg:p-12">
          
          {/* COLONNE GAUCHE : TEXTE */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#FFFBEB] px-4 py-1.5 text-sm font-semibold text-[#D4AF37]">
              <Sparkles className="h-4 w-4" />
              {nextLive?.status === 'live' ? 'EN DIRECT MAINTENANT' : 'L\'EXPÉRIENCE LIVE SHOPPING'}
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              {nextLive ? (
                <>
                  <span className="block text-[#D4AF37]">{nextLive.title}</span>
                  {nextLive.status === 'live' ? 'Rejoignez-nous vite !' : 'Ne manquez pas le rendez-vous'}
                </>
              ) : (
                <>
                  Découvrez nos pépites <br/>
                  <span className="text-[#D4AF37]">en Live & Replay</span>
                </>
              )}
            </h2>

            <p className="text-lg text-gray-600">
              {nextLive ? (
                nextLive.description || "Une session shopping exclusive avec essayages, conseils et bonne humeur. Préparez votre panier !"
              ) : (
                "Retrouvez Morgane en vidéo pour découvrir les nouvelles collections portées, les conseils morpho et profitez d'offres exclusives pendant nos sessions."
              )}
            </p>

            {nextLive && nextLive.status === 'scheduled' && (
              <div className="flex items-center gap-3 text-lg font-medium text-gray-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
                  <Calendar className="h-5 w-5" />
                </div>
                {format(new Date(nextLive.scheduled_start), "EEEE d MMMM à HH'h'mm", { locale: fr })}
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className={`bg-[#D4AF37] text-white hover:bg-[#b8933d] ${nextLive?.status === 'live' ? 'animate-pulse' : ''}`}>
                <Link href={nextLive ? "/live" : "/live"}>
                  {nextLive?.status === 'live' ? (
                    <>
                      <Play className="mr-2 h-5 w-5" /> REJOINDRE LE LIVE
                    </>
                  ) : nextLive ? (
                    "M'INSCRIRE / VOIR LE LIVE"
                  ) : (
                    "VOIR LES REPLAYS"
                  )}
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10">
                <Link href="/live">
                  TOUS NOS LIVES <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* COLONNE DROITE : VISUEL */}
          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="aspect-video overflow-hidden rounded-2xl bg-gray-100 shadow-xl border-4 border-white">
              {nextLive?.thumbnail_url ? (
                <img 
                  src={nextLive.thumbnail_url} 
                  alt={nextLive.title} 
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                   {/* Fallback visuel si pas d'image */}
                   <div className="text-center text-white">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20 backdrop-blur-sm">
                        <Video className="h-8 w-8 text-[#D4AF37]" />
                      </div>
                      <p className="font-semibold">La Boutique de Morgane</p>
                      <p className="text-sm opacity-70">Live Shopping</p>
                   </div>
                </div>
              )}
              
              {/* Badge Overlay */}
              {nextLive?.status === 'live' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-white" /> EN DIRECT
                </div>
              )}
            </div>
            
            {/* Élément décoratif flottant */}
            <div className="absolute -bottom-6 -right-6 hidden lg:block">
              <div className="rounded-xl bg-white p-4 shadow-xl border border-[#D4AF37]/20">
                <div className="flex items-center gap-3">
                   <div className="flex -space-x-2">
                     <div className="h-8 w-8 rounded-full bg-pink-100 border-2 border-white" />
                     <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-white" />
                     <div className="h-8 w-8 rounded-full bg-green-100 border-2 border-white" />
                   </div>
                   <div className="text-xs font-medium text-gray-600">
                     <span className="block text-[#D4AF37] font-bold">+1.2k Viewers</span>
                     Rejoignent l'aventure
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}