"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent } from "@/components/ui/card";
import { Gem, Heart, Package } from "lucide-react";

interface GuestbookSettings {
  diamonds_found: number;
  total_reviews: number;
  total_packages: number;
}

export default function GuestbookCounters() {
  const [settings, setSettings] = useState<GuestbookSettings>({
    diamonds_found: 0,
    total_reviews: 0,
    total_packages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guestbook_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching guestbook settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  const counters = [
    {
      icon: Gem,
      value: settings.diamonds_found,
      label: "Diamants dénichés",
      gradient: "from-amber-500 to-amber-600",
      bg: "from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20",
    },
    {
      icon: Heart,
      value: settings.total_reviews,
      label: "Mots doux reçus",
      gradient: "from-pink-500 to-pink-600",
      bg: "from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/20",
    },
    {
      icon: Package,
      value: settings.total_packages,
      label: "Colis chouchoutés",
      gradient: "from-purple-500 to-purple-600",
      bg: "from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Nos Petits Bonheurs en Chiffres</h2>
          <p className="text-muted-foreground text-lg">
            Chaque chiffre raconte une histoire de bonheur partagé
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {counters.map((counter, index) => {
            const Icon = counter.icon;
            return (
              <Card
                key={index}
                className={`overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br ${counter.bg}`}
              >
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${counter.gradient} mb-6`}>
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-5xl font-bold bg-gradient-to-r ${counter.gradient} bg-clip-text text-transparent">
                      {counter.value.toLocaleString("fr-FR")}
                    </p>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {counter.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
