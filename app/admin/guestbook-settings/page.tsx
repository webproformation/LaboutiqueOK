"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, TrendingUp } from "lucide-react";

export default function GuestbookSettingsPage() {
  const [settings, setSettings] = useState({
    diamonds_found: 0,
    total_reviews: 0,
    total_packages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        setSettings({
          diamonds_found: data.diamonds_found,
          total_reviews: data.total_reviews,
          total_packages: data.total_packages,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const supabase = createClient();

      const { data: existingData } = await supabase
        .from("guestbook_settings")
        .select("id")
        .single();

      if (existingData) {
        const { error } = await supabase
          .from("guestbook_settings")
          .update({
            diamonds_found: settings.diamonds_found,
            total_reviews: settings.total_reviews,
            total_packages: settings.total_packages,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guestbook_settings")
          .insert({
            diamonds_found: settings.diamonds_found,
            total_reviews: settings.total_reviews,
            total_packages: settings.total_packages,
          });

        if (error) throw error;
      }

      toast.success("Paramètres enregistrés avec succès !");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Paramètres du Dashboard
        </h1>
        <p className="text-muted-foreground">
          Gérez les compteurs affichés sur la page d&apos;accueil
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Compteurs du Dashboard</CardTitle>
          <CardDescription>
            Mettez à jour les chiffres affichés dans la section &quot;Nos Petits Bonheurs en Chiffres&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="diamonds_found">💎 Diamants dénichés</Label>
              <Input
                id="diamonds_found"
                type="number"
                min="0"
                value={settings.diamonds_found}
                onChange={(e) =>
                  setSettings({ ...settings, diamonds_found: parseInt(e.target.value) || 0 })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Total des diamants cachés trouvés par les clientes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_reviews">✨ Mots doux reçus</Label>
              <Input
                id="total_reviews"
                type="number"
                min="0"
                value={settings.total_reviews}
                onChange={(e) =>
                  setSettings({ ...settings, total_reviews: parseInt(e.target.value) || 0 })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Total des avis validés dans le livre d&apos;or (mis à jour automatiquement)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_packages">📦 Colis chouchoutés et expédiés</Label>
              <Input
                id="total_packages"
                type="number"
                min="0"
                value={settings.total_packages}
                onChange={(e) =>
                  setSettings({ ...settings, total_packages: parseInt(e.target.value) || 0 })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Total historique des colis envoyés depuis le lancement
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
