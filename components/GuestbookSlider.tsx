"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Gem, ShieldCheck, ArrowRight, Facebook } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Autoplay from "embla-carousel-autoplay";

interface GuestbookEntry {
  id: string;
  customer_name: string;
  rating: number;
  message: string;
  photo_url: string | null;
  approved_at: string;
  source: 'site' | 'facebook';
}

export default function GuestbookSlider() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLatestEntries();
  }, []);

  const fetchLatestEntries = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select("id, customer_name, rating, message, photo_url, approved_at, source")
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching guestbook entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || entries.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/10 dark:to-purple-950/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mb-4">
            <Gem className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Nos Mots Doux</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Découvrez ce que nos clientes adorent dans leurs derniers achats
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {entries.map((entry) => (
              <CarouselItem key={entry.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-0 flex flex-col h-full">
                    {entry.photo_url && (
                      <div className="relative h-64 w-full overflow-hidden">
                        <OptimizedImage
                          src={entry.photo_url}
                          alt={`Photo de ${entry.customer_name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{entry.customer_name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {entry.source === 'facebook' ? (
                              <>
                                <Facebook className="h-3 w-3 text-blue-600" />
                                <span className="text-blue-600">Avis Facebook</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3 w-3" />
                                Achat Vérifié
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: entry.rating }).map((_, i) => (
                            <Gem key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed mb-4 flex-1 line-clamp-4">
                        {entry.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.approved_at), "MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
            <Link href="/livre-dor">
              <Gem className="h-5 w-5" />
              Découvrir tous les mots doux dans le Livre d&apos;Or
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
