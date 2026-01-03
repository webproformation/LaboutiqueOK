"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Sparkles, ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Ambassador {
  id: string;
  week_start_date: string;
  week_end_date: string;
  total_votes: number;
  guestbook_entries: {
    customer_name: string;
    message: string;
    photo_url: string | null;
    rating: number;
  } | {
    customer_name: string;
    message: string;
    photo_url: string | null;
    rating: number;
  }[];
}

export default function WeeklyAmbassador() {
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAmbassador();
  }, []);

  const fetchAmbassador = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("weekly_ambassadors")
        .select(`
          id,
          week_start_date,
          week_end_date,
          total_votes,
          guestbook_entries (
            customer_name,
            message,
            photo_url,
            rating
          )
        `)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        setAmbassador(null);
        return;
      }

      setAmbassador(data);
    } catch (error) {
      setAmbassador(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !ambassador) {
    return null;
  }

  const entryData = Array.isArray(ambassador.guestbook_entries)
    ? ambassador.guestbook_entries[0]
    : ambassador.guestbook_entries;

  if (!entryData) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 dark:from-amber-950/10 dark:via-pink-950/10 dark:to-purple-950/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mb-4 animate-pulse">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-amber-500" />
            Notre Ambassadrice de la Semaine
            <Sparkles className="h-8 w-8 text-amber-500" />
          </h2>
          <p className="text-muted-foreground text-lg">
            Du {format(new Date(ambassador.week_start_date), "dd MMMM", { locale: fr })} au{" "}
            {format(new Date(ambassador.week_end_date), "dd MMMM yyyy", { locale: fr })}
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden border-4 border-amber-400 bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/20 shadow-2xl">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {entryData.photo_url && (
                <div className="relative h-96 md:h-full overflow-hidden">
                  <OptimizedImage
                    src={entryData.photo_url}
                    alt={`Notre ambassadrice ${entryData.customer_name}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 fill-current" />
                    {ambassador.total_votes} votes
                  </div>
                </div>
              )}
              <div className="p-8 flex flex-col justify-center space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="h-8 w-8 fill-amber-500 text-amber-500" />
                    <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                      {entryData.customer_name}
                    </h3>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: entryData.rating }).map((_, i) => (
                      <Sparkles key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-inner">
                  <p className="text-lg leading-relaxed italic text-gray-700 dark:text-gray-300">
                    &quot;{entryData.message}&quot;
                  </p>
                </div>

                <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 rounded-lg border-l-4 border-amber-500">
                  <p className="text-sm font-semibold mb-2">🎁 Ses privilèges de Reine :</p>
                  <ul className="text-sm space-y-1">
                    <li>💰 5,00 € dans sa Cagnotte</li>
                    <li>👑 Badge Couronne Dorée</li>
                    <li>🌟 À l&apos;honneur pendant 7 jours</li>
                  </ul>
                </div>

                <Button asChild size="lg" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <Link href="/livre-dor">
                    <Crown className="mr-2 h-5 w-5" />
                    Devenir Ambassadrice à mon tour
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Vous voulez être la prochaine ? Déposez votre avis et récoltez un maximum de cœurs ❤️
          </p>
        </div>
      </div>
    </section>
  );
}
